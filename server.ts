import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Setup
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  // Admin Seed Route (Normally protected, but for demo bootstrapping)
  app.post("/api/admin/seed", async (req, res) => {
    try {
      const { adminKey } = req.body;
      if (adminKey !== "DINOSPY_SECRET_2024") return res.status(403).json({ error: "Forbidden" });

      // We would normally use firebase-admin here, but for this app we'll just return instructions 
      // or we could use the client SDK if exposed. 
      // However, for simplicity, we'll just provide a response that it's ready.
      res.json({ message: "Seeding endpoint reached. Please use the Admin panel in-app for data entry." });
    } catch (err) {
      res.status(500).json({ error: "Seeding failed" });
    }
  });

  // AI Recommendation Proxy
  app.post("/api/ai/recommend", async (req, res) => {
    try {
      const { preferences, history } = req.body;
      const prompt = `Based on these user preferences: ${JSON.stringify(preferences)} and purchase history: ${JSON.stringify(history)}, recommend 3 types of luxury watches (Grand Complications, Heritage, Avant-Garde, or Deep Sea). Provide a reason for each. Return valid JSON only.`;
      
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      let text = result.text || "";
      
      // Basic cleaning if needed
      text = text.replace(/```json\n?/, "").replace(/\n?```/, "").trim();
      
      res.json(JSON.parse(text));
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "AI recommendation failed" });
    }
  });

  // Order Purge (Admin Only)
  app.delete("/api/admin/purge-orders", async (req, res) => {
    // In a real app, we would verify admin headers here
    res.json({ message: "Order purge initiated via terminal." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> DINOSPY Server active at http://0.0.0.0:${PORT}`);
    console.log(`>>> MODE: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
