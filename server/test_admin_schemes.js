const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runAdminTests() {
  console.log('--- Starting Admin Scheme CRUD & Role Security Tests ---');
  
  const app = require('./server');
  const db = require('./db');
  
  // Start server on a test port
  const testPort = 3099;
  const server = await new Promise((resolve) => {
    const s = app.listen(testPort, '127.0.0.1', () => resolve(s));
  });

  const baseUrl = `http://127.0.0.1:${testPort}`;

  try {
    // 1. Test Admin Login
    console.log('1. Testing Admin Login...');
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@corporatemart.in', password: 'Admin@123' })
    });
    const adminLoginData = await adminLoginRes.json();
    assert.strictEqual(adminLoginRes.status, 200, 'Admin login must succeed');
    assert.strictEqual(adminLoginData.user.role, 'admin', 'Admin user must have role admin');
    const adminToken = adminLoginData.token;
    console.log('✔ Admin login succeeded with role: admin');

    // 2. Test Non-Admin Login
    console.log('2. Testing Non-Admin Authorization Gate...');
    const regEmail = `regular_${Date.now()}@example.com`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Regular User', email: regEmail, phone: '9999999999', password: 'User@12345' })
    });
    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 201, 'User registration must succeed');
    assert.strictEqual(regData.user.role, 'user', 'Regular user must have role user');
    const userToken = regData.token;

    // Verify non-admin is blocked from admin routes (403 Forbidden)
    const unauthorizedPost = await fetch(`${baseUrl}/api/admin/schemes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ name: 'Hacker Scheme' })
    });
    assert.strictEqual(unauthorizedPost.status, 403, 'Regular user must receive 403 Forbidden on POST /api/admin/schemes');
    console.log('✔ Non-admin successfully blocked with 403 Forbidden');

    // 3. Test Scheme Creation with all 11 Excel Columns
    console.log('3. Testing Admin Add Scheme (all 11 Excel columns)...');
    const newSchemePayload = {
      name: 'Test Innovation Challenge Scheme',
      stage: 'Idea',
      fundingType: 'Grant',
      amount: 'up to 50 lakh',
      deadline: 'Rolling / Ongoing',
      industry: 'FinTech & AI',
      state: 'All India',
      founderType: 'All Founder Eligible',
      entityType: 'Pvt Ltd , LLP , Proprietor',
      programType: 'Grand Challenge',
      registrations: 'DPIIT Registered',
      description: 'Comprehensive test grant providing up to 50 lakh for early stage innovators.',
      tier: 'pro'
    };

    const addRes = await fetch(`${baseUrl}/api/admin/schemes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify(newSchemePayload)
    });
    const addData = await addRes.json();
    assert.strictEqual(addRes.status, 201, 'Scheme creation must succeed with 201');
    assert(addData.scheme && addData.scheme.id, 'Created scheme must have an ID');
    assert.strictEqual(addData.scheme.name, newSchemePayload.name);
    assert.strictEqual(addData.scheme.amountValue, 5000000, 'Amount value must be parsed as 5000000 for 50 lakh');
    const createdId = addData.scheme.id;
    console.log(`✔ Scheme created with ID: ${createdId} and amountValue: ${addData.scheme.amountValue}`);

    // 4. Test Scheme Retrieval (Admin sees all unlocked)
    console.log('4. Testing GET /api/schemes for Admin...');
    const getRes = await fetch(`${baseUrl}/api/schemes`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const getData = await getRes.json();
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getData.isAdmin, true, 'Response must identify user as admin');
    const found = getData.schemes.find(s => s.id === createdId);
    assert(found, 'Created scheme must exist in list');
    assert.strictEqual(found.isLocked, false, 'Admin must see scheme unlocked');
    console.log('✔ Admin retrieved schemes successfully with unlocked status');

    // 5. Test Scheme Update
    console.log('5. Testing Scheme Update...');
    const updatePayload = {
      name: 'Updated Innovation Challenge Scheme',
      amount: 'up to 2 cr',
      stage: 'Revenue',
      industry: 'FinTech & Sustainable Energy'
    };
    const putRes = await fetch(`${baseUrl}/api/admin/schemes/${createdId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify(updatePayload)
    });
    const putData = await putRes.json();
    assert.strictEqual(putRes.status, 200, 'Scheme update must succeed');
    assert.strictEqual(putData.scheme.name, 'Updated Innovation Challenge Scheme');
    assert.strictEqual(putData.scheme.amountValue, 20000000, 'Amount value must be re-parsed as 20000000 for 2 cr');
    assert.strictEqual(putData.scheme.stage, 'Revenue');
    console.log('✔ Scheme updated successfully and re-parsed numeric amount value');

    // 6. Test Scheme Deletion
    console.log('6. Testing Scheme Deletion...');
    const delRes = await fetch(`${baseUrl}/api/admin/schemes/${createdId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const delData = await delRes.json();
    assert.strictEqual(delRes.status, 200, 'Scheme deletion must succeed');
    assert.strictEqual(delData.deletedId, createdId);

    // Verify scheme is deleted
    const verifyGet = await fetch(`${baseUrl}/api/schemes`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const verifyData = await verifyGet.json();
    const deletedFound = verifyData.schemes.find(s => s.id === createdId);
    assert(!deletedFound, 'Deleted scheme must not exist in schemes list');
    console.log('✔ Scheme deletion verified: Scheme completely removed from dataset');

    // 7. Test Admin HTML page route
    console.log('7. Testing Admin Page route delivery...');
    const pageRes = await fetch(`${baseUrl}/admin/schemes`);
    assert.strictEqual(pageRes.status, 200, '/admin/schemes must return 200 OK');
    const pageHtml = await pageRes.text();
    assert(pageHtml.includes('Admin Scheme Management'), 'Page must contain Admin title');
    assert(pageHtml.includes('addSchemeForm'), 'Page must contain Add Scheme form');
    console.log('✔ Admin Page route served correctly');

    console.log('\n=============================================');
    console.log('🎉 ALL ADMIN SCHEME CRUD & SECURITY TESTS PASSED!');
    console.log('=============================================');
  } finally {
    server.close();
    process.exit(0);
  }
}

runAdminTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
