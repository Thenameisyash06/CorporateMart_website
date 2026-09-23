const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const crypto = require('crypto');
const mongoose = require('mongoose');

const User = require('./models/User');
const Transaction = require('./models/Transaction');
const { VisitorRecord, VisitorStats } = require('./models/Visitor');
const PortalCase = require('./models/PortalCase');
const PortalDocument = require('./models/PortalDocument');
const PortalOrder = require('./models/PortalOrder');
const PortalTicket = require('./models/PortalTicket');

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DB_FILE = IS_SERVERLESS
  ? path.join('/tmp', 'database.json')
  : path.join(__dirname, 'data', 'database.json');
const VISITORS_FILE = IS_SERVERLESS
  ? path.join('/tmp', 'visitors.json')
  : path.join(__dirname, 'data', 'visitors.json');
const JWT_SECRET = process.env.JWT_SECRET || 'corporate_mart_secret_key_2026_x89a!secure';
const INITIAL_VISITOR_COUNT = parseInt(process.env.INITIAL_VISITOR_COUNT, 10) || 29;

let isMongoConnected = false;
let mongoPromise = null;

// Connect to MongoDB Atlas if URI is provided in .env or environment variables
async function initMongo() {
  if (mongoose.connection && mongoose.connection.readyState >= 1) {
    isMongoConnected = true;
    return true;
  }
  const uri = (process.env.MONGODB_URI || process.env.MONGO_DB_URI || '').trim();
  if (!uri || uri.includes('<password>') || uri.includes('YOUR_PASSWORD') || uri === '') {
    if (!IS_SERVERLESS) {
      console.log('ℹ [DB] Using Local File Database (server/data/database.json).');
      console.log('ℹ [DB] To connect to MongoDB Atlas, add your MONGODB_URI in server/.env or Vercel Environment Variables');
    }
    return false;
  }

  try {
    if (!mongoPromise) {
      mongoPromise = mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
    }
    await mongoPromise;
    isMongoConnected = true;
    console.log('✔ [DB] Successfully connected to MongoDB Atlas!');
    seedMongoPortalDefaults().catch(() => {});
    return true;
  } catch (err) {
    mongoPromise = null;
    isMongoConnected = false;
    console.warn('⚠️ [DB] MongoDB Atlas connection failed (' + err.message + '). Falling back to Local File Database.');
    return false;
  }
}

async function seedMongoPortalDefaults() {
  try {
    const casesCount = await PortalCase.countDocuments();
    if (casesCount === 0) {
      await PortalCase.create([
        {
          caseId: 'CAS-1001',
          clientId: 'usr_client_abc',
          clientName: 'Rajesh Sharma',
          companyName: 'ABC PRIVATE LIMITED',
          serviceName: 'Company Registration',
          status: 'approved',
          statusNote: 'Certificate of Incorporation issued with CIN & PAN.',
          documentsCount: 1,
          timeline: [
            { stage: 'Name Approval', status: 'approved', note: 'RUN name approved by ROC.', date: new Date(Date.now() - 15 * 86400000) },
            { stage: 'SPICe+ Incorporation', status: 'approved', note: 'MCA approval granted & COI delivered.', date: new Date(Date.now() - 10 * 86400000) }
          ]
        },
        {
          caseId: 'CAS-1002',
          clientId: 'usr_client_abc',
          clientName: 'Rajesh Sharma',
          companyName: 'ABC PRIVATE LIMITED',
          serviceName: 'GST Registration',
          status: 'in_review',
          statusNote: 'Application submitted on GST Portal. Awaiting ARN verification.',
          documentsCount: 0,
          timeline: [
            { stage: 'Document Verification', status: 'approved', note: 'Electricity bill & rent agreement verified.', date: new Date(Date.now() - 5 * 86400000) },
            { stage: 'ARN Generation', status: 'in_review', note: 'Submitted on GST common portal.', date: new Date(Date.now() - 2 * 86400000) }
          ]
        }
      ]);
    }

    const orderCount = await PortalOrder.countDocuments();
    if (orderCount === 0) {
      await PortalOrder.create({
        orderId: 'ORD-2026-101',
        clientId: 'usr_client_abc',
        clientName: 'Rajesh Sharma',
        companyName: 'ABC PRIVATE LIMITED',
        email: 'client@abc.com',
        phone: '+919811223344',
        planName: 'BUSINESS GROWTH PLAN',
        services: ['Company Registration', 'GST Registration', 'Trademark', 'MSME Registration', 'Basic Compliance'],
        notes: 'Need priority trademark search and MSME certificate.',
        status: 'pending_review'
      });
    }

    const ticketCount = await PortalTicket.countDocuments();
    if (ticketCount === 0) {
      await PortalTicket.create({
        ticketId: 'CM-10231',
        clientId: 'usr_client_abc',
        clientName: 'Rajesh Sharma',
        companyName: 'ABC PRIVATE LIMITED',
        subject: 'DSC Token Installation Guidance',
        category: 'dsc',
        priority: 'medium',
        status: 'open',
        messages: [
          {
            sender: 'client',
            senderName: 'Rajesh Sharma',
            text: 'We received the ePass 2003 DSC token. Could your team help us install the driver on Windows 11?',
            date: new Date(Date.now() - 4 * 3600000)
          }
        ]
      });
    }
  } catch (err) {
    console.warn('Error seeding Mongo portal defaults:', err.message);
  }
}

async function ensureMongoConnected() {
  if (mongoose.connection && mongoose.connection.readyState >= 1) {
    isMongoConnected = true;
    return true;
  }
  if (mongoPromise) {
    try {
      await mongoPromise;
      if (mongoose.connection && mongoose.connection.readyState >= 1) {
        isMongoConnected = true;
        return true;
      }
    } catch (e) {}
  }
  return await initMongo();
}

// Attempt initial connection at module load
initMongo().catch(() => {});

// ==========================================
// LOCAL FILE DATABASE (FALLBACK ENGINE)
function seedDefaultAdmin(data) {
  let modified = false;
  if (!Array.isArray(data.users)) data.users = [];

  // Ensure yashd9405@gmail.com is admin
  // const yash = data.users.find(u => u.email && u.email.toLowerCase() === 'yashd9405@gmail.com');
  // if (yash && yash.role !== 'admin') {
  //   yash.role = 'admin';
  //   modified = true;
  // }

  // Ensure admin@corporatemart.in exists as an admin
  const adminExists = data.users.find(u => u.email && u.email.toLowerCase() === 'admin@corporatemart.in');
  if (!adminExists) {
    const { salt, hash } = hashPassword('Admin@123');
    data.users.unshift({
      id: 'usr_admin_corporatemart',
      name: 'CorporateMart Admin',
      email: 'admin@corporatemart.in',
      phone: '+919876543210',
      salt,
      passwordHash: hash,
      role: 'admin',
      plan: 'pro',
      isSubscribed: true,
      subscriptionExpiresAt: '2030-01-01T00:00:00.000Z',
      createdAt: new Date().toISOString()
    });
    modified = true;
  } else if (adminExists.role !== 'admin') {
    adminExists.role = 'admin';
    modified = true;
  }

  if (!Array.isArray(data.portal_cases)) {
    data.portal_cases = [];
    modified = true;
  }
  if (!Array.isArray(data.portal_documents)) {
    data.portal_documents = [];
    modified = true;
  }
  if (!Array.isArray(data.portal_orders)) {
    data.portal_orders = [];
    modified = true;
  }
  if (!Array.isArray(data.portal_tickets)) {
    data.portal_tickets = [];
    modified = true;
  }

  // Ensure initial sample client exists
  const clientExists = data.users.find(u => u.email && u.email.toLowerCase() === 'client@abc.com');
  if (!clientExists) {
    const { salt: cSalt, hash: cHash } = hashPassword('Client@123');
    data.users.push({
      id: 'usr_client_abc',
      name: 'Rajesh Sharma',
      companyName: 'ABC PRIVATE LIMITED',
      email: 'client@abc.com',
      phone: '+919811223344',
      salt: cSalt,
      passwordHash: cHash,
      role: 'client',
      plan: 'free',
      isSubscribed: false,
      subscriptionExpiresAt: null,
      createdAt: new Date().toISOString()
    });
    modified = true;
  }

  // Seed sample cases if empty
  if (data.portal_cases.length === 0) {
    data.portal_cases.push(
      {
        id: 'case_1',
        caseId: 'CAS-1001',
        clientId: 'usr_client_abc',
        clientName: 'Rajesh Sharma',
        companyName: 'ABC PRIVATE LIMITED',
        serviceName: 'Company Registration',
        status: 'approved',
        statusNote: 'Certificate of Incorporation issued with CIN & PAN.',
        documentsCount: 1,
        timeline: [
          { stage: 'Name Approval', status: 'approved', note: 'RUN name approved by ROC.', date: new Date(Date.now() - 15 * 86400000).toISOString() },
          { stage: 'SPICe+ Incorporation', status: 'approved', note: 'MCA approval granted & COI delivered.', date: new Date(Date.now() - 10 * 86400000).toISOString() }
        ],
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 86400000).toISOString()
      },
      {
        id: 'case_2',
        caseId: 'CAS-1002',
        clientId: 'usr_client_abc',
        clientName: 'Rajesh Sharma',
        companyName: 'ABC PRIVATE LIMITED',
        serviceName: 'GST Registration',
        status: 'in_review',
        statusNote: 'Application submitted on GST Portal. Awaiting ARN verification.',
        documentsCount: 0,
        timeline: [
          { stage: 'Document Verification', status: 'approved', note: 'Electricity bill & rent agreement verified.', date: new Date(Date.now() - 5 * 86400000).toISOString() },
          { stage: 'ARN Generation', status: 'in_review', note: 'Submitted on GST common portal.', date: new Date(Date.now() - 2 * 86400000).toISOString() }
        ],
        createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: 'case_3',
        caseId: 'CAS-1003',
        clientId: 'usr_client_abc',
        clientName: 'Rajesh Sharma',
        companyName: 'ABC PRIVATE LIMITED',
        serviceName: 'Trademark Registration',
        status: 'rejected',
        statusNote: 'Objection raised by Trademark Registry under Section 9(1)(b).',
        documentsCount: 0,
        timeline: [
          { stage: 'Application Filing', status: 'approved', note: 'TM-A filed with Registry.', date: new Date(Date.now() - 12 * 86400000).toISOString() },
          { stage: 'Formalities Check', status: 'rejected', note: 'Objection issued; examination report received.', date: new Date(Date.now() - 3 * 86400000).toISOString() }
        ],
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 86400000).toISOString()
      }
    );
    modified = true;
  }

  // Seed sample document if empty
  if (data.portal_documents.length === 0) {
    data.portal_documents.push({
      id: 'doc_1',
      docId: 'DOC-1001',
      caseId: 'CAS-1001',
      clientId: 'usr_client_abc',
      companyName: 'ABC PRIVATE LIMITED',
      title: 'Certificate of Incorporation (COI)',
      fileName: 'coi_abc_private_limited.pdf',
      fileUrl: '/uploads/documents/sample_coi.pdf',
      fileSize: '1.2 MB',
      fileType: 'application/pdf',
      category: 'certificate',
      uploadedBy: 'operations',
      status: 'approved',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
    });
    modified = true;
  }

  // Seed sample order if empty
  if (data.portal_orders.length === 0) {
    data.portal_orders.push({
      id: 'ord_1',
      orderId: 'ORD-2026-101',
      clientId: 'usr_client_abc',
      clientName: 'Rajesh Sharma',
      companyName: 'ABC PRIVATE LIMITED',
      email: 'client@abc.com',
      phone: '+919811223344',
      planName: 'BUSINESS GROWTH PLAN',
      services: ['Company Registration', 'GST Registration', 'Trademark', 'MSME Registration', 'Basic Compliance'],
      notes: 'Need priority trademark search and MSME certificate.',
      status: 'pending_review',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
    });
    modified = true;
  }

  // Seed sample ticket if empty
  if (data.portal_tickets.length === 0) {
    data.portal_tickets.push({
      id: 'tkt_1',
      ticketId: 'CM-10231',
      clientId: 'usr_client_abc',
      clientName: 'Rajesh Sharma',
      companyName: 'ABC PRIVATE LIMITED',
      subject: 'DSC Token Installation Guidance',
      category: 'dsc',
      priority: 'medium',
      status: 'open',
      messages: [
        {
          sender: 'client',
          senderName: 'Rajesh Sharma',
          text: 'We received the ePass 2003 DSC token. Could your team help us install the driver on Windows 11?',
          date: new Date(Date.now() - 4 * 3600000).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 3600000).toISOString()
    });
    modified = true;
  }

  return modified;
}

function initDB() {
  if (IS_SERVERLESS) {
    if (!fs.existsSync(DB_FILE)) {
      const srcFile = path.join(__dirname, 'data', 'database.json');
      if (fs.existsSync(srcFile)) {
        try {
          fs.copyFileSync(srcFile, DB_FILE);
          return;
        } catch (e) {}
      }
      try {
        const initialData = { users: [], transactions: [] };
        seedDefaultAdmin(initialData);
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
      } catch (e) {}
    }
    return;
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      transactions: []
    };
    seedDefaultAdmin(initialData);
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  } else {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (seedDefaultAdmin(data)) {
        writeDB(data);
      }
    } catch (e) {}
  }
}

function readDB() {
  initDB();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (seedDefaultAdmin(parsed)) {
      writeDB(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error reading DB, resetting to safe empty state:', err);
    return { users: [], transactions: [] };
  }
}

function writeDB(data) {
  try {
    const tmpFile = DB_FILE + '.tmp.' + Date.now();
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.warn('Warning: Could not persist local file database:', err.message);
  }
}

// ==========================================
// CRYPTOGRAPHY & TOKEN UTILITIES
// ==========================================
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, storedHash) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(header + '.' + body).digest('base64url');
  return header + '.' + body + '.' + signature;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(header + '.' + body).digest('base64url');
  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Date.now()) return null; // Expired token
    return payload;
  } catch (e) {
    return null;
  }
}

function sanitizeUser(user) {
  if (!user) return null;
  const id = user.id || (user._id ? user._id.toString() : '');
  const expiresAt = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
  const isSubscribed = user.plan === 'pro' && expiresAt && expiresAt.getTime() > Date.now();

  return {
    id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    companyName: user.companyName || '',
    role: user.role || 'user',
    plan: isSubscribed ? 'pro' : 'free',
    isSubscribed: Boolean(isSubscribed),
    subscriptionExpiresAt: expiresAt ? expiresAt.toISOString() : null,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString()
  };
}

// ==========================================
// UNIFIED DATA OPERATIONS (DUAL-MODE)
// ==========================================
async function findUserByEmail(email) {
  const cleanEmail = String(email).trim().toLowerCase();
  await ensureMongoConnected();

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const user = await User.findOne({ email: cleanEmail }).exec();
      if (user) return user.toObject();
    } catch (e) {
      console.warn('Mongo query error, falling back to local DB:', e.message);
    }
  }

  const localDb = readDB();
  return localDb.users.find(u => u.email.toLowerCase() === cleanEmail) || null;
}

async function findUserById(id) {
  if (!id) return null;
  await ensureMongoConnected();

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      let user = null;
      if (mongoose.Types.ObjectId.isValid(id) && !String(id).startsWith('usr_')) {
        user = await User.findById(id).exec();
      }
      if (!user) {
        user = await User.findOne({ $or: [{ _id: id }, { id: id }] }).exec();
      }
      if (user) return user.toObject();
    } catch (e) {
      console.warn('Mongo query error, falling back to local DB:', e.message);
    }
  }

  const localDb = readDB();
  return localDb.users.find(u => u.id === id) || null;
}

async function savePushSubscription(userId, subscription) {
  if (!userId || !subscription || !subscription.endpoint) return false;
  await ensureMongoConnected();

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      let query = { id: userId };
      if (mongoose.Types.ObjectId.isValid(userId) && !String(userId).startsWith('usr_')) {
        query = { _id: userId };
      }
      const user = await User.findOne(query);
      if (user) {
        if (!Array.isArray(user.pushSubscriptions)) user.pushSubscriptions = [];
        const exists = user.pushSubscriptions.some(s => s.endpoint === subscription.endpoint);
        if (!exists) {
          user.pushSubscriptions.push(subscription);
          user.markModified('pushSubscriptions');
          await user.save();
        }
        return true;
      }
    } catch (e) {
      console.warn('Mongo save push subscription error:', e.message);
    }
  }

  const localDb = readDB();
  const user = localDb.users.find(u => u.id === userId || u._id === userId);
  if (user) {
    if (!Array.isArray(user.pushSubscriptions)) user.pushSubscriptions = [];
    const exists = user.pushSubscriptions.some(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions.push(subscription);
      writeDB(localDb);
    }
    return true;
  }
  return false;
}

async function createUser({ name, email, phone = '', password, role = 'user' }) {
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPhone = String(phone || '').trim();
  const userRole = (role === 'admin' || cleanEmail === 'admin@corporatemart.in') ? 'admin' : 'user';
  await ensureMongoConnected();
  const existing = await findUserByEmail(cleanEmail);
  if (existing) {
    throw new Error('User with this email already exists');
  }

  const { salt, hash } = hashPassword(password);

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const userDoc = await User.create({
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        salt,
        passwordHash: hash,
        role: userRole,
        plan: 'free',
        isSubscribed: false,
        subscriptionExpiresAt: null
      });
      return sanitizeUser(userDoc.toObject());
    } catch (e) {
      console.warn('Mongo create error, falling back to local DB:', e.message);
    }
  }

  const localDb = readDB();
  const user = {
    id: 'usr_' + crypto.randomBytes(8).toString('hex'),
    name: name.trim(),
    email: cleanEmail,
    phone: cleanPhone,
    salt,
    passwordHash: hash,
    role: userRole,
    plan: 'free',
    subscriptionExpiresAt: null,
    createdAt: new Date().toISOString()
  };

  localDb.users.push(user);
  writeDB(localDb);

  return sanitizeUser(user);
}

async function updateUserSubscription(userId, { plan, durationDays }) {
  const now = Date.now();
  await ensureMongoConnected();

  if (isMongoConnected) {
    try {
      let userDoc = null;
      if (mongoose.Types.ObjectId.isValid(userId)) {
        userDoc = await User.findById(userId);
      }
      if (!userDoc) {
        userDoc = await User.findOne({ id: userId });
      }

      if (userDoc) {
        let baseTime = now;
        if (userDoc.subscriptionExpiresAt) {
          const currentExpiry = new Date(userDoc.subscriptionExpiresAt).getTime();
          if (currentExpiry > now) {
            baseTime = currentExpiry;
          }
        }

        const newExpiry = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000);
        userDoc.plan = plan;
        userDoc.isSubscribed = true;
        userDoc.subscriptionExpiresAt = newExpiry;
        await userDoc.save();

        return sanitizeUser(userDoc.toObject());
      }
    } catch (e) {
      console.warn('Mongo update subscription error, falling back to local DB:', e.message);
    }
  }

  const localDb = readDB();
  const userIndex = localDb.users.findIndex(u => u.id === userId);
  if (userIndex === -1) throw new Error('User not found');

  let baseTime = now;
  if (localDb.users[userIndex].subscriptionExpiresAt) {
    const currentExpiry = new Date(localDb.users[userIndex].subscriptionExpiresAt).getTime();
    if (currentExpiry > now) {
      baseTime = currentExpiry;
    }
  }

  const newExpiry = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000).toISOString();
  localDb.users[userIndex].plan = plan;
  localDb.users[userIndex].subscriptionExpiresAt = newExpiry;

  writeDB(localDb);
  return sanitizeUser(localDb.users[userIndex]);
}

async function recordTransaction({ userId, orderId, paymentId, amount, planId, status = 'success' }) {
  await ensureMongoConnected();

  if (isMongoConnected) {
    try {
      const txDoc = await Transaction.create({
        userId,
        orderId,
        paymentId,
        amount,
        planId,
        status
      });
      return txDoc.toObject();
    } catch (e) {
      console.warn('Mongo record transaction error, falling back to local DB:', e.message);
    }
  }

  const localDb = readDB();
  const tx = {
    id: 'tx_' + crypto.randomBytes(8).toString('hex'),
    userId,
    orderId,
    paymentId,
    amount,
    planId,
    status,
    createdAt: new Date().toISOString()
  };
  localDb.transactions.push(tx);
  writeDB(localDb);
  return tx;
}

function matchesPhone(storedPhone, inputPhone) {
  if (!storedPhone) return true;
  const cleanStored = String(storedPhone).replace(/\D/g, '');
  const cleanInput = String(inputPhone).replace(/\D/g, '');
  if (!cleanStored || !cleanInput) return true;
  return cleanStored.endsWith(cleanInput.slice(-10)) || cleanInput.endsWith(cleanStored.slice(-10));
}

async function resetUserPassword({ email, phone, newPassword }) {
  const cleanEmail = String(email).trim().toLowerCase();
  const { salt, hash } = hashPassword(newPassword);
  await ensureMongoConnected();

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const userDoc = await User.findOne({ email: cleanEmail });
      if (userDoc) {
        if (userDoc.phone && !matchesPhone(userDoc.phone, phone)) {
          throw new Error('Phone number does not match our records for this account');
        }

        userDoc.salt = salt;
        userDoc.passwordHash = hash;
        await userDoc.save();
        return sanitizeUser(userDoc.toObject());
      }
    } catch (e) {
      if (e.message.includes('Phone number')) {
        throw e;
      }
      console.warn('Mongo reset password error, falling back to local DB:', e.message);
    }
  }

  const localDb = readDB();
  const userIndex = localDb.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
  if (userIndex === -1) {
    throw new Error('No registered account found with this email');
  }

  if (localDb.users[userIndex].phone && !matchesPhone(localDb.users[userIndex].phone, phone)) {
    throw new Error('Phone number does not match our records for this account');
  }

  localDb.users[userIndex].salt = salt;
  localDb.users[userIndex].passwordHash = hash;
  writeDB(localDb);

  return sanitizeUser(localDb.users[userIndex]);
}

async function setUserResetOtp(email, otp, expiresAt) {
  const cleanEmail = String(email).trim().toLowerCase();
  await ensureMongoConnected();

  if (isMongoConnected) {
    try {
      const user = await User.findOne({ email: cleanEmail });
      if (user) {
        user.resetOtp = String(otp);
        user.resetOtpExpires = new Date(expiresAt);
        await user.save();
        return { success: true, name: user.name, email: user.email };
      }
    } catch (e) {
      console.warn('Mongo set reset OTP error, fallback:', e.message);
    }
  }

  const localDb = readDB();
  const user = localDb.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (user) {
    user.resetOtp = String(otp);
    user.resetOtpExpires = new Date(expiresAt).toISOString();
    writeDB(localDb);
    return { success: true, name: user.name, email: user.email };
  }

  throw new Error('No account found with this email address');
}

async function getUserResetOtp(email) {
  const cleanEmail = String(email).trim().toLowerCase();
  await ensureMongoConnected();
  if (isMongoConnected) {
    try {
      const user = await User.findOne({ email: cleanEmail });
      if (user && user.resetOtp) return user.resetOtp;
    } catch (e) {}
  }
  const localDb = readDB();
  const user = localDb.users.find(u => u.email.toLowerCase() === cleanEmail);
  return user ? user.resetOtp : null;
}

async function verifyAndResetPassword(email, otp, newPassword) {
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanOtp = String(otp).trim();
  const now = Date.now();
  await ensureMongoConnected();

  const { salt, hash } = hashPassword(newPassword);

  if (isMongoConnected) {
    try {
      const user = await User.findOne({ email: cleanEmail });
      if (user) {
        if (!user.resetOtp || user.resetOtp !== cleanOtp) {
          throw new Error('Invalid verification code (OTP). Please check and try again.');
        }
        if (!user.resetOtpExpires || new Date(user.resetOtpExpires).getTime() < now) {
          throw new Error('Verification code has expired. Please request a new code.');
        }

        user.salt = salt;
        user.passwordHash = hash;
        user.resetOtp = null;
        user.resetOtpExpires = null;
        await user.save();
        return { success: true, name: user.name, email: user.email };
      }
    } catch (e) {
      if (e.message.includes('Invalid verification') || e.message.includes('expired')) {
        throw e;
      }
      console.warn('Mongo verify & reset error, fallback:', e.message);
    }
  }

  const localDb = readDB();
  const user = localDb.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (!user) throw new Error('No account found with this email address');
  if (!user.resetOtp || user.resetOtp !== cleanOtp) {
    throw new Error('Invalid verification code (OTP). Please check and try again.');
  }
  if (!user.resetOtpExpires || new Date(user.resetOtpExpires).getTime() < now) {
    throw new Error('Verification code has expired. Please request a new code.');
  }

  user.salt = salt;
  user.passwordHash = hash;
  user.resetOtp = null;
  user.resetOtpExpires = null;
  writeDB(localDb);
  return { success: true, name: user.name, email: user.email };
}

async function updateUserProfile(userId, { name, phone, companyName }) {
  await ensureMongoConnected();

  if (isMongoConnected) {
    try {
      let query = { id: userId };
      if (mongoose.Types.ObjectId.isValid(userId) && !String(userId).startsWith('usr_')) {
        query = { _id: userId };
      }
      const user = await User.findOne(query);
      if (user) {
        if (name) user.name = String(name).trim();
        if (phone !== undefined) user.phone = String(phone).trim();
        if (companyName !== undefined) user.companyName = String(companyName).trim();
        await user.save();
        return sanitizeUser(user.toObject());
      }
    } catch (e) {
      console.warn('Mongo update profile error, fallback:', e.message);
    }
  }

  const localDb = readDB();
  const user = localDb.users.find(u => u.id === userId || u._id === userId);
  if (!user) throw new Error('User not found');
  if (name) user.name = String(name).trim();
  if (phone !== undefined) user.phone = String(phone).trim();
  if (companyName !== undefined) user.companyName = String(companyName).trim();
  writeDB(localDb);
  return sanitizeUser(user);
}

async function updateUserPassword(userId, currentPassword, newPassword) {
  await ensureMongoConnected();

  if (isMongoConnected) {
    try {
      let query = { id: userId };
      if (mongoose.Types.ObjectId.isValid(userId) && !String(userId).startsWith('usr_')) {
        query = { _id: userId };
      }
      const user = await User.findOne(query);
      if (!user) throw new Error('User not found');

      const isValid = verifyPassword(currentPassword, user.salt, user.passwordHash);
      if (!isValid) throw new Error('Current password does not match');

      const { salt, hash } = hashPassword(newPassword);
      user.salt = salt;
      user.passwordHash = hash;
      await user.save();
      return { success: true };
    } catch (e) {
      if (e.message.includes('User not found') || e.message.includes('Current password')) throw e;
      console.warn('Mongo update password error, fallback:', e.message);
    }
  }

  const localDb = readDB();
  const user = localDb.users.find(u => u.id === userId || u._id === userId);
  if (!user) throw new Error('User not found');
  const isValid = verifyPassword(currentPassword, user.salt, user.passwordHash);
  if (!isValid) throw new Error('Current password does not match');

  const { salt, hash } = hashPassword(newPassword);
  user.salt = salt;
  user.passwordHash = hash;
  writeDB(localDb);
  return { success: true };
}

function isConnectedToMongo() {
  return Boolean(isMongoConnected && mongoose.connection && mongoose.connection.readyState === 1);
}

// ==========================================
// UNIQUE VISITOR TRACKING ENGINE
// ==========================================

function readVisitorsDB() {
  if (!fs.existsSync(VISITORS_FILE)) {
    const initialData = {
      count: INITIAL_VISITOR_COUNT,
      uniqueKeys: {}
    };
    try {
      fs.writeFileSync(VISITORS_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    } catch (e) {}
    return initialData;
  }
  try {
    const raw = fs.readFileSync(VISITORS_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (typeof data.count !== 'number') data.count = INITIAL_VISITOR_COUNT;
    if (!data.uniqueKeys || typeof data.uniqueKeys !== 'object') data.uniqueKeys = {};
    return data;
  } catch (e) {
    return { count: INITIAL_VISITOR_COUNT, uniqueKeys: {} };
  }
}

function writeVisitorsDB(data) {
  try {
    fs.writeFileSync(VISITORS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing visitors database:', e.message);
  }
}

async function recordVisitorHit(visitorId, clientIp, userAgent) {
  const cleanVisitorId = (visitorId || '').trim();
  const cleanIp = (clientIp || '').trim();
  const cleanUa = (userAgent || '').trim();

  // Create deterministic hash for IP+UA to handle visitors without client-side storage
  const ipHash = crypto.createHash('sha256').update(cleanIp + '_' + cleanUa).digest('hex').slice(0, 32);
  const primaryKey = cleanVisitorId || ipHash;

  if (isConnectedToMongo()) {
    try {
      // Initialize stats document if missing
      let stats = await VisitorStats.findOne({ key: 'global_visitor_stats' });
      if (!stats) {
        stats = await VisitorStats.create({
          key: 'global_visitor_stats',
          uniqueCount: INITIAL_VISITOR_COUNT,
          lastUpdated: new Date()
        });
      }

      // Check if visitor is already recorded
      let record = await VisitorRecord.findOne({ visitorKey: primaryKey });
      if (record) {
        record.lastSeen = new Date();
        await record.save();
        return {
          count: stats.uniqueCount,
          isNew: false
        };
      }

      // New unique visitor!
      await VisitorRecord.create({
        visitorKey: primaryKey,
        ipHash,
        userAgent: cleanUa.slice(0, 200),
        firstSeen: new Date(),
        lastSeen: new Date()
      });

      stats.uniqueCount += 1;
      stats.lastUpdated = new Date();
      await stats.save();

      // Mirror to local file
      const local = readVisitorsDB();
      local.count = stats.uniqueCount;
      local.uniqueKeys[primaryKey] = { firstSeen: new Date().toISOString(), ipHash };
      writeVisitorsDB(local);

      return {
        count: stats.uniqueCount,
        isNew: true
      };
    } catch (err) {
      console.warn('Mongo visitor tracking error, falling back to local file:', err.message);
    }
  }

  // Local file storage engine
  const local = readVisitorsDB();
  if (local.uniqueKeys && local.uniqueKeys[primaryKey]) {
    return {
      count: local.count,
      isNew: false
    };
  }

  // Record new unique visitor
  local.uniqueKeys[primaryKey] = {
    firstSeen: new Date().toISOString(),
    ipHash
  };
  local.count = (local.count || 0) + 1;
  writeVisitorsDB(local);

  return {
    count: local.count,
    isNew: true
  };
}

async function getVisitorCount() {
  if (isConnectedToMongo()) {
    try {
      const stats = await VisitorStats.findOne({ key: 'global_visitor_stats' });
      if (stats) return stats.uniqueCount;
    } catch (e) {}
  }
  const local = readVisitorsDB();
  return typeof local.count === 'number' ? local.count : INITIAL_VISITOR_COUNT;
}

// ==========================================
// PORTAL & OPERATIONS ENGINE (DUAL-MODE)
// ==========================================

async function getPortalStats() {
  await ensureMongoConnected();
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const [totalClients, totalCases, activeCases, completedCases, openTickets, totalDocs] = await Promise.all([
        User.countDocuments({ role: 'client' }),
        PortalCase.countDocuments(),
        PortalCase.countDocuments({ status: { $in: ['in_review', 'pending_documents'] } }),
        PortalCase.countDocuments({ status: 'approved' }),
        PortalTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
        PortalDocument.countDocuments()
      ]);
      return { totalClients, totalCases, activeCases, completedCases, openTickets, totalDocs };
    } catch (e) {
      console.warn('Mongo portal stats error, falling back to local:', e.message);
    }
  }

  const local = readDB();
  const clients = (local.users || []).filter(u => u.role === 'client');
  const cases = local.portal_cases || [];
  const activeCases = cases.filter(c => c.status === 'in_review' || c.status === 'pending_documents');
  const completedCases = cases.filter(c => c.status === 'approved');
  const openTickets = (local.portal_tickets || []).filter(t => t.status === 'open' || t.status === 'in_progress');
  const totalDocs = (local.portal_documents || []).length;

  return {
    totalClients: clients.length,
    totalCases: cases.length,
    activeCases: activeCases.length,
    completedCases: completedCases.length,
    openTickets: openTickets.length,
    totalDocs
  };
}

async function getPortalClients() {
  await ensureMongoConnected();
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const clients = await User.find({ role: 'client' }).sort({ createdAt: -1 }).lean();
      return clients.map(c => ({
        id: c._id ? c._id.toString() : c.id,
        name: c.name,
        companyName: c.companyName || c.name,
        email: c.email,
        phone: c.phone || '',
        role: c.role,
        status: c.status || 'active',
        createdAt: c.createdAt
      }));
    } catch (e) {
      console.warn('Mongo clients error, falling back:', e.message);
    }
  }

  const local = readDB();
  return (local.users || [])
    .filter(u => u.role === 'client')
    .map(c => ({
      id: c.id,
      name: c.name,
      companyName: c.companyName || c.name,
      email: c.email,
      phone: c.phone || '',
      role: c.role,
      status: c.status || 'active',
      createdAt: c.createdAt
    }));
}

async function updatePortalClient(clientId, updateData = {}) {
  await ensureMongoConnected();
  const allowed = {};
  if (updateData.name !== undefined) allowed.name = String(updateData.name).trim();
  if (updateData.companyName !== undefined) allowed.companyName = String(updateData.companyName).trim();
  if (updateData.email !== undefined) allowed.email = String(updateData.email).trim().toLowerCase();
  if (updateData.phone !== undefined) allowed.phone = String(updateData.phone).trim();
  if (updateData.status !== undefined) allowed.status = String(updateData.status).trim();

  let updated = null;
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(clientId);
      const q = isObjectId ? { $or: [{ _id: clientId }, { id: clientId }] } : { id: clientId };
      updated = await User.findOneAndUpdate(q, { $set: allowed }, { new: true }).lean();
    } catch (e) {
      console.warn('Mongo update client error, falling back:', e.message);
    }
  }

  const local = readDB();
  const localIdx = (local.users || []).findIndex(u => u.id === clientId || (u._id && u._id.toString() === clientId));
  if (localIdx !== -1) {
    Object.assign(local.users[localIdx], allowed);
    writeDB(local);
    if (!updated) updated = local.users[localIdx];
  }

  if (!updated) {
    throw new Error('Client not found');
  }

  return {
    id: updated._id ? updated._id.toString() : updated.id,
    name: updated.name,
    companyName: updated.companyName || updated.name,
    email: updated.email,
    phone: updated.phone || '',
    role: updated.role,
    status: updated.status || 'active',
    createdAt: updated.createdAt
  };
}

async function deletePortalClient(clientId) {
  await ensureMongoConnected();
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(clientId);
      const q = isObjectId ? { $or: [{ _id: clientId }, { id: clientId }] } : { id: clientId };
      await User.deleteOne(q);
      await PortalCase.deleteMany({ clientId });
      await PortalDocument.deleteMany({ clientId });
      await PortalTicket.deleteMany({ clientId });
    } catch (e) {
      console.warn('Mongo delete client error, falling back:', e.message);
    }
  }

  const local = readDB();
  local.users = (local.users || []).filter(u => u.id !== clientId && (!u._id || u._id.toString() !== clientId));
  local.portal_cases = (local.portal_cases || []).filter(c => c.clientId !== clientId);
  local.portal_documents = (local.portal_documents || []).filter(d => d.clientId !== clientId);
  local.portal_tickets = (local.portal_tickets || []).filter(t => t.clientId !== clientId);
  writeDB(local);
  return { success: true, clientId };
}

async function createPortalClient({ name, companyName, email, phone, password }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const existing = await findUserByEmail(cleanEmail);
  if (existing) {
    throw new Error('A user or client with this email already exists.');
  }

  const { salt, hash } = hashPassword(password || 'Client@123');
  const clientId = 'usr_client_' + Date.now();
  const clientData = {
    id: clientId,
    name: String(name || '').trim(),
    companyName: String(companyName || name || '').trim(),
    email: cleanEmail,
    phone: String(phone || '').trim(),
    salt,
    passwordHash: hash,
    role: 'client',
    plan: 'free',
    status: 'active',
    isSubscribed: false,
    subscriptionExpiresAt: null,
    createdAt: new Date().toISOString()
  };

  await ensureMongoConnected();
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const created = await User.create(clientData);
      return {
        id: created._id ? created._id.toString() : clientId,
        name: created.name,
        companyName: created.companyName,
        email: created.email,
        phone: created.phone,
        role: created.role,
        status: created.status || 'active',
        createdAt: created.createdAt
      };
    } catch (e) {
      console.warn('Mongo create client error, falling back:', e.message);
    }
  }

  const local = readDB();
  local.users.push(clientData);
  writeDB(local);
  return {
    id: clientData.id,
    name: clientData.name,
    companyName: clientData.companyName,
    email: clientData.email,
    phone: clientData.phone,
    role: clientData.role,
    status: clientData.status || 'active',
    createdAt: clientData.createdAt
  };
}

async function getPortalCases(filter = {}) {
  await ensureMongoConnected();
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const q = {};
      if (filter.clientId) q.clientId = filter.clientId;
      if (filter.status) q.status = filter.status;
      return await PortalCase.find(q).sort({ updatedAt: -1 }).lean();
    } catch (e) {
      console.warn('Mongo cases error, falling back:', e.message);
    }
  }

  const local = readDB();
  let cases = local.portal_cases || [];
  if (filter.clientId) cases = cases.filter(c => c.clientId === filter.clientId);
  if (filter.status) cases = cases.filter(c => c.status === filter.status);
  return cases.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
}

async function createPortalCase(data) {
  const caseId = 'CAS-' + Math.floor(1000 + Math.random() * 9000);
  const now = new Date().toISOString();
  const caseObj = {
    id: 'case_' + Date.now(),
    caseId,
    clientId: String(data.clientId || '').trim(),
    clientName: String(data.clientName || '').trim(),
    companyName: String(data.companyName || '').trim(),
    serviceName: String(data.serviceName || '').trim(),
    status: data.status || 'in_review',
    statusNote: data.statusNote || 'Case created by operations team.',
    documentsCount: 0,
    timeline: [
      {
        stage: 'Case Initialized',
        status: data.status || 'in_review',
        note: data.statusNote || 'Case opened by Operations.',
        date: now
      }
    ],
    createdAt: now,
    updatedAt: now
  };

  await ensureMongoConnected();
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const created = await PortalCase.create(caseObj);
      return created.toObject();
    } catch (e) {
      console.warn('Mongo create case error, falling back:', e.message);
    }
  }

  const local = readDB();
  local.portal_cases = local.portal_cases || [];
  local.portal_cases.unshift(caseObj);
  writeDB(local);
  return caseObj;
}

async function updatePortalCaseStatus(caseId, status, note = '') {
  const now = new Date().toISOString();
  await ensureMongoConnected();
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(caseId);
      const q = isObjectId ? { $or: [{ caseId }, { _id: caseId }] } : { caseId };
      const item = await PortalCase.findOne(q);
      if (item) {
        item.status = status;
        if (note) item.statusNote = note;
        item.timeline.push({
          stage: 'Status Update',
          status,
          note: note || `Status changed to ${status}`,
          date: now
        });
        item.updatedAt = now;
        await item.save();
        return item.toObject();
      }
    } catch (e) {
      console.warn('Mongo update case error, falling back:', e.message);
    }
  }

  const local = readDB();
  const item = (local.portal_cases || []).find(c => c.caseId === caseId || c.id === caseId);
  if (!item) throw new Error('Case not found');
  item.status = status;
  if (note) item.statusNote = note;
  item.timeline = item.timeline || [];
  item.timeline.push({
    stage: 'Status Update',
    status,
    note: note || `Status changed to ${status}`,
    date: now
  });
  item.updatedAt = now;
  writeDB(local);
  return item;
}

async function getPortalDocuments(filter = {}) {
  await ensureMongoConnected();
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const q = {};
      if (filter.clientId) q.clientId = filter.clientId;
      if (filter.caseId) q.caseId = filter.caseId;
      return await PortalDocument.find(q).sort({ createdAt: -1 }).lean();
    } catch (e) {
      console.warn('Mongo docs error, falling back:', e.message);
    }
  }

  const local = readDB();
  let docs = local.portal_documents || [];
  if (filter.clientId) docs = docs.filter(d => d.clientId === filter.clientId);
  if (filter.caseId) docs = docs.filter(d => d.caseId === filter.caseId);
  return docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function createPortalDocument(data) {
  const docId = 'DOC-' + Math.floor(1000 + Math.random() * 9000);
  const now = new Date().toISOString();
  const docObj = {
    id: 'doc_' + Date.now(),
    docId,
    caseId: data.caseId || '',
    clientId: data.clientId || '',
    companyName: data.companyName || '',
    title: String(data.title || 'Official Document').trim(),
    fileName: data.fileName || 'document.pdf',
    fileUrl: data.fileUrl || '/uploads/documents/sample_coi.pdf',
    fileSize: data.fileSize || '1.0 MB',
    fileType: data.fileType || 'application/pdf',
    category: data.category || 'certificate',
    uploadedBy: data.uploadedBy || 'operations',
    status: data.status || 'approved',
    createdAt: now
  };

  await ensureMongoConnected();
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const created = await PortalDocument.create(docObj);
      if (data.caseId) {
        const isObjectId = mongoose.Types.ObjectId.isValid(data.caseId);
        const q = isObjectId ? { $or: [{ caseId: data.caseId }, { _id: data.caseId }] } : { caseId: data.caseId };
        const updateFields = { $inc: { documentsCount: 1 } };
        if (data.autoApprove !== false) {
          updateFields.$set = {
            status: 'approved',
            statusNote: `Approved: ${docObj.title} has been uploaded and is ready for download.`,
            updatedAt: now
          };
        }
        await PortalCase.updateOne(q, updateFields);
      }
      return created.toObject();
    } catch (e) {
      console.warn('Mongo create doc error, falling back:', e.message);
    }
  }

  const local = readDB();
  local.portal_documents = local.portal_documents || [];
  local.portal_documents.unshift(docObj);
  if (data.caseId) {
    const c = (local.portal_cases || []).find(item => item.caseId === data.caseId || item.id === data.caseId);
    if (c) {
      c.documentsCount = (c.documentsCount || 0) + 1;
      if (data.autoApprove !== false) {
        c.status = 'approved';
        c.statusNote = `Approved: ${docObj.title} has been uploaded and is ready for download.`;
        c.updatedAt = now;
      }
    }
  }
  writeDB(local);
  return docObj;
}

async function revokePortalDocument(docIdentifier, reason = 'Revoked by Operations') {
  await ensureMongoConnected();
  let updated = null;
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(docIdentifier);
      const q = isObjectId ? { $or: [{ _id: docIdentifier }, { docId: docIdentifier }, { id: docIdentifier }] } : { $or: [{ docId: docIdentifier }, { id: docIdentifier }] };
      updated = await PortalDocument.findOneAndUpdate(q, { $set: { status: 'revoked' } }, { new: true }).lean();
    } catch (e) {
      console.warn('Mongo revoke document error, falling back:', e.message);
    }
  }

  const local = readDB();
  local.portal_documents = local.portal_documents || [];
  const doc = local.portal_documents.find(d => d.id === docIdentifier || d.docId === docIdentifier || (d._id && d._id.toString() === docIdentifier));
  if (doc) {
    doc.status = 'revoked';
    doc.revokedReason = reason;
    writeDB(local);
    if (!updated) updated = doc;
  }

  if (!updated) {
    throw new Error('Document not found');
  }

  return updated;
}

async function deletePortalDocument(docIdentifier) {
  await ensureMongoConnected();
  let deletedDoc = null;
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(docIdentifier);
      const q = isObjectId ? { $or: [{ _id: docIdentifier }, { docId: docIdentifier }, { id: docIdentifier }] } : { $or: [{ docId: docIdentifier }, { id: docIdentifier }] };
      deletedDoc = await PortalDocument.findOneAndDelete(q).lean();
    } catch (e) {
      console.warn('Mongo delete document error, falling back:', e.message);
    }
  }

  const local = readDB();
  local.portal_documents = local.portal_documents || [];
  const idx = local.portal_documents.findIndex(d => d.id === docIdentifier || d.docId === docIdentifier || (d._id && d._id.toString() === docIdentifier));
  if (idx !== -1) {
    if (!deletedDoc) deletedDoc = local.portal_documents[idx];
    local.portal_documents.splice(idx, 1);
    writeDB(local);
  }

  // If there's a physical file in uploads, attempt to delete
  if (deletedDoc && deletedDoc.fileUrl) {
    try {
      const filePath = path.join(__dirname, '..', deletedDoc.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn('Failed to delete physical file:', err.message);
    }
  }

  return { success: true, docId: docIdentifier };
}

async function getPortalOrders(filter = {}) {
  await ensureMongoConnected();
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const q = {};
      if (filter.status) q.status = filter.status;
      return await PortalOrder.find(q).sort({ createdAt: -1 }).lean();
    } catch (e) {
      console.warn('Mongo orders error, falling back:', e.message);
    }
  }

  const local = readDB();
  let orders = local.portal_orders || [];
  if (filter.status) orders = orders.filter(o => o.status === filter.status);
  return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function createPortalOrder(data) {
  const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
  const now = new Date().toISOString();
  const orderObj = {
    id: 'ord_' + Date.now(),
    orderId,
    clientId: data.clientId || '',
    clientName: data.clientName || '',
    companyName: data.companyName || '',
    email: data.email || '',
    phone: data.phone || '',
    planName: data.planName || 'Custom Plan',
    services: Array.isArray(data.services) ? data.services : [],
    notes: data.notes || '',
    status: 'pending_review',
    createdAt: now
  };

  await ensureMongoConnected();
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const created = await PortalOrder.create(orderObj);
      return created.toObject();
    } catch (e) {
      console.warn('Mongo create order error, falling back:', e.message);
    }
  }

  const local = readDB();
  local.portal_orders = local.portal_orders || [];
  local.portal_orders.unshift(orderObj);
  writeDB(local);
  return orderObj;
}

async function activatePortalOrder(orderId) {
  await ensureMongoConnected();

  let order = null;
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(orderId);
      const q = isObjectId ? { $or: [{ orderId }, { _id: orderId }] } : { orderId };
      order = await PortalOrder.findOne(q);
      if (order) {
        order.status = 'activated';
        await order.save();
        for (const s of (order.services || [])) {
          await createPortalCase({
            clientId: order.clientId,
            clientName: order.clientName,
            companyName: order.companyName,
            serviceName: s,
            status: 'in_review',
            statusNote: `Activated from Order ${order.orderId} (${order.planName})`
          });
        }
        return order.toObject();
      }
    } catch (e) {
      console.warn('Mongo activate order error, falling back:', e.message);
    }
  }

  const local = readDB();
  order = (local.portal_orders || []).find(o => o.orderId === orderId || o.id === orderId);
  if (!order) throw new Error('Order not found');
  order.status = 'activated';

  for (const s of (order.services || [])) {
    await createPortalCase({
      clientId: order.clientId,
      clientName: order.clientName,
      companyName: order.companyName,
      serviceName: s,
      status: 'in_review',
      statusNote: `Activated from Order ${order.orderId} (${order.planName})`
    });
  }
  writeDB(local);
  return order;
}

async function getPortalTickets(filter = {}) {
  await ensureMongoConnected();
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const q = {};
      if (filter.status) q.status = filter.status;
      if (filter.clientId) q.clientId = filter.clientId;
      return await PortalTicket.find(q).sort({ updatedAt: -1 }).lean();
    } catch (e) {
      console.warn('Mongo tickets error, falling back:', e.message);
    }
  }

  const local = readDB();
  let tickets = local.portal_tickets || [];
  if (filter.status) tickets = tickets.filter(t => t.status === filter.status);
  if (filter.clientId) tickets = tickets.filter(t => t.clientId === filter.clientId);
  return tickets.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
}

async function replyPortalTicket(ticketId, messageText, newStatus = null, senderName = 'Operations Staff') {
  const now = new Date().toISOString();
  await ensureMongoConnected();
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(ticketId);
      const q = isObjectId ? { $or: [{ ticketId }, { _id: ticketId }] } : { ticketId };
      const ticket = await PortalTicket.findOne(q);
      if (ticket) {
        if (newStatus) ticket.status = newStatus;
        ticket.messages.push({
          sender: 'operations',
          senderName,
          text: messageText,
          date: now
        });
        ticket.updatedAt = now;
        await ticket.save();
        return ticket.toObject();
      }
    } catch (e) {
      console.warn('Mongo reply ticket error, falling back:', e.message);
    }
  }

  const local = readDB();
  const ticket = (local.portal_tickets || []).find(t => t.ticketId === ticketId || t.id === ticketId);
  if (!ticket) throw new Error('Ticket not found');
  if (newStatus) ticket.status = newStatus;
  ticket.messages = ticket.messages || [];
  ticket.messages.push({
    sender: 'operations',
    senderName,
    text: messageText,
    date: now
  });
  ticket.updatedAt = now;
  writeDB(local);
  return ticket;
}

async function getClientPortalData(userId, userEmail = '', companyName = '') {
  await ensureMongoConnected();
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const matchCriteria = [];
      if (userId) matchCriteria.push({ clientId: String(userId) });
      if (companyName) matchCriteria.push({ companyName });

      const caseQuery = matchCriteria.length > 0 ? { $or: matchCriteria } : {};
      const docQuery = matchCriteria.length > 0 ? { $or: matchCriteria } : {};
      const tktQuery = matchCriteria.length > 0 ? { $or: matchCriteria } : {};

      const [cases, documents, tickets] = await Promise.all([
        PortalCase.find(caseQuery).sort({ updatedAt: -1 }).lean(),
        PortalDocument.find(docQuery).sort({ createdAt: -1 }).lean(),
        PortalTicket.find(tktQuery).sort({ updatedAt: -1 }).lean()
      ]);

      const activeServices = cases.filter(c => c.status === 'in_review' || c.status === 'pending_documents').length;
      const completedServices = cases.filter(c => c.status === 'approved').length;
      const openTickets = tickets.filter(t => t.status !== 'resolved').length;

      return {
        stats: {
          totalServices: cases.length,
          activeServices,
          completedServices,
          totalDocuments: documents.length,
          openTickets
        },
        cases,
        documents,
        tickets
      };
    } catch (e) {
      console.warn('Mongo client portal data error, falling back:', e.message);
    }
  }

  const local = readDB();
  const cases = (local.portal_cases || []).filter(c => c.clientId === String(userId) || (companyName && c.companyName === companyName));
  const documents = (local.portal_documents || []).filter(d => d.clientId === String(userId) || (companyName && d.companyName === companyName));
  const tickets = (local.portal_tickets || []).filter(t => t.clientId === String(userId) || (companyName && t.companyName === companyName));

  const activeServices = cases.filter(c => c.status === 'in_review' || c.status === 'pending_documents').length;
  const completedServices = cases.filter(c => c.status === 'approved').length;
  const openTickets = tickets.filter(t => t.status !== 'resolved').length;

  return {
    stats: {
      totalServices: cases.length,
      activeServices,
      completedServices,
      totalDocuments: documents.length,
      openTickets
    },
    cases: cases.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)),
    documents: documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    tickets: tickets.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
  };
}

async function createClientTicket(data) {
  const ticketId = 'CM-' + Math.floor(1000 + Math.random() * 9000);
  const now = new Date().toISOString();
  const ticketObj = {
    id: 'tkt_' + Date.now(),
    ticketId,
    clientId: String(data.clientId || ''),
    clientName: data.clientName || 'Client',
    companyName: data.companyName || '',
    subject: data.subject || 'Inquiry',
    category: data.category || 'general',
    priority: data.priority || 'medium',
    status: 'open',
    messages: [
      {
        sender: 'client',
        senderName: data.clientName || 'Client',
        text: data.message,
        date: now
      }
    ],
    createdAt: now,
    updatedAt: now
  };

  await ensureMongoConnected();
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const created = await PortalTicket.create(ticketObj);
      return created.toObject();
    } catch (e) {
      console.warn('Mongo create ticket error, falling back:', e.message);
    }
  }

  const local = readDB();
  local.portal_tickets = local.portal_tickets || [];
  local.portal_tickets.unshift(ticketObj);
  writeDB(local);
  return ticketObj;
}

async function replyClientTicket(ticketId, clientId, messageText, clientName = 'Client') {
  const now = new Date().toISOString();
  await ensureMongoConnected();
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(ticketId);
      const q = isObjectId ? { $or: [{ ticketId }, { _id: ticketId }] } : { ticketId };
      const ticket = await PortalTicket.findOne(q);
      if (ticket) {
        ticket.status = 'open';
        ticket.messages.push({
          sender: 'client',
          senderName: clientName,
          text: messageText,
          date: now
        });
        ticket.updatedAt = now;
        await ticket.save();
        return ticket.toObject();
      }
    } catch (e) {
      console.warn('Mongo reply client ticket error, falling back:', e.message);
    }
  }

  const local = readDB();
  const ticket = (local.portal_tickets || []).find(t => t.ticketId === ticketId || t.id === ticketId);
  if (!ticket) throw new Error('Ticket not found');
  ticket.status = 'open';
  ticket.messages = ticket.messages || [];
  ticket.messages.push({
    sender: 'client',
    senderName: clientName,
    text: messageText,
    date: now
  });
  ticket.updatedAt = now;
  writeDB(local);
  return ticket;
}

module.exports = {
  initDB,
  initMongo,
  isConnectedToMongo,
  findUserByEmail,
  findUserById,
  createUser,
  resetUserPassword,
  verifyPassword,
  updateUserSubscription,
  recordTransaction,
  createToken,
  verifyToken,
  sanitizeUser,
  recordVisitorHit,
  getVisitorCount,
  // Operations Portal Exports
  getPortalStats,
  getPortalClients,
  createPortalClient,
  updatePortalClient,
  deletePortalClient,
  getPortalCases,
  createPortalCase,
  updatePortalCaseStatus,
  getPortalDocuments,
  createPortalDocument,
  revokePortalDocument,
  deletePortalDocument,
  getPortalOrders,
  createPortalOrder,
  activatePortalOrder,
  getPortalTickets,
  replyPortalTicket,
  // Client Portal Exports
  getClientPortalData,
  createClientTicket,
  replyClientTicket,
  savePushSubscription,
  // Auth & Profile Exports
  setUserResetOtp,
  getUserResetOtp,
  verifyAndResetPassword,
  updateUserProfile,
  updateUserPassword,
  ensureMongoConnected
};
