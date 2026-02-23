import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tavilyClient = tavily({
  apiKey: process.env.TAVILY_TOOL_CALLING_API_KEY,
});

const MODEL = process.env.MODEL;

async function webSearch(query) {
  const result = await tavilyClient.search(query, { maxResults: 3 });

  if (!result || !result.results || result.results.length === 0) {
    return "No search results found.";
  }

  return result.results
    .map((r) => `${r.title}: ${r.content}`)
    .join("\n");
}

const tools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
    },
  },
];

export async function chatWithAI(userMessage, history = []) {
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant. Use web_search when current info is needed.",
    },
    ...history,
    { role: "user", content: userMessage },
  ];

  const firstResponse = await groq.chat.completions.create({
    model: MODEL,
    messages,
    tools,
    tool_choice: "auto",
  });

  const reply = firstResponse.choices[0].message;

  if (reply.tool_calls) {
    const query = JSON.parse(
      reply.tool_calls[0].function.arguments
    ).query;

    const searchResults = await webSearch(query);

    const finalResponse = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        ...messages,
        reply,
        {
          role: "tool",
          tool_call_id: reply.tool_calls[0].id,
          content: searchResults,
        },
      ],
    });

    return finalResponse.choices[0].message.content;
  }

 return reply.content || "No response generated.";
}