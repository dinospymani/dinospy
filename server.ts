import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Razorpay from "razorpay";

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

  // Razorpay Setup
  const razorpayKeyId = (process.env.RAZORPAY_KEY_ID || 'rzp_test_Src2TlFsCnS6kt').trim();
  const razorpayKeySecret = (process.env.RAZORPAY_KEY_SECRET || '5O4AY0jrBIjSqDUtE9XyyCjx').trim();

  const razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });

  console.log("Razorpay initialized with Key ID:", razorpayKeyId.startsWith('rzp_test') ? "Test Mode (Using Fallback or Provided)" : "Production Mode");

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
      const prompt = `Based on these user preferences: ${JSON.stringify(preferences)} and purchase history: ${JSON.stringify(history)}, recommend 3 types of luxury watches (Luxury, Sport, Smart, or Classic). Provide a reason for each. Return valid JSON only.`;
      
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

  // Razorpay Order Creation
  app.post("/api/payments/create-order", async (req, res) => {
    try {
      const { amount, currency = "INR" } = req.body;
      
      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit
        currency,
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      res.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: razorpayKeyId
      });
    } catch (error: any) {
      console.error("Razorpay Error:", error);
      res.status(500).json({ 
        error: "Order creation failed", 
        details: error.description || error.message || "Authentication or network error"
      });
    }
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
