const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const crypto = require('crypto');
const mongoose = require('mongoose');

const User = require('./models/User');
const Transaction = require('./models/Transaction');

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DB_FILE = IS_SERVERLESS
  ? path.join('/tmp', 'database.json')
  : path.join(__dirname, 'data', 'database.json');
const JWT_SECRET = process.env.JWT_SECRET || 'corporate_mart_secret_key_2026_x89a!secure';

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
        serverSelectionTimeoutMS: 2500,
        bufferCommands: false
      });
    }
    await mongoPromise;
    isMongoConnected = true;
    console.log('✔ [DB] Successfully connected to MongoDB Atlas!');
    return true;
  } catch (err) {
    mongoPromise = null;
    isMongoConnected = false;
    console.warn('⚠️ [DB] MongoDB Atlas connection failed (' + err.message + '). Falling back to Local File Database.');
    return false;
  }
}

async function ensureMongoConnected() {
  if (mongoose.connection && mongoose.connection.readyState >= 1) {
    isMongoConnected = true;
    return true;
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
  const yash = data.users.find(u => u.email && u.email.toLowerCase() === 'yashd9405@gmail.com');
  if (yash && yash.role !== 'admin') {
    yash.role = 'admin';
    modified = true;
  }

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
      return user ? user.toObject() : null;
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
      return user ? user.toObject() : null;
    } catch (e) {
      console.warn('Mongo query error, falling back to local DB:', e.message);
    }
  }

  const localDb = readDB();
  return localDb.users.find(u => u.id === id) || null;
}

async function createUser({ name, email, phone = '', password, role = 'user' }) {
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPhone = String(phone || '').trim();
  const userRole = (role === 'admin' || cleanEmail === 'admin@corporatemart.in' || cleanEmail === 'yashd9405@gmail.com') ? 'admin' : 'user';
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

  if (isMongoConnected) {
    try {
      const userDoc = await User.findOne({ email: cleanEmail });
      if (!userDoc) {
        throw new Error('No registered account found with this email');
      }

      if (userDoc.phone && !matchesPhone(userDoc.phone, phone)) {
        throw new Error('Phone number does not match our records for this account');
      }

      userDoc.salt = salt;
      userDoc.passwordHash = hash;
      await userDoc.save();
      return sanitizeUser(userDoc.toObject());
    } catch (e) {
      if (e.message.includes('No registered account') || e.message.includes('Phone number')) {
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

function isConnectedToMongo() {
  return Boolean(isMongoConnected || (mongoose.connection && mongoose.connection.readyState >= 1));
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
  sanitizeUser
};
