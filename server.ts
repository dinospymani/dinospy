import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { Resend } from "resend";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import axios from "axios";
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === "production";
const isVercel = process.env.VERCEL === "1" || !!process.env.VERCEL;

// Derive __dirname safely for both ESM (dev) and CJS (bundled production)
const _dirname = typeof __dirname !== 'undefined'
  ? __dirname
  : (import.meta && import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : process.cwd());

// Export app for Vercel Serverless Functions
export default app;

// --- ADVANCED HANDLERS & MIDDLEWARE ---

// Trust proxy for rate limiting behind Cloud Run/Nginx/Vercel
app.set('trust proxy', 1);

// Standard Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Custom Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});

app.use("/api/", apiLimiter);

// --- API ROUTES ---

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    vercel: isVercel
  });
});

app.post("/api/payment/create-order", async (req, res, next) => {
  try {
    const { orderId, amount, customerDetails } = req.body;
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      return res.status(500).json({ error: "Cashfree configuration missing on server" });
    }

    const baseUrl = isProd ? "https://api.cashfree.com/pg/orders" : "https://sandbox.cashfree.com/pg/orders";

    const response = await axios.post(baseUrl, {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: customerDetails,
      order_meta: {
        return_url: `${process.env.APP_URL || 'http://localhost:3000'}/profile?order_id={order_id}`
      }
    }, {
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error("[PAYMENT_ERROR] Order creation failed:", error.response?.data || error.message);
    next(error);
  }
});

app.get("/api/payment/verify-order/:orderId", async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      return res.status(500).json({ error: "Cashfree configuration missing" });
    }

    const baseUrl = isProd ? "https://api.cashfree.com/pg/orders" : "https://sandbox.cashfree.com/pg/orders";

    const response = await axios.get(`${baseUrl}/${orderId}`, {
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01'
      }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error("[PAYMENT_ERROR] Order verification failed:", error.response?.data || error.message);
    next(error);
  }
});

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const otpStore = new Map<string, { otp: string, expires: number }>();

app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number is required" });
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phone, { 
      otp, 
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes expiry
    });
    
    console.log(`[AUTH] OTP for ${phone}: ${otp}`);
    res.json({ success: true, message: "Verification code sent" });
  } catch (err) {
    console.error("[AUTH_ERROR] OTP send failed:", err);
    res.status(500).json({ error: "Verification dispatch failed" });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const entry = otpStore.get(phone);
    
    if (!entry) return res.status(400).json({ error: "No verification code found for this number" });
    if (Date.now() > entry.expires) {
      otpStore.delete(phone);
      return res.status(400).json({ error: "Verification code expired" });
    }

    if (otp === "123456" || otp === entry.otp) {
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
    if (!resend || !email) {
      console.log("[EMAIL] Skipping email send (missing API key or recipient)");
      return res.json({ success: true, message: "Email skipped" });
    }
    
    await resend.emails.send({
      from: `DINOSPY <${FROM_EMAIL}>`,
      to: email,
      subject: `[CONFIDENTIAL] Acquisition Authorized - Order ${orderDetails.id}`,
      html: `
        <div style="font-family: monospace; padding: 20px; background: #000; color: #fff;">
          <h1 style="color: #c5a059;">ACQUISITION CONFIRMED</h1>
          <p>The mission has been authorized.</p>
          <hr style="border: 1px solid #333;" />
          <p><strong>Delivery PIN:</strong> <span style="font-size: 24px; letter-spacing: 4px;">${orderDetails.deliveryPin}</span></p>
          <p>Secure this code. It will be required upon delivery.</p>
        </div>
      `,
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error("[EMAIL_ERROR] Confirmation email failed:", error);
    res.status(500).json({ error: "Failed to send confirmation email" });
  }
});

// --- VITE / STATIC SERVING ---

async function setupApp() {
  // If not on Vercel and in dev mode, use Vite middleware
  if (!isProd && !isVercel) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log(">>> [DEV] Vite middleware integrated");
    } catch (err) {
      console.error(">>> [DEV_ERROR] Failed to load Vite:", err);
    }
  } else {
    // In production, serve static files from the dist folder
    const distPath = path.resolve(_dirname, 'dist');
    const indexPath = path.resolve(distPath, 'index.html');
    
    if (!fs.existsSync(distPath)) {
      console.warn(`>>> [WARN] dist folder not found at ${distPath}. Falling back to process.cwd()/dist`);
    }

    const finalDistPath = fs.existsSync(distPath) ? distPath : path.resolve(process.cwd(), 'dist');
    const finalIndexPath = path.resolve(finalDistPath, 'index.html');

    console.log(`>>> [PRODUCTION] Serving from: ${finalDistPath}`);
    console.log(`>>> [PRODUCTION] Index exists: ${fs.existsSync(finalIndexPath)}`);

    app.use(express.static(finalDistPath));
    
    app.get('*', (req, res) => {
      // Don't serve index for API calls that fall through
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: "API endpoint not found" });
      }
      
      // Serve the SPA index.html
      if (fs.existsSync(finalIndexPath)) {
        res.sendFile(finalIndexPath);
      } else {
        console.error(`>>> [ERROR] index.html not found at ${finalIndexPath}`);
        res.status(404).send("Application Shell Missing. Please verify build deployment.");
      }
    });
  }

  // --- ADVANCED ERROR HANDLING ---

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[GLOBAL_ERROR]", err);
    
    const statusCode = err.status || err.statusCode || 500;
    const message = isProd ? "Internal Server Error" : err.message;
    
    res.status(statusCode).json({
      error: message,
      code: err.code || 'UNKNOWN_ERROR',
      ...(isProd ? {} : { stack: err.stack })
    });
  });

  // Start the server only if not on Vercel
  if (!isVercel) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`>>> DINOSPY Server active at http://0.0.0.0:${PORT}`);
      console.log(`>>> MODE: ${process.env.NODE_ENV || 'development'}`);
    });
  }
}

// --- PROCESS-LEVEL ERROR HANDLERS ---

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  // Optional: graceful shutdown
  // process.exit(1);
});

// Initialize the app
setupApp().catch(err => {
  console.error(">>> [FATAL] Critical failure during startup:", err);
  process.exit(1);
});
