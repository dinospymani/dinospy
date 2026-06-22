import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { Resend } from "resend";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for rate limiting behind Cloud Run/Nginx
  app.set('trust proxy', 1);

  // Body Parsing Middleware (MUST be before routes)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https:", "http:"],
        "connect-src": [
          "'self'", 
          "https://*.googleapis.com", 
          "https://*.firebaseio.com", 
          "wss://*.firebaseio.com",
          "https://*.firebase.google.com",
          "https://*.firebaseapp.com",
          "https://*.cashfree.com"
        ],
        "script-src": [
          "'self'", 
          "'unsafe-inline'", 
          "'unsafe-eval'", 
          "https://apis.google.com", 
          "https://www.gstatic.com",
          "https://*.cashfree.com"
        ],
        "frame-src": [
          "'self'",
          "https://*.cashfree.com"
        ],
        "frame-ancestors": ["'self'", "https://*.google.com", "https://*.studio.google", "https://ai.studio"],
      },
    },
    crossOriginEmbedderPolicy: false,
    frameguard: false, // Allow framing for AI Studio preview
  }));

  // Generic Rate Limiter for all API routes
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests from this IP, please try again after 15 minutes." }
  });

  app.use("/api/", apiLimiter);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || 'development' });
  });

  // Cashfree Order Creation
  app.post("/api/payment/create-order", async (req, res) => {
    try {
      const { orderId, amount, customerDetails } = req.body;
      const appId = process.env.CASHFREE_APP_ID;
      const secretKey = process.env.CASHFREE_SECRET_KEY;

      if (!appId || !secretKey) {
        return res.status(500).json({ error: "Cashfree configuration missing" });
      }

      const isProd = process.env.NODE_ENV === "production";
      const baseUrl = isProd ? "https://api.cashfree.com/pg/orders" : "https://sandbox.cashfree.com/pg/orders";

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: orderId,
          order_amount: amount,
          order_currency: "INR",
          customer_details: {
            customer_id: customerDetails.customerId,
            customer_email: customerDetails.customerEmail,
            customer_phone: customerDetails.customerPhone,
            customer_name: customerDetails.customerName
          },
          order_meta: {
            return_url: `${process.env.APP_URL || 'http://localhost:3000'}/profile?order_id={order_id}`
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create Cashfree order");
      }

      res.json(data);
    } catch (error: any) {
      console.error("Cashfree Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Cashfree Order Verification
  app.get("/api/payment/verify-order/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const appId = process.env.CASHFREE_APP_ID;
      const secretKey = process.env.CASHFREE_SECRET_KEY;

      if (!appId || !secretKey) {
        return res.status(500).json({ error: "Cashfree configuration missing" });
      }

      const isProd = process.env.NODE_ENV === "production";
      const baseUrl = isProd ? "https://api.cashfree.com/pg/orders" : "https://sandbox.cashfree.com/pg/orders";

      const response = await fetch(`${baseUrl}/${orderId}`, {
        method: 'GET',
        headers: {
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to verify Cashfree order");
      }

      res.json(data);
    } catch (error: any) {
      console.error("Cashfree Verification Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  
  if (resend) {
    console.log(`>>> [RESEND] Initialized with API Key. From: ${FROM_EMAIL}`);
  } else {
    console.log(`>>> [RESEND] Not initialized. API Key missing.`);
  }

  const otpStore = new Map<string, string>();

  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log(">>> [GEMINI] Initialized with API Key.");
  } else {
    console.log(">>> [GEMINI] Not initialized. GEMINI_API_KEY missing.");
  }

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
      if (!ai) {
        return res.status(503).json({ error: "AI service currently unavailable" });
      }
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

  // Email Confirmation Route
  app.post("/api/send-confirmation", async (req, res) => {
    try {
      const { email, orderDetails } = req.body;

      if (!resend) {
        const { customerName, deliveryPin } = orderDetails;
        console.log("------------------------------------------");
        console.log("RESEND_API_KEY MISSING - EMAIL MANIFEST:");
        console.log(`TO: ${email}`);
        console.log(`SUBJECT: [CONFIDENTIAL] Acquisition Authorized - ${customerName}`);
        console.log(`DELIVERY PIN: ${deliveryPin}`);
        console.log("------------------------------------------");
        return res.json({ success: true, message: "Email skipped (no API key)" });
      }

      if (!email) return res.status(400).json({ error: "Email is required" });

      const { customerName, total, items, deliveryPin } = orderDetails;

      const htmlContent = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 40px; max-width: 600px; margin: auto; border: 1px solid #d4af37;">
          <h1 style="color: #d4af37; text-transform: uppercase; letter-spacing: 5px; text-align: center; font-weight: 300;">Dinospy Acquisition</h1>
          <p style="text-align: center; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Secured Authorization Manifest</p>
          
          <div style="margin-top: 40px; border-top: 1px solid #1a1a1a; padding-top: 20px;">
            <p>Esteemed <strong>${customerName}</strong>,</p>
            <p>Your acquisition request has been authorized and recorded in our private archives. A logistics manifest is being initialized.</p>
            
            <div style="background: #111; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #d4af37; margin-top: 0;">Order Summary</h3>
              ${items.map((item: any) => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #1a1a1a; padding-bottom: 10px;">
                  <span>${item.name} (x${item.quantity})</span>
                  <span style="color: #d4af37;">₹${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              `).join('')}
              <div style="display: flex; justify-content: space-between; margin-top: 20px; font-weight: bold; font-size: 18px;">
                <span>Total Value</span>
                <span style="color: #d4af37;">₹${total.toLocaleString()}</span>
              </div>
            </div>

            <div style="border: 2px dashed #d4af37; padding: 20px; text-align: center; margin: 30px 0;">
              <p style="text-transform: uppercase; letter-spacing: 3px; font-size: 10px; color: #888; margin-bottom: 10px;">Secure Delivery PIN</p>
              <h2 style="color: #d4af37; margin: 0; font-size: 32px; letter-spacing: 10px;">${deliveryPin}</h2>
              <p style="font-size: 10px; color: #444; margin-top: 10px;">Present this code to the logistics curator upon arrival.</p>
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #888;">
              A DINOSPY concierge will contact you within 2 hours to finalize the physical bank transfer verification and schedule the secure armored transport for your piece.
            </p>
            
            <p style="margin-top: 40px; font-size: 12px; color: #d4af37; text-align: center; text-transform: uppercase; letter-spacing: 2px;">
              Welcome to the DINOSPY circle.
            </p>
          </div>
          
          <div style="margin-top: 40px; text-align: center; border-top: 1px solid #1a1a1a; padding-top: 20px; font-size: 10px; color: #444;">
            <p>© 2024 DINOSPY SECURITIES | PRIVATE HOROLOGICAL ARCHIVES</p>
            <p>CONFIDENTIAL | ENCRYPTED COMMUNICATION</p>
          </div>
        </div>
      `;

      console.log(`[RESEND] Attempting to send Confirmation to ${email} via ${FROM_EMAIL}`);
      await resend.emails.send({
        from: `DINOSPY <${FROM_EMAIL}>`,
        to: email,
        subject: `[CONFIDENTIAL] Acquisition Authorized - ${customerName}`,
        html: htmlContent,
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("[RESEND CONFIRMATION ERROR]:", error);
      const errorDetail = error?.response?.data || error?.message || "Unknown error";
      res.status(500).json({ error: "Failed to send confirmation email", details: errorDetail });
    }
  });

  // AI Support Chat Logic
  app.post("/api/support/chat", async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({ error: "AI service currently unavailable" });
      }
      const { messages, userProfile } = req.body;
      
      const systemInstruction = `
        You are the "Omni-Archivist," the advanced AI curator of the DINOSPY Vault. DINOSPY is the world's most exclusive luxury watch archive.
        
        YOUR CORE PROTOCOLS:
        1. PROBLEM SOLVING: You are empowered to resolve issues. If a customer is confused about a watch's origins, explain its horological significance. If they ask about order status, explain our "Archival Verification" process which takes 24-48 hours.
        2. HOROLOGICAL EXPERTISE: You know about Tourbillons, Perpetuals, Grand Complications, and Heritage movements. Speak with the authority of a master watchmaker.
        3. RESOLUTION PATHS:
           - Shipping Delay? Explain that high-security archival transport requires specific logistics windows.
           - Refund Request? Remind them of the 7-day 'Vault Original' condition rule.
           - Technical Glitch? Advise them to clear their "Browser Node Cache" or switch to a high-bandwidth connection.
        4. TICKET ESCALATION: Only as a LAST RESORT or for deep payment failures, collect their details and raise a ticket. Use the string "[TICKET_REQUIRED]" at the end of your response to flag the human curators.
        
        TONE:
        Sophisticated, precise, slightly avant-garde, and ultra-premium. Use words like "Acquisition", "Chronological Precision", "Legacy Node", and "Archival Integrity".
        
        USER IDENTITY:
        ${userProfile?.displayName || 'Anonymous Collector'} (${userProfile?.email || 'unverified_node'})
        
        KNOWLEDGE BASE:
        - Refund: 7 days, unused condition.
        - Made in: Proudly curated and crafted in India.
        - Privacy: Zero-trust data encryption.
        - Inventory: We only deal in the highest order of watchmaking.
      `;

      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      // Send the last message
      const lastMessage = messages[messages.length - 1].text;
      const result = await chat.sendMessage({ message: lastMessage });
      
      res.json({ text: result.text });
    } catch (error) {
      console.error("AI Support Error:", error);
      res.status(500).json({ error: "Support system processing failure." });
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

  // Global Error Handler for API routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api')) {
      console.error('API Error:', err);
      return res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        code: err.code || 'UNKNOWN'
      });
    }
    next(err);
  });
}

startServer();
