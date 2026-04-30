const express = require("express");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let echoMemory = [];

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://echo-server-production-f4af.up.railway.app",
    "X-Title": "Echo",
  },
});

app.get("/", (req, res) => {
  res.json({
    status: "Echo AI server is alive",
    provider: "OpenRouter",
    model: "openrouter/free",
    memoryItems: echoMemory.length,
    time: new Date(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "Echo is alive",
    provider: "OpenRouter",
    model: "openrouter/free",
    memoryItems: echoMemory.length,
    time: new Date(),
  });
});

app.get("/memory", (req, res) => {
  res.json({
    memory: echoMemory,
  });
});

app.post("/clear-memory", (req, res) => {
  echoMemory = [];
  res.json({
    reply: "Echo memory cleared.",
  });
});

app.post("/chat", async (req, res) => {
  try {
    const userInput = req.body.message || "";

    if (!userInput.trim()) {
      return res.json({
        reply: "Echo needs a message first.",
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.json({
        reply: "Missing OpenRouter API key.",
      });
    }

    const lowerInput = userInput.toLowerCase();

    if (
      lowerInput.startsWith("remember ") ||
      lowerInput.startsWith("remember that ")
    ) {
      const memoryText = userInput
        .replace(/^remember that /i, "")
        .replace(/^remember /i, "")
        .trim();

      if (memoryText.length > 0) {
        echoMemory.push(memoryText);
      }

      return res.json({
        reply: `I’ll remember that: ${memoryText}`,
      });
    }

    const memoryContext =
      echoMemory.length > 0
        ? "Here are things you remember about the user:\n" +
          echoMemory.map((item, index) => `${index + 1}. ${item}`).join("\n")
        : "You do not have saved memory yet.";

    const response = await client.chat.completions.create({
      model: "openrouter/free",
      messages: [
        {
          role: "system",
          content:
            "You are Echo, a private personal AI assistant. Be helpful, calm, direct, practical, and loyal to the user's goals.\n\n" +
            memoryContext,
        },
        {
          role: "user",
          content: userInput,
        },
      ],
    });

    res.json({
      reply:
        response.choices?.[0]?.message?.content ||
        "Echo got an empty response.",
    });
  } catch (error) {
    console.error("ECHO ERROR:", error);

    res.json({
      reply: "Echo error: " + error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Echo server running on port ${PORT}`);
});
