const http = require('http');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Set test environment
process.env.PORT = 3099;
process.env.INITIAL_VISITOR_COUNT = '29';

// Ensure test clean slate for visitors.json
const visitorsFile = path.join(__dirname, 'data', 'visitors.json');
const backupFile = path.join(__dirname, 'data', 'visitors.json.bak');
if (fs.existsSync(visitorsFile)) {
  fs.copyFileSync(visitorsFile, backupFile);
  fs.unlinkSync(visitorsFile);
}

const app = require('./server');
const server = app.listen(3099, '127.0.0.1');

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3099,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Visitor API Tests...\n');
  let passed = 0;

  try {
    // Test 1: GET /api/visitors/count baseline
    const res1 = await request('GET', '/api/visitors/count');
    assert.strictEqual(res1.status, 200, 'GET /api/visitors/count should return 200');
    assert.strictEqual(res1.body.success, true);
    assert.strictEqual(res1.body.count, 29, 'Initial baseline count should be 29');
    console.log('✔ Test 1 Passed: GET /api/visitors/count returns initial baseline count (29)');
    passed++;

    // Test 2: POST /api/visitors/hit for a new visitor
    const visitorA = 'test_visitor_alpha_' + Date.now();
    const res2 = await request('POST', '/api/visitors/hit', { visitorId: visitorA }, {
      'x-forwarded-for': '192.168.1.100',
      'user-agent': 'TestBrowser/1.0'
    });
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.body.success, true);
    assert.strictEqual(res2.body.isNew, true, 'First visit should be isNew=true');
    assert.strictEqual(res2.body.count, 30, 'Count should increment to 30');
    console.log('✔ Test 2 Passed: First visit by visitor A increments count to 30');
    passed++;

    // Test 3: Duplicate hit by visitor A (idempotency)
    const res3 = await request('POST', '/api/visitors/hit', { visitorId: visitorA }, {
      'x-forwarded-for': '192.168.1.100',
      'user-agent': 'TestBrowser/1.0'
    });
    assert.strictEqual(res3.status, 200);
    assert.strictEqual(res3.body.success, true);
    assert.strictEqual(res3.body.isNew, false, 'Repeat visit should be isNew=false');
    assert.strictEqual(res3.body.count, 30, 'Count should remain 30 (not incremented)');
    console.log('✔ Test 3 Passed: Repeat visit by visitor A is idempotent (count remains 30)');
    passed++;

    // Test 4: New visitor B
    const visitorB = 'test_visitor_beta_' + Date.now();
    const res4 = await request('POST', '/api/visitors/hit', { visitorId: visitorB }, {
      'x-forwarded-for': '10.0.0.50',
      'user-agent': 'TestBrowser/2.0'
    });
    assert.strictEqual(res4.status, 200);
    assert.strictEqual(res4.body.isNew, true);
    assert.strictEqual(res4.body.count, 31, 'Count should increment to 31');
    console.log('✔ Test 4 Passed: Second unique visitor B increments count to 31');
    passed++;

    // Test 5: Verify GET returns updated count 31
    const res5 = await request('GET', '/api/visitors/count');
    assert.strictEqual(res5.status, 200);
    assert.strictEqual(res5.body.count, 31);
    console.log('✔ Test 5 Passed: GET /api/visitors/count reflects updated count 31');
    passed++;

    // Test 6: Verify file persistence
    assert.ok(fs.existsSync(visitorsFile), 'visitors.json should exist on disk');
    const diskData = JSON.parse(fs.readFileSync(visitorsFile, 'utf8'));
    assert.strictEqual(diskData.count, 31);
    assert.ok(diskData.uniqueKeys[visitorA], 'visitor A should be recorded in disk data');
    assert.ok(diskData.uniqueKeys[visitorB], 'visitor B should be recorded in disk data');
    console.log('✔ Test 6 Passed: Disk file visitors.json persisted correctly');
    passed++;

    console.log(`\n🎉 All ${passed}/6 Visitor API Tests Passed Successfully!`);
  } catch (err) {
    console.error('❌ Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    // Restore backup if existed
    if (fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, visitorsFile);
      fs.unlinkSync(backupFile);
    }
    process.exit(process.exitCode || 0);
  }
}

runTests();
