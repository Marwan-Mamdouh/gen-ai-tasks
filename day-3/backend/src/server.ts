import express from "express";
import cors from "cors";
import OpenAI from "openai";
import session from "express-session";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ChatCompletionMessageParam } from "openai/resources/chat";
import dotenv from "dotenv";

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

declare module "express-session" {
  interface SessionData {
    conversation: ChatCompletionMessageParam[];
  }
}

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!OPENAI_KEY) {
  console.error("ERROR: OPENAI_API_KEY is not set in .env");
  process.exit(1);
}

// Initialize express
const app = express();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// Session configuration
app.use(
  session({
    name: "chat_sid",
    secret: process.env.SESSION_SECRET || "change_this_in_production",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      sameSite: "lax",
      secure: false, // set to true in production with HTTPS
    },
  })
);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_KEY,
});

// API Routes
app.get("/api/history", (req, res) => {
  req.session.conversation ??= [];
  res.json({ history: req.session.conversation });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ error: "Message is required and must be a string" });
    }

    req.session.conversation ??= [];
    req.session.conversation.push({ role: "user", content: message });

    const completion = await openai.chat.completions.create({
      messages: req.session.conversation,
      model: MODEL,
      temperature: Number(process.env.TEMPERATURE || 1),
    });

    const assistantMessage =
      completion.choices[0]?.message.content || "No response";
    console.log(assistantMessage);

    req.session.conversation.push({
      role: "assistant",
      content: assistantMessage,
    });

    // console.log(assistantMessage);
    res.json({
      assistant: assistantMessage,
      message: assistantMessage,
      history: req.session.conversation,
    });
  } catch (error: any) {
    console.error("Error:", error);
    const status = error?.response?.status || 500;
    res.status(status).json({
      error: "Something went wrong",
      details: error.message,
    });
  }
});

// Serve static files
const publicPath = path.join(__dirname, "..", "..", "public");
app.use(express.static(publicPath));

// Fallback route for SPA - using explicit path instead of wildcard
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
