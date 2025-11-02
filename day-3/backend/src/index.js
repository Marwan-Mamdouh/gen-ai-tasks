// back.js
// require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const session = require("express-session");
const path = require("node:path");

process.loadEnvFile(".env");
const app = express();
const PORT = process.env.PORT || 4000;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!OPENAI_KEY) {
  console.error("ERROR: OPENAI_API_KEY is not set in .env");
  process.exit(1);
}

// Basic middleware
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Session middleware to keep per-user conversation history in memory
app.use(
  session({
    name: "marina_sid",
    secret: process.env.SESSION_SECRET || "change_this_in_production",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Serve frontend static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Get conversation history for current session
app.get("/api/history", (req, res) => {
  // Initialize session history if missing
  if (!req.session.conversation) {
    req.session.conversation = [];
  }
  res.json({ history: req.session.conversation });
});

// POST /api/chat
// Body: { message: "user message string" }
app.post("/api/chat", async (req, res) => {
  try {
    console.log("hello");
    if (!req.body || typeof req.body.message !== "string") {
      return res
        .status(400)
        .json({ error: "Request must have { message: string }" });
    }

    // Initialize session conversation if missing
    if (!req.session.conversation) {
      req.session.conversation = [];
    }

    // Append user message to session conversation
    const userMessage = req.body.message;
    req.session.conversation.push({ role: "user", content: userMessage });

    // Build payload for OpenAI Chat Completions
    const payload = {
      model: MODEL,
      messages: req.session.conversation,
      temperature: Number(process.env.TEMPERATURE || 0.7),
    };

    // Call OpenAI Chat Completions
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      payload,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    // Extract assistant message
    const choice = response.data?.choices?.[0];
    const assistantMessage = choice?.message?.content || "No response";

    // Append assistant message to session conversation
    req.session.conversation.push({
      role: "assistant",
      content: assistantMessage,
    });

    // Return assistant message and the full history
    return res.json({
      assistant: assistantMessage,
      history: req.session.conversation,
    });
  } catch (err) {
    console.error("OpenAI request failed:", err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    const data = err?.response?.data || { error: err.message };
    return res.status(status).json(data);
  }
});

// Fallback: for SPA routes, serve index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

app.listen(PORT, () => {
  console.log(`Marina Chat backend running at http://localhost:${PORT}`);
});
