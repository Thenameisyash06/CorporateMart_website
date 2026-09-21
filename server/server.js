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
