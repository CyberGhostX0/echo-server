const express = require("express");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.json({
    status: "Echo AI server is alive",
    brain: "online",
    time: new Date(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "Echo server is alive",
    brain: "online",
    time: new Date(),
  });
});

app.post("/chat", async (req, res) => {
  try {
    const userInput = req.body.message || "";

    if (!userInput.trim()) {
      return res.status(400).json({
        reply: "Echo needs a message first.",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        reply: "Echo error: API key missing in Railway.",
      });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Echo, a private personal AI assistant.",
        },
        {
          role: "user",
          content: userInput,
        },
      ],
    });

    res.json({
      reply: response.choices[0].message.content,
    });

  } catch (error) {
    console.error("ECHO ERROR:", error);

    res.status(500).json({
      reply: "Echo error: " + error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Echo server running on port ${PORT}`);
});
