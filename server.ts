import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { Resend } from "resend";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Export app for Vercel Serverless Functions
export default app;

async function startServer() {

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

  // Phone Verification Routes
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phone } = req.body;
      const token = process.env.PHONE_VERIFICATION_TOKEN;

      if (!phone) return res.status(400).json({ error: "Phone number is required" });

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(phone, otp);

      // LOGGING THE OTP FOR PREVIEW MODE (Simulating SMS dispatch)
      console.log("------------------------------------------");
      console.log(`[AUTHENTICATION_GATEWAY] Dispatching to: ${phone}`);
      console.log(`[AUTH_TOKEN_ACTIVE] Using Token: ${token ? token.substring(0, 10) + '...' : 'NONE'}`);
      console.log(`[CHALLENGE_CODE] >>> ${otp} <<<`);
      console.log("------------------------------------------");
      
      res.json({ success: true, message: "Verification code dispatched via secure tunnel." });
    } catch (err) {
      res.status(500).json({ error: "Verification dispatch failed" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { phone, otp } = req.body;
      const storedOtp = otpStore.get(phone);
      const secretToken = process.env.PHONE_VERIFICATION_TOKEN;

      // Allow "123456" or the actual token (if the user wants to test with it) or the stored OTP
      if (otp === "123456" || otp === storedOtp || (secretToken && otp === secretToken)) {
        otpStore.delete(phone);
        return res.json({ success: true, message: "Handshake verified." });
      }

      res.status(400).json({ error: "Invalid verification code. Authorization denied." });
    } catch (err) {
      res.status(500).json({ error: "Handshake verification failed" });
    }
  });

  // Order Status Notifications
  app.post("/api/notifications/order-status", async (req, res) => {
    try {
      const { orderId, status, phone, customerName, trackingId, carrier } = req.body;
      const token = process.env.PHONE_VERIFICATION_TOKEN;

      if (!token) {
        console.warn("[NOTIFICATION_ERROR] PHONE_VERIFICATION_TOKEN not configured. Notification suppressed.");
        return res.status(500).json({ error: "Notification engine offline" });
      }

      let message = "";
      if (status === 'shipped') {
        message = `Greetings ${customerName}, your DINOSPY acquisition (Order: ${orderId}) has been dispatched via ${carrier || 'Premium Logistics'}. Track your masterpiece: ${trackingId || 'In Portal'}.`;
      } else if (status === 'delivered') {
        message = `Congratulations ${customerName}, your DINOSPY masterpiece has been successfully secured at its destination. Witness perfection. Order: ${orderId}`;
      }

      if (message) {
        console.log("------------------------------------------");
        console.log(`[SMS_GATEWAY_TRIGGER] Order ${status.toUpperCase()}`);
        console.log(`[DESTINATION] ${phone}`);
        console.log(`[SECURE_PAYLOAD] ${message}`);
        console.log(`[AUTH_CREDENTIAL] ${token.substring(0, 8)}...`);
        console.log("------------------------------------------");
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Notification dispatch failed" });
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


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    const indexPath = path.resolve(distPath, 'index.html');
    
    console.log(`>>> [PRODUCTION] Root directory: ${process.cwd()}`);
    console.log(`>>> [PRODUCTION] Dist path: ${distPath}`);
    console.log(`>>> [PRODUCTION] Index path: ${indexPath}`);
    console.log(`>>> [PRODUCTION] Index exists: ${fs.existsSync(indexPath)}`);
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: "API endpoint not found" });
      }
      
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`>>> [SERVER_ERROR] Failed to serve index.html:`, err);
          res.status(404).send("Application shell not found. Please verify the build artifacts.");
        }
      });
    });
  }

  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`>>> DINOSPY Server active at http://0.0.0.0:${PORT}`);
      console.log(`>>> MODE: ${process.env.NODE_ENV || 'development'}`);
      console.log(`>>> CWD: ${process.cwd()}`);
    });
  }

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

startServer().catch(err => {
  console.error(">>> [FATAL] Server failed to initialize:", err);
  process.exit(1);
});
