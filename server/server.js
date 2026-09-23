const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const db = require('./db');
const notifications = require('./notifications');

const app = express();
const PORT = process.env.PORT || 3000;
const SCHEMES_FILE = path.join(__dirname, 'data', 'schemes.json');

// Initialize Database
db.initDB();

// Setup Uploads Directory for Client & Operations Documents
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const docsDir = path.join(uploadsDir, 'documents');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, docsDir);
  },
  filename: function (req, file, cb) {
    const safeName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, safeName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve static frontend files from parent directory with HTML extension support
app.use(express.static(path.join(__dirname, '..'), { extensions: ['html'] }));
app.use('/uploads', express.static(uploadsDir));

// Page shortcuts so URLs without .html work seamlessly
app.get('/operations', (req, res) => res.sendFile(path.join(__dirname, '..', 'operations.html')));
app.get('/portal/operations', (req, res) => res.sendFile(path.join(__dirname, '..', 'operations.html')));
app.get('/client', (req, res) => res.sendFile(path.join(__dirname, '..', 'client.html')));
app.get('/portal/client', (req, res) => res.sendFile(path.join(__dirname, '..', 'client.html')));
app.get('/portal', (req, res) => res.sendFile(path.join(__dirname, '..', 'client.html')));
app.get('/fundraising', (req, res) => res.sendFile(path.join(__dirname, '..', 'fundraising.html')));
app.get('/schemes', (req, res) => res.sendFile(path.join(__dirname, '..', 'fundraising.html')));
app.get('/admin/schemes', (req, res) => res.sendFile(path.join(__dirname, '..', 'fundraising_admin.html')));
app.get('/fundraising-admin', (req, res) => res.sendFile(path.join(__dirname, '..', 'fundraising_admin.html')));
app.get('/fundraising_admin', (req, res) => res.sendFile(path.join(__dirname, '..', 'fundraising_admin.html')));

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

// Require Admin Middleware
async function requireAdmin(req, res, next) {
  try {
    const user = await extractUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Please log in as administrator to continue' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Administrator privileges required' });
    }
    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Authentication failed' });
  }
}

// Require Staff (Operations or Admin) Middleware
async function requireStaff(req, res, next) {
  try {
    const user = await extractUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Please log in to continue' });
    }
    if (user.role !== 'admin' && user.role !== 'operations') {
      return res.status(403).json({ error: 'Access denied: Staff privileges required' });
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

// ==========================================
// UNIQUE VISITOR TRACKING API
// ==========================================

// Track a unique visitor hit
app.post('/api/visitors/hit', async (req, res) => {
  try {
    const visitorId = req.body && req.body.visitorId ? String(req.body.visitorId).trim() : '';
    const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    const result = await db.recordVisitorHit(visitorId, clientIp, userAgent);
    return res.json({
      success: true,
      count: result.count,
      isNew: result.isNew
    });
  } catch (err) {
    console.error('Error tracking visitor hit:', err);
    res.status(500).json({ error: 'Failed to record visitor' });
  }
});

// Get current unique visitor count (read-only)
app.get('/api/visitors/count', async (req, res) => {
  try {
    const count = await db.getVisitorCount();
    return res.json({
      success: true,
      count
    });
  } catch (err) {
    console.error('Error retrieving visitor count:', err);
    res.status(500).json({ error: 'Failed to retrieve visitor count' });
  }
});

// Amount value parsing helper for scheme sorting & filtering
function parseAmountValue(amountStr) {
  if (!amountStr) return 0;
  const str = String(amountStr).toLowerCase();
  const nums = str.match(/[\d\.]+/g);
  if (!nums) return 0;
  const val = parseFloat(nums[nums.length - 1]);
  if (isNaN(val)) return 0;
  if (str.includes('cr') || str.includes('crore')) {
    return val * 10000000;
  }
  if (str.includes('lakh') || str.includes('lac') || str.includes('l')) {
    return val * 100000;
  }
  if (str.includes('k') || str.includes('thousand')) {
    return val * 1000;
  }
  return val;
}

// Load Schemes from Server Store
let cachedMasterSchemes = null;
function loadMasterSchemes() {
  if (cachedMasterSchemes && cachedMasterSchemes.length > 0) {
    return cachedMasterSchemes;
  }
  try {
    if (fs.existsSync(SCHEMES_FILE)) {
      const raw = fs.readFileSync(SCHEMES_FILE, 'utf8');
      cachedMasterSchemes = JSON.parse(raw);
      return cachedMasterSchemes;
    }
  } catch (e2) {
    console.error('Error loading master schemes from file:', e2);
  }
  try {
    cachedMasterSchemes = require('./data/schemes.json');
    return cachedMasterSchemes;
  } catch (e1) {
    console.error('Error requiring master schemes:', e1);
    return [];
  }
}

// Persist Schemes to schemes.json
function saveMasterSchemes(schemes) {
  cachedMasterSchemes = schemes;
  try {
    fs.writeFileSync(SCHEMES_FILE, JSON.stringify(schemes, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving master schemes to disk:', err);
    throw new Error('Failed to persist scheme changes');
  }
}

// ==========================================
// 1. SCHEMES API (Public & Gated View)
// ==========================================
app.get('/api/schemes', async (req, res) => {
  const user = await extractUser(req);
  const isAdmin = user && user.role === 'admin';
  const isSubscriber = isAdmin || (user && user.plan === 'pro' &&
    user.subscriptionExpiresAt &&
    new Date(user.subscriptionExpiresAt).getTime() > Date.now());

  const masterSchemes = loadMasterSchemes();

  if (isSubscriber) {
    // Pro member or Admin: full access to all schemes
    const fullSchemes = masterSchemes.map(s => ({
      ...s,
      isLocked: false
    }));
    return res.json({
      success: true,
      isSubscriber: true,
      isAdmin: Boolean(isAdmin),
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
    isAdmin: false,
    count: redactedSchemes.length,
    schemes: redactedSchemes
  });
});

// ==========================================
// 1B. ADMIN SCHEMES CRUD APIS (requireAdmin)
// ==========================================

// Get all schemes for admin management (unfiltered)
app.get('/api/admin/schemes', requireAdmin, (req, res) => {
  const masterSchemes = loadMasterSchemes();
  res.json({
    success: true,
    count: masterSchemes.length,
    schemes: masterSchemes
  });
});

// Add new scheme (all 11 Excel columns supported)
app.post('/api/admin/schemes', requireAdmin, (req, res) => {
  try {
    const {
      name,
      stage = 'Idea',
      fundingType = 'Grant',
      amount = '',
      deadline = 'Rolling / Ongoing',
      industry = 'All sectors',
      state = 'All India',
      founderType = 'All Founder Eligible',
      entityType = 'Pvt Ltd , LLP , Proprietor',
      programType = '',
      registrations = 'No Mandatory Registration',
      description = '',
      tier = 'pro'
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Scheme name is required' });
    }

    const masterSchemes = loadMasterSchemes();
    const newId = 'scheme-' + Date.now();
    const parsedAmountValue = parseAmountValue(amount);

    const newScheme = {
      id: newId,
      name: String(name).trim(),
      stage: String(stage || 'Idea').trim(),
      fundingType: String(fundingType || 'Grant').trim(),
      amount: String(amount || 'Custom Grant Support').trim(),
      amountValue: parsedAmountValue,
      deadline: String(deadline || 'Rolling / Ongoing').trim(),
      industry: String(industry || 'All sectors').trim(),
      state: String(state || 'All India').trim(),
      founderType: String(founderType || 'All Founder Eligible').trim(),
      entityType: String(entityType || 'Pvt Ltd , LLP , Proprietor').trim(),
      programType: String(programType || '').trim(),
      registrations: String(registrations || 'No Mandatory Registration').trim(),
      description: String(description || `Comprehensive funding program providing ${fundingType} assistance for ${stage} stage ventures across ${industry}.`).trim(),
      tier: (tier === 'free' ? 'free' : 'pro')
    };

    masterSchemes.unshift(newScheme);
    saveMasterSchemes(masterSchemes);

    res.status(201).json({
      success: true,
      message: `Scheme "${newScheme.name}" created successfully!`,
      scheme: newScheme
    });
  } catch (err) {
    console.error('Error creating scheme:', err);
    res.status(500).json({ error: err.message || 'Failed to create scheme' });
  }
});

// Update scheme by ID
app.put('/api/admin/schemes/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const masterSchemes = loadMasterSchemes();
    const index = masterSchemes.findIndex(s => s.id === id);

    if (index === -1) {
      return res.status(404).json({ error: `Scheme with ID "${id}" not found` });
    }

    const existing = masterSchemes[index];
    const b = req.body;

    const updatedName = b.name !== undefined ? String(b.name).trim() : existing.name;
    if (!updatedName) {
      return res.status(400).json({ error: 'Scheme name cannot be empty' });
    }

    const updatedAmount = b.amount !== undefined ? String(b.amount).trim() : existing.amount;
    const updatedAmountVal = b.amount !== undefined ? parseAmountValue(updatedAmount) : (existing.amountValue || 0);

    const updatedScheme = {
      ...existing,
      name: updatedName,
      stage: b.stage !== undefined ? String(b.stage).trim() : existing.stage,
      fundingType: b.fundingType !== undefined ? String(b.fundingType).trim() : existing.fundingType,
      amount: updatedAmount,
      amountValue: updatedAmountVal,
      deadline: b.deadline !== undefined ? String(b.deadline).trim() : existing.deadline,
      industry: b.industry !== undefined ? String(b.industry).trim() : existing.industry,
      state: b.state !== undefined ? String(b.state).trim() : existing.state,
      founderType: b.founderType !== undefined ? String(b.founderType).trim() : existing.founderType,
      entityType: b.entityType !== undefined ? String(b.entityType).trim() : existing.entityType,
      programType: b.programType !== undefined ? String(b.programType).trim() : existing.programType,
      registrations: b.registrations !== undefined ? String(b.registrations).trim() : existing.registrations,
      description: b.description !== undefined ? String(b.description).trim() : existing.description,
      tier: b.tier !== undefined ? (b.tier === 'free' ? 'free' : 'pro') : existing.tier
    };

    masterSchemes[index] = updatedScheme;
    saveMasterSchemes(masterSchemes);

    res.json({
      success: true,
      message: `Scheme "${updatedScheme.name}" updated successfully!`,
      scheme: updatedScheme
    });
  } catch (err) {
    console.error('Error updating scheme:', err);
    res.status(500).json({ error: err.message || 'Failed to update scheme' });
  }
});

// Delete scheme by ID
app.delete('/api/admin/schemes/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const masterSchemes = loadMasterSchemes();
    const index = masterSchemes.findIndex(s => s.id === id);

    if (index === -1) {
      return res.status(404).json({ error: `Scheme with ID "${id}" not found` });
    }

    const deleted = masterSchemes.splice(index, 1)[0];
    saveMasterSchemes(masterSchemes);

    res.json({
      success: true,
      message: `Scheme "${deleted.name}" deleted successfully!`,
      deletedId: id
    });
  } catch (err) {
    console.error('Error deleting scheme:', err);
    res.status(500).json({ error: err.message || 'Failed to delete scheme' });
  }
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
    const token = db.createToken({ id: user.id, email: user.email, role: user.role });

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
    const token = db.createToken({ id: user.id, email: user.email, role: user.role });

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

// ==========================================
// PORTAL AUTHENTICATION API
// ==========================================

// Portal / Operations Login
app.post('/api/portal/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const user = await db.findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials: User not found' });
    }
    const valid = db.verifyPassword(password, user.salt, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials: Password incorrect' });
    }

    const token = db.createToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      companyName: user.companyName || user.name
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        companyName: user.companyName || user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role
      }
    });
  } catch (err) {
    console.error('Portal login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Current User Profile
app.get('/api/portal/auth/me', requireAuth, (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      companyName: req.user.companyName || req.user.name,
      email: req.user.email,
      phone: req.user.phone || '',
      role: req.user.role
    }
  });
});

// Request Password Reset OTP
app.post('/api/portal/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email address is required' });
    const cleanEmail = String(email).trim().toLowerCase();

    // Generate secure 6-digit numeric code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    const user = await db.setUserResetOtp(cleanEmail, otp, expiresAt);
    console.log(`🔐 [RESET-OTP] Code for ${cleanEmail}: ${otp}`);

    // Send email asynchronously
    notifications.sendPasswordResetOtpEmail({
      email: cleanEmail,
      name: user.name,
      otp
    }).catch(e => console.warn('Reset OTP email error:', e.message));

    return res.json({
      success: true,
      message: 'A 6-digit verification code has been sent to your email.',
      devOtp: otp
    });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    return res.status(400).json({ error: err.message || 'Failed to process password reset' });
  }
});

// Verify OTP & Reset Password
app.post('/api/portal/auth/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body || {};
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await db.verifyAndResetPassword(email, otp, newPassword);

    notifications.sendPasswordChangedConfirmationEmail({
      email: user.email,
      name: user.name
    }).catch(e => console.warn('Password confirmation email error:', e.message));

    return res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (err) {
    console.error('Verify reset OTP error:', err.message);
    return res.status(400).json({ error: err.message || 'Failed to reset password' });
  }
});

// Update Profile Details (Protected)
app.patch('/api/portal/auth/profile', requireAuth, async (req, res) => {
  try {
    const { name, phone, companyName } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }
    const updated = await db.updateUserProfile(req.user.id, {
      name,
      phone,
      companyName
    });

    return res.json({
      success: true,
      message: 'Profile details updated successfully',
      user: {
        id: updated.id,
        name: updated.name,
        companyName: updated.companyName || updated.name,
        email: updated.email,
        phone: updated.phone || '',
        role: updated.role
      }
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

// Change Password (Protected)
app.post('/api/portal/auth/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    await db.updateUserPassword(req.user.id, currentPassword, newPassword);

    notifications.sendPasswordChangedConfirmationEmail({
      email: req.user.email,
      name: req.user.name
    }).catch(e => console.warn('Password change email error:', e.message));

    return res.json({
      success: true,
      message: 'Password changed successfully!'
    });
  } catch (err) {
    console.error('Change password error:', err.message);
    return res.status(400).json({ error: err.message || 'Failed to change password' });
  }
});

// ==========================================
// OPERATIONS PORTAL API (STAFF ONLY)
// ==========================================

// Get Operations KPI stats
app.get('/api/portal/ops/stats', requireStaff, async (req, res) => {
  try {
    const stats = await db.getPortalStats();
    return res.json({ success: true, stats });
  } catch (err) {
    console.error('Error fetching portal stats:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch portal stats' });
  }
});

// Get Clients Directory
app.get('/api/portal/ops/clients', requireStaff, async (req, res) => {
  try {
    const clients = await db.getPortalClients();
    return res.json({ success: true, clients });
  } catch (err) {
    console.error('Error fetching clients:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch clients' });
  }
});

// Onboard New Client (Operations Only)
app.post('/api/portal/ops/clients', requireStaff, async (req, res) => {
  try {
    const { name, companyName, email, phone, password, initialService } = req.body || {};
    if (!name || !companyName || !email) {
      return res.status(400).json({ error: 'Director Name, Company Name, and Email are required' });
    }

    const client = await db.createPortalClient({
      name,
      companyName,
      email,
      phone: phone || '',
      password: password || 'Client@123'
    });

    // If an initial service is chosen, create the first case automatically
    let createdCase = null;
    if (initialService) {
      createdCase = await db.createPortalCase({
        clientId: client.id,
        clientName: client.name,
        companyName: client.companyName,
        serviceName: initialService,
        status: 'in_review',
        statusNote: 'Client onboarded. Case opened for initial document processing.'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Client onboarded successfully',
      client,
      initialCase: createdCase
    });
  } catch (err) {
    console.error('Error onboarding client:', err);
    return res.status(400).json({ error: err.message || 'Failed to onboard client' });
  }
});

// Update Client Status & Profile (Operations Only)
app.put('/api/portal/ops/clients/:id', requireStaff, async (req, res) => {
  try {
    const clientId = req.params.id;
    const { name, companyName, email, phone, status } = req.body || {};
    const updated = await db.updatePortalClient(clientId, { name, companyName, email, phone, status });
    return res.json({ success: true, message: 'Client updated successfully', client: updated });
  } catch (err) {
    console.error('Error updating client:', err);
    return res.status(400).json({ error: err.message || 'Failed to update client' });
  }
});

// Delete Client Account (Operations Only)
app.delete('/api/portal/ops/clients/:id', requireStaff, async (req, res) => {
  try {
    const clientId = req.params.id;
    await db.deletePortalClient(clientId);
    return res.json({ success: true, message: 'Client and associated records deleted successfully' });
  } catch (err) {
    console.error('Error deleting client:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete client' });
  }
});

// Get Specific Client's Documents (Operations Only)
app.get('/api/portal/ops/clients/:id/documents', requireStaff, async (req, res) => {
  try {
    const clientId = req.params.id;
    const documents = await db.getPortalDocuments({ clientId });
    return res.json({ success: true, documents });
  } catch (err) {
    console.error('Error fetching client documents:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch client documents' });
  }
});

// Get Cases (Services)
app.get('/api/portal/ops/cases', requireStaff, async (req, res) => {
  try {
    const cases = await db.getPortalCases(req.query);
    return res.json({ success: true, cases });
  } catch (err) {
    console.error('Error fetching cases:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch cases' });
  }
});

// Create Case
app.post('/api/portal/ops/cases', requireStaff, async (req, res) => {
  try {
    const { clientId, clientName, companyName, serviceName, status, statusNote } = req.body || {};
    if (!clientId || !serviceName) {
      return res.status(400).json({ error: 'Client and Service Name are required' });
    }
    const newCase = await db.createPortalCase({
      clientId,
      clientName: clientName || '',
      companyName: companyName || '',
      serviceName,
      status: status || 'in_review',
      statusNote: statusNote || 'Case created by operations.'
    });
    return res.status(201).json({ success: true, case: newCase });
  } catch (err) {
    console.error('Error creating case:', err);
    return res.status(500).json({ error: err.message || 'Failed to create case' });
  }
});

// Update Case Status & Note
app.patch('/api/portal/ops/cases/:id/status', requireStaff, async (req, res) => {
  try {
    const { status, note } = req.body || {};
    if (!status) {
      return res.status(400).json({ error: 'New status is required' });
    }
    const updated = await db.updatePortalCaseStatus(req.params.id, status, note);

    if (updated && (status === 'rejected' || status === 'pending_documents')) {
      (async () => {
        try {
          const clientUser = await db.findUserById(updated.clientId);
          if (clientUser) {
            await notifications.notifyClient({
              client: clientUser,
              eventType: 'case_rejected',
              data: {
                serviceName: updated.serviceName,
                statusNote: note || updated.statusNote,
                caseId: updated.caseId
              }
            });
          }
        } catch (nErr) {
          console.warn('Status notification error:', nErr.message);
        }
      })();
    }

    return res.json({ success: true, case: updated });
  } catch (err) {
    console.error('Error updating case status:', err);
    return res.status(500).json({ error: err.message || 'Failed to update case status' });
  }
});

// Get Documents
app.get('/api/portal/ops/documents', requireStaff, async (req, res) => {
  try {
    const documents = await db.getPortalDocuments(req.query);
    return res.json({ success: true, documents });
  } catch (err) {
    console.error('Error fetching documents:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch documents' });
  }
});

// Upload Document for Client/Case (Auto-Approves Service)
app.post('/api/portal/ops/documents/upload', requireStaff, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file uploaded' });
    }
    const { clientId, companyName, caseId, title, category, autoApprove } = req.body || {};
    const fileUrl = '/uploads/documents/' + req.file.filename;
    const sizeInKb = (req.file.size / 1024).toFixed(1);
    const fileSize = req.file.size > 1024 * 1024 ? (req.file.size / (1024 * 1024)).toFixed(1) + ' MB' : sizeInKb + ' KB';
    const shouldAutoApprove = autoApprove !== 'false';

    const document = await db.createPortalDocument({
      clientId: clientId || '',
      companyName: companyName || '',
      caseId: caseId || '',
      title: title || req.file.originalname,
      fileName: req.file.originalname,
      fileUrl,
      fileSize,
      fileType: req.file.mimetype,
      category: category || 'certificate',
      uploadedBy: 'operations',
      status: 'approved',
      autoApprove: shouldAutoApprove
    });

    let updatedCase = null;
    if (caseId && shouldAutoApprove) {
      try {
        updatedCase = await db.updatePortalCaseStatus(
          caseId,
          'approved',
          `Approved: ${title || req.file.originalname} has been uploaded and is ready for download.`
        );
      } catch (err) {
        console.warn('Auto-approval status update error:', err.message);
      }
    }

    // Trigger in-phone push alert and email notification for client
    if (clientId) {
      (async () => {
        try {
          const clientUser = await db.findUserById(clientId);
          if (clientUser) {
            await notifications.notifyClient({
              client: clientUser,
              eventType: 'document_uploaded',
              data: {
                title: document.title,
                fileName: document.fileName,
                caseId: document.caseId,
                fileUrl: document.fileUrl
              }
            });
          }
        } catch (nErr) {
          console.warn('Document upload notification error:', nErr.message);
        }
      })();
    }

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully' + (caseId && shouldAutoApprove ? ' and service marked Approved!' : ''),
      document,
      case: updatedCase
    });
  } catch (err) {
    console.error('Error uploading document:', err);
    return res.status(500).json({ error: err.message || 'Failed to upload document' });
  }
});

// Revoke Document Separately (Operations Only)
app.patch('/api/portal/ops/documents/:id/revoke', requireStaff, async (req, res) => {
  try {
    const docId = req.params.id;
    const { reason } = req.body || {};
    const revoked = await db.revokePortalDocument(docId, reason || 'Revoked by Operations');
    return res.json({ success: true, message: 'Document revoked successfully', document: revoked });
  } catch (err) {
    console.error('Error revoking document:', err);
    return res.status(400).json({ error: err.message || 'Failed to revoke document' });
  }
});

// Delete Document Permanently (Operations Only)
app.delete('/api/portal/ops/documents/:id', requireStaff, async (req, res) => {
  try {
    const docId = req.params.id;
    await db.deletePortalDocument(docId);
    return res.json({ success: true, message: 'Document permanently deleted' });
  } catch (err) {
    console.error('Error deleting document:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete document' });
  }
});

// Get Applications / Orders (from Buy section)
app.get('/api/portal/ops/orders', requireStaff, async (req, res) => {
  try {
    const orders = await db.getPortalOrders(req.query);
    return res.json({ success: true, orders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch orders' });
  }
});

// 1-Click Activate Order -> Converts order into active client services
app.post('/api/portal/ops/orders/:id/activate', requireStaff, async (req, res) => {
  try {
    const activated = await db.activatePortalOrder(req.params.id);
    return res.json({
      success: true,
      message: 'Order activated successfully and service cases opened!',
      order: activated
    });
  } catch (err) {
    console.error('Error activating order:', err);
    return res.status(500).json({ error: err.message || 'Failed to activate order' });
  }
});

// Get Support Tickets
app.get('/api/portal/ops/tickets', requireStaff, async (req, res) => {
  try {
    const tickets = await db.getPortalTickets(req.query);
    return res.json({ success: true, tickets });
  } catch (err) {
    console.error('Error fetching tickets:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch tickets' });
  }
});

// Reply to Ticket
app.post('/api/portal/ops/tickets/:id/reply', requireStaff, async (req, res) => {
  try {
    const { message, status } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    const updated = await db.replyPortalTicket(req.params.id, message, status, req.user.name);

    if (updated) {
      (async () => {
        try {
          const clientUser = await db.findUserById(updated.clientId);
          if (clientUser) {
            await notifications.notifyClient({
              client: clientUser,
              eventType: 'ticket_reply',
              data: {
                subject: updated.subject,
                message,
                staffName: req.user.name,
                ticketId: updated.ticketId,
                category: updated.category
              }
            });
          }
        } catch (nErr) {
          console.warn('Ticket reply notification error:', nErr.message);
        }
      })();
    }

    return res.json({
      success: true,
      message: 'Reply sent successfully',
      ticket: updated
    });
  } catch (err) {
    console.error('Error replying to ticket:', err);
    return res.status(500).json({ error: err.message || 'Failed to reply to ticket' });
  }
});

// ==========================================
// CLIENT PORTAL API (FOR LOGGED-IN CLIENTS)
// ==========================================

// Client Dashboard Data
app.get('/api/portal/client/dashboard', requireAuth, async (req, res) => {
  try {
    const data = await db.getClientPortalData(req.user.id, req.user.email, req.user.companyName);
    return res.json({
      success: true,
      client: {
        id: req.user.id,
        name: req.user.name,
        companyName: req.user.companyName || req.user.name,
        email: req.user.email,
        phone: req.user.phone || '',
        plan: req.user.plan || 'free',
        isSubscriber: Boolean(
          (req.user.plan === 'pro' || req.user.plan === 'growth' || req.user.plan === 'corporate') &&
          req.user.subscriptionExpiresAt &&
          new Date(req.user.subscriptionExpiresAt).getTime() > Date.now()
        )
      },
      ...data
    });
  } catch (err) {
    console.error('Error fetching client dashboard:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch client data' });
  }
});

// Client Services List
app.get('/api/portal/client/services', requireAuth, async (req, res) => {
  try {
    const data = await db.getClientPortalData(req.user.id, req.user.email, req.user.companyName);
    return res.json({ success: true, services: data.cases || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch services' });
  }
});

// Client Documents List
app.get('/api/portal/client/documents', requireAuth, async (req, res) => {
  try {
    const data = await db.getClientPortalData(req.user.id, req.user.email, req.user.companyName);
    return res.json({ success: true, documents: data.documents || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch documents' });
  }
});

// Client Support Messages / Tickets
app.get('/api/portal/client/tickets', requireAuth, async (req, res) => {
  try {
    const data = await db.getClientPortalData(req.user.id, req.user.email, req.user.companyName);
    return res.json({ success: true, tickets: data.tickets || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch messages' });
  }
});

// Client Send New Support Message / Ticket
app.post('/api/portal/client/tickets', requireAuth, async (req, res) => {
  try {
    const { subject, message, category, priority } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    const ticket = await db.createClientTicket({
      clientId: req.user.id,
      clientName: req.user.name,
      companyName: req.user.companyName || req.user.name,
      subject: subject || 'Support Question',
      message,
      category: category || 'general',
      priority: priority || 'medium'
    });
    return res.status(201).json({ success: true, message: 'Message sent to Corporate Mart team!', ticket });
  } catch (err) {
    console.error('Error creating client ticket:', err);
    return res.status(500).json({ error: err.message || 'Failed to send message' });
  }
});

// Client Reply to Existing Ticket
app.post('/api/portal/client/tickets/:id/reply', requireAuth, async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Reply text is required' });
    }
    const updated = await db.replyClientTicket(req.params.id, req.user.id, message, req.user.name);
    return res.json({ success: true, message: 'Reply sent successfully', ticket: updated });
  } catch (err) {
    console.error('Error replying as client:', err);
    return res.status(500).json({ error: err.message || 'Failed to send reply' });
  }
});

// ==========================================
// NOTIFICATIONS API (WEB PUSH & ALERTS)
// ==========================================

// Get VAPID Public Key for client browser subscription
app.get('/api/portal/notifications/vapid-public-key', (req, res) => {
  return res.json({
    success: true,
    publicKey: notifications.VAPID_PUBLIC_KEY
  });
});

// Save Client Web Push Subscription (In-Phone Notifications)
app.post('/api/portal/client/notifications/subscribe', requireAuth, async (req, res) => {
  try {
    const { subscription } = req.body || {};
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Valid push subscription object required' });
    }
    await db.savePushSubscription(req.user.id, subscription);
    return res.json({
      success: true,
      message: 'In-phone notifications enabled successfully!'
    });
  } catch (err) {
    console.error('Error saving push subscription:', err);
    return res.status(500).json({ error: 'Failed to save push subscription' });
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
