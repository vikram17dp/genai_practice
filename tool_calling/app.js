import Groq from "groq-sdk";
import dotenv from "dotenv";
import { tavily } from "@tavily/core";

dotenv.config();

// ── STEP 1: Setup clients ──────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tavilyClient = tavily({
  apiKey: process.env.TAVILY_TOOL_CALLING_API_KEY,
});

// ── STEP 2: The actual search function ────────────────────────────
// This talks to Tavily and returns search results as plain text
async function webSearch(query) {
  const result = await tavilyClient.search(query, { maxResults: 3 });
  return result.results.map((r) => `${r.title}: ${r.content}`).join("\n");
}

// ── STEP 3: Tell Groq "hey, you have a search tool available" ─────
const tools = [
  {
    type: "function",
    function: {
      name: "web_search", // name Groq will call
      description: "Search the web for current information",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query",
          },
        },
        required: ["query"],
      },
    },
  },
];

// ── STEP 4: Main function ─────────────────────────────────────────
async function chat(userQuestion) {
  console.log("👤 User:", userQuestion);

  // Send question to Groq with tools available
  const firstResponse = await groq.chat.completions.create({
     model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Use web_search when you need current info.",
      },
      { role: "user", content: userQuestion },
    ],
    tools: tools,
    tool_choice: "auto", // let model decide whether to search or not
  });

  const reply = firstResponse.choices[0].message;

  // ── Did the model want to search? ──
  if (reply.tool_calls) {
    // Model said: "I want to call web_search with this query"
    const query = JSON.parse(reply.tool_calls[0].function.arguments).query;
    console.log("🔍 Searching for:", query);

    // Actually run the search
    const searchResults = await webSearch(query);
    console.log("📄 Got results, sending back to Groq...");

    // Send results back to Groq so it can form a final answer
    const finalResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: userQuestion },
        reply, // assistant's tool call message
        {
          role: "tool",
          tool_call_id: reply.tool_calls[0].id,
          content: searchResults, // the actual search results
        },
      ],
    });

    console.log("\n✅ Answer:", finalResponse.choices[0].message.content);
  } else {
    // Model didn't need to search, answered directly
    console.log("\n✅ Answer:", reply.content);
  }
}

chat("when was iphone 17 released?");
