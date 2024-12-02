"use client";
import Image from "next/image";
import { useState, FormEvent, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Session {
  data: { [key: string]: string };
  complete: boolean;
}

interface Subvention {
  title: string;
  detail: string;
  url: string;
}

const sessionID = uuidv4();

const Home: React.FC = () => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [session, setSession] = useState<Session>({
    data: {},
    complete: false,
  });
  const [subvention, setSubvention] = useState<Subvention>({
    title: "",
    detail: "",
    url: "",
  });

  // Auto scroll to the bottom of the chat container
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, subvention]);

  const sendMessage = async (e: FormEvent) => {
    e?.preventDefault();
    if (!message.trim()) return;

    setLoading(true);

    const userMessage: ChatMessage = { role: "user", content: message };
    setChatHistory((prevHistory) => [...prevHistory, userMessage]);

    setMessage("");

    await getMessageResponse(message);
  };

  const getMessageResponse = async (message?: string) => {
    try {
      const response = await fetch(`${NEXT_PUBLIC_API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "session-id": sessionID,
        },
        body: JSON.stringify({ message }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let chatResponse = "";

      // Prepare an empty message for bot that will be updated progressively
      const botMessage: ChatMessage = { role: "assistant", content: "" };
      setChatHistory((prevHistory) => [...prevHistory, botMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          chatResponse += chunk;

          // Gradually update the bot's message in chat history
          // Remove the last bot message
          // Append the updated bot message
          botMessage.content = chatResponse;
          setChatHistory((prevHistory) => [
            ...prevHistory.slice(0, prevHistory.length - 1),
            botMessage,
          ]);
        }
      }

      const sessionResponseRaw = await fetch(
        `${NEXT_PUBLIC_API_URL}/session/${sessionID}`
      );
      const sessionResponse = await sessionResponseRaw.json();
      setSession(sessionResponse);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSubvention = async () => {
      const subventionRaw = await fetch(
        `${NEXT_PUBLIC_API_URL}/subventions/${session.data.topic}`
      );
      const subvention = await subventionRaw.json();
      setSubvention(subvention);
    };
    if (session.complete) {
      fetchSubvention();
    }
  }, [session]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
      <div className="flex min-h-screen justify-center items-center">
        <Image
          src="/presentation.png"
          alt="presentation-schema"
          width={800}
          height={800}
        />
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen w-full max-w-xl">
        <h2 className="w-fit mb-10 mt-12 px-2 text-center font-light text-3xl uppercase bg-gradient-to-r from-yellow-400 to-yellow-400/70 bg-no-repeat bg-100%_20px bg-bottom rounded-lg">
          Find Your Subsidies
        </h2>

        <div className=" w-full bg-white rounded-lg shadow-md p-6 mb-6">
          <div
            ref={chatContainerRef}
            className="flex flex-col h-80 overflow-y-auto mb-4 p-3 bg-gray-100 rounded"
          >
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`py-2 px-3 mb-2 rounded-lg w-fit ${
                  chat.role === "user" && "bg-blue-500 text-white self-end"
                }
                ${chat.role === "assistant" && "bg-gray-300 text-gray-800"}
                `}
              >
                {chat.content}
              </div>
            ))}
            {subvention?.title && (
              <div className="py-2 px-3 bg-green-500 text-white font-medium shadow-xl mt-4 mb-4">
                <div className="text-lg mb-2 font-bold">{subvention.title}</div>
                <p className="mb-2">{subvention.detail}</p>
                <a
                  className="font-medium underline dark:text-blue-500 hover:no-underline"
                  href={subvention.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {subvention.url}
                </a>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="flex items-center space-x-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Type your message..."
              disabled={loading}
            />
            <button
              type="submit"
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              disabled={loading || !message.trim()}
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </form>
          <div className="pt-4">
            Data extracted from chat : {JSON.stringify(session.data)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
