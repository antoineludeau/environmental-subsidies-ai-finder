import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

import Subvention from './subvention.model.js';

dotenv.config();

const { PORT, DB_URL, OPENAI_API_KEY, CHAT_LANGUAGE } = process.env;

declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      session?: Session;
    }
  }
}

interface Session {
  data: Record<'job' | 'topic' | 'city', string>;
  chatHistory: { role: string; content: string }[];
  complete: boolean;
  isInit: boolean;
}

interface DataToGetFromUser {
  [key: string]: string;
}

const language = CHAT_LANGUAGE; 
const sessions: Record<string, Session> = {}; // In-memory store for sessions

// Initialize OpenAI API client
const client = new OpenAI({
  apiKey: OPENAI_API_KEY || "",
});

// Data structure
const dataToGetFromUser: DataToGetFromUser  = {
  job: "what is the job of the user ?",
  topic: "what is the topic of the subsidy the user wants to know about ?",
  city: "In which city the user lives ?",
};

// Valid options for each element to get from the user
const validOptions: Record<string, string[]> = {
  job: ["mayor", "farmer", "teacher", "doctor", "engineer", "student", "unemployed", "other"],
  topic: ["agriculture", "energy", "solar", "biodiversity", "mobility", "waste", "water", "circularity"],
  city: ["An existing city in France"],
};

// Create the express app
const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Session middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const sessionId = (req.headers['session-id'] as string) || uuidv4();
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      data: { job: '', topic: '', city: '' },
      chatHistory: [],
      complete: false,
      isInit: true,
    };
  }
  
  req.sessionId = sessionId;
  req.session = sessions[sessionId];
  next();
});


// Health check
app.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ status: 'fail', db: 'unhealthy' });
    } else {
      res.status(200).json({ status: 'ok', db: 'healthy' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: (error as Error).message });
  }
});

// Chat endpoint
app.post('/chat', async (req: Request, res: Response) => {
  const { message } = req.body;
  const session: Session = req['session'] as Session;
  const isInit = session.isInit;

  const initPrompt = `
    General information:
    You are an AI assistant that will help a user to find information about environmental subsidies,
    by chatting and trying to extract information from the user.
    Here is the data you need to extract from the user: ${JSON.stringify(dataToGetFromUser)}.
    Your answers must be in the following language: "${language}", in formal language.
    Your answers must not contain any quotes.
    You must always answer as if you were talking directly to the user.
  `;

  let finalContentPrompt = '';

  if (isInit) {
    finalContentPrompt = `
      ${initPrompt}
      Say hello to start the conversation, 
      explain the purpose of the conversation 
      and ask the first question that corresponds to only one piece of information you need from the user.
      Always answer as if you were talking directly to the user.
    `;
  } else {
    const lastQuestion = session.chatHistory.slice(-1)[0].content;
    const promptToExtractTypeOfData = `
      ${initPrompt}
      Here is the last question you asked the user: "${lastQuestion}".
      From this list of keys: "${Object.keys(dataToGetFromUser).join(', ')}", 
      and your last question, what is the best matching key? Only respond with the key.
    `;
    const ExtractedTypeOfDataResponse = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: promptToExtractTypeOfData }],
    });

    const ExtractedTypeOfData = ExtractedTypeOfDataResponse.choices[0]?.message?.content?.trim() || '';
    const promptToValidateData = `
      ${initPrompt}
      Here is the last question you asked the user: "${lastQuestion}".
      Here is the user's answer: "${message}".
      Here is the list of valid answers: "${validOptions[ExtractedTypeOfData]?.join(', ')}".
      From the user's answer, can you associate it with one of the valid answers?
      If yes, respond with: "Yes - ${ExtractedTypeOfData} - {selected valid option}". 
      If no, respond with: "No".
    `;
    const isValidResponse = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: promptToValidateData }],
    });

    const isValidResponseContent = isValidResponse.choices[0]?.message?.content?.trim() || '';
    const isValid = isValidResponseContent.startsWith('Yes');

    if (isValid) {
      const response = isValidResponseContent.split('-').map(str => str.trim());
      const key : keyof Session['data'] = response[1] as keyof Session['data'];
      const validOption = response[2];
      session.data[key] = validOption;

      const complete = Object.keys(dataToGetFromUser).every(key => session.data[key as keyof Session['data']]);
      if (complete) {
        finalContentPrompt = `
          ${initPrompt}
          Congratulations, you have all the data you need from the user.
          Explain to the user that you have all the data 
          and will now begin searching for the information.
        `;
        session.complete = true;
      } else {
        const missingData = Object.keys(dataToGetFromUser)
          .filter(key => !session.data[key as keyof Session['data']])
          .map(key => dataToGetFromUser[key]);
        finalContentPrompt = `
          ${initPrompt}
          Here is the missing data: ${missingData.join(', ')}.
          What is the next question to ask to complete the data? 
          Ask only one question at a time.
        `;
      }
    } else {
      finalContentPrompt = `
        ${initPrompt}
        The user's response: "${message}" does not match the valid options for the question: "${lastQuestion}".
        Explain to the user and ask the question again.
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

    session.chatHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: fullAnswer }
    );

    if (session.isInit) session.isInit = false;

    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get subventions by topic
app.get('/subventions/:topic', async (req: Request, res: Response) => {
  try {
    const { topic } = req.params;
    const topicFormatted = topic.toLowerCase();
    const subventions = await Subvention.findOne({ key: topicFormatted });
    res.json(subventions);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a session by ID
app.get('/session/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = sessions[id];
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(Number(PORT), async () => {
  await mongoose.connect(`${DB_URL}/subventions`);
  console.log('Connected to the database.');
  console.log(`Server running on http://localhost:${PORT}`);
});
