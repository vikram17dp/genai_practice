import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import messageCache from "./cache.js";
import { chatWithAI } from "./groqService.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    const history = messageCache.get(sessionId) || [];

    const aiReply = await chatWithAI(message, history);

    const updatedHistory = [
      ...history,
      { role: "user", content: message },
      { role: "assistant", content: aiReply },
    ];

    messageCache.set(sessionId, updatedHistory);

    res.json({ reply: aiReply });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(5000, () =>
  console.log("Server running on http://localhost:5000")
);