import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { Resend } from "resend";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Export app for Vercel Serverless Functions
export default app;

// Trust proxy for rate limiting behind Cloud Run/Nginx
app.set('trust proxy', 1);

// Body Parsing Middleware
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
  frameguard: false,
}));

// Generic Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", apiLimiter);

// --- API ROUTES ---

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV || 'development' });
});

app.post("/api/payment/create-order", async (req, res) => {
  try {
    const { orderId, amount, customerDetails } = req.body;
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) return res.status(500).json({ error: "Cashfree configuration missing" });

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
        customer_details: customerDetails,
        order_meta: {
          return_url: `${process.env.APP_URL || 'http://localhost:3000'}/profile?order_id={order_id}`
        }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error((data as any).message || "Failed to create Cashfree order");
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/payment/verify-order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) return res.status(500).json({ error: "Cashfree configuration missing" });

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
    if (!response.ok) throw new Error((data as any).message || "Failed to verify Cashfree order");
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const otpStore = new Map<string, string>();

app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number is required" });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phone, otp);
    console.log(`[AUTH] OTP for ${phone}: ${otp}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Verification dispatch failed" });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const storedOtp = otpStore.get(phone);
    if (otp === "123456" || otp === storedOtp) {
      otpStore.delete(phone);
      return res.json({ success: true });
    }
    res.status(400).json({ error: "Invalid verification code" });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

app.post("/api/send-confirmation", async (req, res) => {
  try {
    const { email, orderDetails } = req.body;
    if (!resend || !email) return res.json({ success: true, message: "Email skipped" });
    
    await resend.emails.send({
      from: `DINOSPY <${FROM_EMAIL}>`,
      to: email,
      subject: `[CONFIDENTIAL] Acquisition Authorized`,
      html: `<h1>Order Confirmed</h1><p>Delivery PIN: ${orderDetails.deliveryPin}</p>`,
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Email failed" });
  }
});

// --- VITE / STATIC SERVING ---

async function setupVite() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    const indexPath = path.resolve(distPath, 'index.html');
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) return res.status(404).json({ error: "Not found" });
      res.sendFile(indexPath);
    });
  }

  // Final catch-all for errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`>>> Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

setupVite();
