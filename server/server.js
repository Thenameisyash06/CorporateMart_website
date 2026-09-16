const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SCHEMES_FILE = path.join(__dirname, 'data', 'schemes.json');

// Initialize Database
db.initDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from parent directory with HTML extension support
app.use(express.static(path.join(__dirname, '..'), { extensions: ['html'] }));

// Page shortcuts so URLs without .html work seamlessly
app.get('/fundraising', (req, res) => res.sendFile(path.join(__dirname, '..', 'fundraising.html')));
app.get('/schemes', (req, res) => res.sendFile(path.join(__dirname, '..', 'fundraising.html')));

// Optional Auth Helper: checks if valid token is provided
async function extractUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const payload = db.verifyToken(token);
  if (!payload || !payload.id) return null;
  return await db.findUserById(payload.id);
}

// Require Auth Middleware
async function requireAuth(req, res, next) {
  try {
    const user = await extractUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Please log in to continue' });
    }
    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Authentication failed' });
  }
}

// Healthcheck / Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CorporateMart API is running',
    timestamp: new Date().toISOString()
  });
});

// Load Schemes from Server Store (with automatic bundling support)
let cachedMasterSchemes = null;
function loadMasterSchemes() {
  if (cachedMasterSchemes && cachedMasterSchemes.length > 0) {
    return cachedMasterSchemes;
  }
  try {
    cachedMasterSchemes = require('./data/schemes.json');
    return cachedMasterSchemes;
  } catch (e1) {
    try {
      if (fs.existsSync(SCHEMES_FILE)) {
        const raw = fs.readFileSync(SCHEMES_FILE, 'utf8');
        cachedMasterSchemes = JSON.parse(raw);
        return cachedMasterSchemes;
      }
    } catch (e2) {
      console.error('Error loading master schemes from file:', e2);
    }
    console.error('Error loading master schemes:', e1);
    return [];
  }
}

// ==========================================
// 1. SCHEMES API (Gated & Server-Protected)
// ==========================================
app.get('/api/schemes', async (req, res) => {
  const user = await extractUser(req);
  const isSubscriber = user && user.plan === 'pro' &&
    user.subscriptionExpiresAt &&
    new Date(user.subscriptionExpiresAt).getTime() > Date.now();

  const masterSchemes = loadMasterSchemes();

  if (isSubscriber) {
    // Pro member: full access to all schemes
    const fullSchemes = masterSchemes.map(s => ({
      ...s,
      isLocked: false
    }));
    return res.json({
      success: true,
      isSubscriber: true,
      count: fullSchemes.length,
      schemes: fullSchemes
    });
  }

  // Guest / Free member: redact sensitive pro scheme data
  const redactedSchemes = masterSchemes.map(s => {
    if (s.tier === 'free') {
      return {
        ...s,
        isLocked: false
      };
    }

    // Locked Pro scheme: keep title, stage, fundingType, with blurred placeholders
    return {
      id: s.id,
      name: s.name,
      stage: s.stage,
      fundingType: s.fundingType,
      deadline: s.deadline || '25 October 2026',
      tier: 'pro',
      isLocked: true,
      amount: '₹ 25 Lakh - ₹ 2 Crore',
      amountValue: null,
      industry: 'Technology / CleanTech / Innovation',
      state: s.state,
      founderType: 'All Founders Eligible',
      entityType: 'Pvt Ltd / LLP / OPC',
      programType: s.programType || '',
      registrations: 'DPIIT Registered',
      description: 'This high-impact grant & equity funding opportunity is exclusively accessible to CorporateMart Pro members. Upgrade your plan to view detailed eligibility, application guidelines, and direct expert assistance.'
    };
  });

  return res.json({
    success: true,
    isSubscriber: false,
    count: redactedSchemes.length,
    schemes: redactedSchemes
  });
});

// ==========================================
// 2. AUTHENTICATION APIS
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = String(phone || '').trim();
    const existing = await db.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const user = await db.createUser({ name, email: cleanEmail, phone: cleanPhone, password });
    const token = db.createToken({ id: user.id, email: user.email });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user,
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const rawUser = await db.findUserByEmail(cleanEmail);
    if (!rawUser) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = db.verifyPassword(password, rawUser.salt, rawUser.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = db.sanitizeUser(rawUser);
    const token = db.createToken({ id: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Logged in successfully',
      user,
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.sanitizeUser(req.user);
  res.json({ success: true, user });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email, phone, newPassword } = req.body;
    if (!email || !phone || !newPassword) {
      return res.status(400).json({ error: 'Email, phone number, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    await db.resetUserPassword({ email: cleanEmail, phone: cleanPhone, newPassword });

    res.json({
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.'
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Password reset failed' });
  }
});

// ==========================================
// 3. SUBSCRIPTION & PAYMENT APIS
// ==========================================
const PLANS = {
  pro_99: { id: 'pro_99', name: 'CorporateMart Pro Access', amount: 99, durationDays: 30 },
  monthly: { id: 'pro_99', name: 'CorporateMart Pro Access', amount: 99, durationDays: 30 },
  annual: { id: 'pro_99', name: 'CorporateMart Pro Access', amount: 99, durationDays: 30 }
};

app.get('/api/config', (req, res) => {
  const rzpKey = (process.env.RAZORPAY_KEY_ID || '').trim();
  const rzpSecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  res.json({
    razorpayKeyId: rzpKey || 'rzp_test_demo',
    isLiveConfigured: !!(rzpKey && rzpSecret && !rzpKey.includes('demo')),
    plans: PLANS
  });
});

app.post('/api/payment/create-order', requireAuth, async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = PLANS[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const rzpKey = (process.env.RAZORPAY_KEY_ID || '').trim();
    const rzpSecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

    if (rzpKey && rzpSecret && !rzpKey.includes('demo')) {
      // Real or Live Test Razorpay API Call
      const authHeader = 'Basic ' + Buffer.from(rzpKey + ':' + rzpSecret).toString('base64');
      const orderPayload = {
        amount: plan.amount * 100, // paise
        currency: 'INR',
        receipt: 'rcpt_' + req.userId.slice(-6) + '_' + Date.now(),
        notes: {
          userId: req.userId,
          planId: plan.id,
          userEmail: req.user.email
        }
      };

      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(orderPayload)
      });

      const orderData = await response.json();
      if (!response.ok) {
        throw new Error(orderData.error ? orderData.error.description : 'Failed to create Razorpay order');
      }

      return res.json({
        success: true,
        orderId: orderData.id,
        amount: orderData.amount,
        currency: 'INR',
        keyId: rzpKey,
        planId: plan.id,
        planName: plan.name,
        isDemo: false
      });
    }

    // Instant Developer / Simulated Sandbox Mode (when real merchant keys not yet configured in .env)
    const demoOrderId = 'order_sim_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    return res.json({
      success: true,
      orderId: demoOrderId,
      amount: plan.amount * 100,
      currency: 'INR',
      keyId: 'rzp_test_simulated',
      planId: plan.id,
      planName: plan.name,
      isDemo: true
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: err.message || 'Order creation failed' });
  }
});

app.post('/api/payment/verify', requireAuth, async (req, res) => {
  try {
    const { orderId, paymentId, signature, planId } = req.body;
    const plan = PLANS[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const rzpSecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

    // If live Razorpay keys are in use, verify HMAC SHA256 signature
    if (rzpSecret && !rzpSecret.includes('demo')) {
      const generatedSignature = crypto
        .createHmac('sha256', rzpSecret)
        .update(orderId + '|' + paymentId)
        .digest('hex');

      if (generatedSignature !== signature) {
        return res.status(400).json({ error: 'Cryptographic signature verification failed: Invalid payment' });
      }
    } else {
      // In demo mode, ensure orderId and paymentId exist
      if (!orderId || !paymentId) {
        return res.status(400).json({ error: 'Missing payment details' });
      }
    }

    // Activate subscription in database
    const updatedUser = await db.updateUserSubscription(req.userId, {
      plan: 'pro',
      durationDays: plan.durationDays
    });

    // Record verified transaction
    await db.recordTransaction({
      userId: req.userId,
      orderId,
      paymentId,
      amount: plan.amount,
      planId: plan.id,
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Congratulations! ' + plan.name + ' is now active on your account.',
      user: updatedUser
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
});

// Start Server if run directly
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('====================================================');
    console.log('  CorporateMart Secure Server Running!             ');
    console.log('  Local URL: http://localhost:' + PORT);
    console.log('  Fundraising Portal: http://localhost:' + PORT + '/fundraising.html');
    console.log('  Short URL: http://localhost:' + PORT + '/fundraising');
    console.log('====================================================');
  });
}

module.exports = app;
