// index.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import Subvention from './subvention.model.js';

dotenv.config();

const {PORT, DB_URL, OPENAI_API} = process.env;

const language = "french";
const sessions = {}; // In-memory store to keep track of conversations

// Initialize OpenAI API client
const client = new OpenAI({
  apiKey: OPENAI_API, // This is the default and can be omitted
});

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Data to get from user
const dataToGetFromUser = {
  job: "what is the job of the user ?",
  topic: "what is the topic of the subsidy the user wants to know about ?",
  city: "In which city the user lives ?",
}

const validOptions = {
  job: ["mayor", "farmer", "teacher", "doctor", "engineer", "student", "unemployed", "other"],
  topic: ["agriculture", "energy", "solar", "biodiversity", "mobility", "waste", "water", "circularity"],
  city: ["An existing city in France"]
}

// Middleware to track or create session
app.use((req, res, next) => {
  const sessionId = req.headers['session-id'] || uuidv4();
  if (!sessions[sessionId]) {
    sessions[sessionId] = { 
      data: {job:'', topic:'', city:''},
      chatHistory: [],
      complete: false,
      isInit: true,
    }
  }
  req.sessionId = sessionId;
  req.session = sessions[sessionId];
  next();
});

app.get('/health', async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ status: 'fail', db: 'unhealthy' });
    }

    res.status(200).json({ status: 'ok', db: 'healthy' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Route to handle chat messages
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  // Get current session state
  const session = req.session;
  const isInit = session.isInit;

  const initPrompt = `
    General information :
    You are an AI assistant that will help a user to find information about environmental subsidies,
    by chatting and trying to extract information from the user.
    Here is the data you need to extract from the user : ${JSON.stringify(dataToGetFromUser)}.
    Your answers must be in the following language : "${language}", in formal language.
    Your answers must not contain any quotes.
    You must always answer as if you were talking directly to the user.
  `
  let finalContentPrompt = '';

  if (isInit) {
    finalContentPrompt = `
      ${initPrompt}
      Say hello to start the conversation, 
      explain the purpose of the conversation 
      and ask the first question that correspond to only one information you need to get from the user.
      You must always answer as if you were talking directly to the user.
    `;
  } else {
   const lastQuestion = session.chatHistory.slice(-1)[0].content;
    const promptToExtractTypeOfData = `
      ${initPrompt}
      Here is the last question you asked to the user : "${lastQuestion}".
      From this following list of keys, and only from that list : "${Object.keys(dataToGetFromUser).join(', ')}" 
      and from your last question, what is the best key fit ?
      Only answer with the key.
    `
    const ExtractedTypeOfDataResponse = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'user', 
          content: promptToExtractTypeOfData
        }],
    });

    const ExtractedTypeOfData = ExtractedTypeOfDataResponse.choices[0].message.content;
    const promptToValidateData = `
      ${initPrompt}
      Here is the last question you asked to the user : "${lastQuestion}".
      Here is the answer of the user : "${message}".
      Here is the list of valid answers : "${validOptions[ExtractedTypeOfData].join(', ')}".
      From the user answer, could you assimilate it to one of the valid answers ?
      If yes, please write "Yes - ${ExtractedTypeOfData} - {your selected valid option from the list in english}" without quotes.
      Here is an example : "Yes - job - mayor".
      If not, please write "No".
    `
    const isValidResponse = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'user', 
          content: promptToValidateData
        }],
    });

    const isValidResponseContent = isValidResponse.choices[0].message.content;
    const isValid = isValidResponseContent.includes('Yes');
    if (isValid) {
      // Extract key and valid option
      const isValidResponseContentParts = isValidResponseContent.split('-');
      const key = isValidResponseContentParts[1].trim();
      const validOption = isValidResponseContentParts[2].trim();
      session.data[key] = validOption

      // Check if all data is complete
      const complete = Object.keys(dataToGetFromUser).every(key => session.data[key]);
      if (complete) {
        finalContentPrompt = `
          ${initPrompt}
          Congratulations, you have all the data you need from the user.
          Explain to the user that you have all the data you need 
          and that you will now start the search for the information.
        `;
        session.complete = true;
      } else {
        const missingData = Object.keys(dataToGetFromUser).filter(key => !session.data[key]).map(key => dataToGetFromUser[key]);
        finalContentPrompt = `
          ${initPrompt}
          Here is the missing data you need to get from the user : ${missingData.join(', ')}.
          what is the next question to ask to the user to complete the missing data ?
          Ask only one question at a time.
        `;
      }
    } else {
      finalContentPrompt = `
        ${initPrompt}
        The user answer : "${message} does not correspond to any valid option of the question : "${lastQuestion}".
        Please explain to the user that you didn't get the answer and ask the question again to the user.
      `;
    }
  }

  try {
    const stream = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: finalContentPrompt }],
      stream: true,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullAnswer = '';
    for await (const part of stream) {
      const chunk = part.choices[0]?.delta?.content || '';
      if (chunk) {
        res.write(chunk);
        fullAnswer += chunk;
      }
    }

    // Update session state
    session.chatHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: fullAnswer }
    );

    if (session.isInit) {
      session.isInit = false;
    }

    res.end(); // End the response once all data has been sent
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Something went wrong!',
    });
  }
});

app.get('/subventions/:topic', async (req, res) => {
  const { topic } = req.params;
  const topicFormatted = topic.toLowerCase();
  const subventions = await Subvention.findOne({ key: topicFormatted });
  res.json(subventions);
});

app.get('/session/:id', (req, res) => {
  const { id } = req.params;
  const session = sessions[id];
  res.json(session);
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await mongoose.connect(`${DB_URL}/subventions`).then(() => console.log('Connected to database.'));
});