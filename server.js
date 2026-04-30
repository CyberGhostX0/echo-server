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

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are Echo, a private personal AI assistant for one user. Be helpful, loyal, clear, calm, and practical.",
        },
        {
          role: "user",
          content: userInput,
        },
      ],
    });

    res.json({
      reply: response.output_text,
    });
  } catch (error) {
    console.error("Echo error:", error);

    res.status(500).json({
      reply: "Echo had a server error. Check Railway logs.",
      error: error.message,
    });
  }
});

app.post("/echo", async (req, res) => {
  try {
    const userInput = req.body.message || "";

    res.json({
      reply: "Echo heard: " + userInput,
    });
  } catch (error) {
    res.status(500).json({
      reply: "Echo had an error.",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Echo server running on port ${PORT}`);
});
