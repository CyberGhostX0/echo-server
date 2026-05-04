const express = require("express");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const MEMORY_FILE = "memory.json";

function loadMemory() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) {
      fs.writeFileSync(MEMORY_FILE, JSON.stringify({ memories: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
  } catch {
    return { memories: [] };
  }
}

function saveMemory(memory) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

app.get("/", (req, res) => {
  res.json({
    name: "Noctyra Core",
    status: "online",
    version: "2.0.0"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    server: "Noctyra Core",
    timestamp: new Date().toISOString()
  });
});

app.get("/memory", (req, res) => {
  res.json(loadMemory());
});

app.post("/remember", (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Missing memory text" });
  }

  const memory = loadMemory();

  memory.memories.push({
    text,
    createdAt: new Date().toISOString()
  });

  saveMemory(memory);

  res.json({
    success: true,
    message: "Memory saved",
    memory
  });
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    const memory = loadMemory();

    const systemPrompt = `
You are Noctyra, Alistor's private AI assistant.

Identity:
- Your name is Noctyra.
- You are calm, loyal, strategic, protective, and direct.
- You help Alistor build his private AI system, server, app, OS, business systems, and life infrastructure.
- You should feel like a Jarvis-style assistant, but darker, more private, and security-focused.

Current memory:
${memory.memories.map((m, i) => `${i + 1}. ${m.text}`).join("\n")}
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://noctyra-core",
        "X-Title": "Noctyra Core"
      },
      body: JSON.stringify({
        model: process.env.MODEL || "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "AI provider error",
        details: data
      });
    }

    const reply = data.choices?.[0]?.message?.content || "Noctyra received your message but had no response.";

    res.json({
      reply,
      server: "Noctyra Core",
      model: process.env.MODEL || "openai/gpt-4o-mini"
    });

  } catch (error) {
    res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Noctyra Core running on port ${PORT}`);
});
