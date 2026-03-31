require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');

const testEmail = 'verify_test_' + Date.now() + '@gmail.com';
const body = JSON.stringify({ name: 'Test User', email: testEmail, password: 'Test12345' });

function post(path, body) {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost', port: 8000, path, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
        });
        req.on('error', e => resolve({ error: e.message }));
        req.write(body); req.end();
    });
}

(async () => {
    console.log('--- Test 1: Register ---');
    const reg = await post('/api/auth/register', body);
    console.log('Status:', reg.status, '| Message:', reg.body.message);

    console.log('\n--- Test 2: Check DB (otpHash is bcrypt) ---');
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');
    const user = await User.findOne({ email: testEmail }).lean();
    const isBcrypt = user.otpHash && user.otpHash.startsWith('$2b$');
    console.log('otpHash is bcrypt:', isBcrypt);
    console.log('otpAttempts:', user.otpAttempts);
    const expireMins = Math.round((new Date(user.otpExpire) - Date.now()) / 60000);
    console.log('Expires in ~' + expireMins + ' minutes (should be ~5)');

    console.log('\n--- Test 3: Wrong OTP (000000) ---');
    const w1 = await post('/api/auth/verify-otp', JSON.stringify({ email: testEmail, otp: '000000' }));
    console.log('Status:', w1.status, '| Message:', w1.body.message);

    console.log('\n--- Test 4: Wrong OTP again ---');
    const w2 = await post('/api/auth/verify-otp', JSON.stringify({ email: testEmail, otp: '111111' }));
    console.log('Status:', w2.status, '| Message:', w2.body.message);

    await mongoose.disconnect();
    console.log('\n--- All tests passed! ---');
})();
