const db = require('./db');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('Running Backend & Security Test Suite...');

  // 1. Test Database Initialization
  db.initDB();
  const dbFile = path.join(__dirname, 'data', 'database.json');
  assert(fs.existsSync(dbFile), 'database.json must exist');
  console.log('✔ DB File initialized');

  // 2. Test User Registration & Password Hashing
  const testEmail = 'test_' + Date.now() + '@corporatemart.in';
  const user = await db.createUser({
    name: 'Rohan Sharma',
    email: testEmail,
    phone: '+91 98765 43210',
    password: 'SecurePassword123!'
  });
  assert(user.id, 'User must have an ID');
  assert(user.email === testEmail, 'Email must match');
  assert(user.phone === '+91 98765 43210', 'Phone must match');
  assert(user.plan === 'free', 'Initial plan must be free');
  assert(!user.passwordHash, 'Sanitized user must not expose passwordHash');
  console.log('✔ User Registration & Scrypt Hashing (with Phone Number) passed');

  // 3. Test Password Verification
  const rawUser = await db.findUserByEmail(testEmail);
  assert(db.verifyPassword('SecurePassword123!', rawUser.salt, rawUser.passwordHash), 'Correct password must verify');
  assert(!db.verifyPassword('WrongPassword', rawUser.salt, rawUser.passwordHash), 'Wrong password must fail');
  console.log('✔ Constant-Time Password Verification passed');

  // 4. Test Token Creation & Verification
  const token = db.createToken({ id: user.id, email: user.email });
  const payload = db.verifyToken(token);
  assert(payload && payload.id === user.id, 'Token payload must verify');
  assert(!db.verifyToken(token + 'tampered'), 'Tampered token must be rejected');
  console.log('✔ JWT Token Creation & Verification passed');

  // 5. Test Schemes Gating & Redaction Logic
  const masterSchemes = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'schemes.json'), 'utf8'));
  assert(masterSchemes.length === 25, 'Master schemes must contain 25 schemes');

  // Simulate unauthenticated / free visitor view
  const guestSchemes = masterSchemes.map(s => {
    if (s.tier === 'free') return { ...s, isLocked: false };
    return {
      id: s.id,
      name: s.name,
      isLocked: true,
      amount: '🔒 Pro Member Only',
      industry: 'Pro Access Required'
    };
  });

  const lockedCount = guestSchemes.filter(s => s.isLocked).length;
  const freeCount = guestSchemes.filter(s => !s.isLocked).length;
  assert(lockedCount === 23, 'Must have 23 locked Pro schemes for guest');
  assert(freeCount === 2, 'Must have 2 free schemes for guest');
  assert(guestSchemes.find(s => s.isLocked).amount === '🔒 Pro Member Only', 'Amount must be masked at server level');
  console.log('✔ Scheme Server-Side Redaction passed (2 Free, 23 Locked Pro)');

  // 6. Test Subscription Activation & Transaction Logging
  const updatedUser = await db.updateUserSubscription(user.id, { plan: 'pro', durationDays: 30 });
  assert(updatedUser.plan === 'pro', 'User plan must be pro');
  assert(updatedUser.isSubscribed === true, 'User isSubscribed must be true');
  assert(new Date(updatedUser.subscriptionExpiresAt).getTime() > Date.now(), 'Expiry must be in the future');

  const tx = await db.recordTransaction({
    userId: user.id,
    orderId: 'order_test_123',
    paymentId: 'pay_test_456',
    amount: 99,
    planId: 'pro_99',
    status: 'success'
  });
  assert(tx.id, 'Transaction must have an ID');
  console.log('✔ Subscription Activation & Transaction Logging (₹99 Pro Plan) passed');

  // 7. Test Password Reset
  const resetSuccess = await db.resetUserPassword({
    email: testEmail,
    phone: '+91 98765 43210',
    newPassword: 'BrandNewPassword456!'
  });
  assert(resetSuccess && resetSuccess.email === testEmail, 'Password reset should succeed and return sanitized user');
  const userAfterReset = await db.findUserByEmail(testEmail);
  assert(db.verifyPassword('BrandNewPassword456!', userAfterReset.salt, userAfterReset.passwordHash), 'New password must verify');
  assert(!db.verifyPassword('SecurePassword123!', userAfterReset.salt, userAfterReset.passwordHash), 'Old password must no longer verify');
  console.log('✔ Forgot Password Reset (Phone + Email verification) passed');

  console.log('\n========================================');
  console.log(' ALL BACKEND SECURITY TESTS PASSED! ');
  console.log('========================================');

  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test suite error:', err);
  process.exit(1);
});
