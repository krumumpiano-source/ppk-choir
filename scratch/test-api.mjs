import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ppk-choir-secret-key-2024';

async function run() {
  console.log("Mocking login token...");
  const token = jwt.sign(
    { 
      id: 'test-user-uuid', 
      studentId: '99999',
      role: 'student',
      name: 'ทดสอบ ระบบ',
      voiceType: 'Soprano 1',
      bandPosition: 'กีต้าร์',
      room: 'ม.5/5'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `token=${token}`
  };
  
  const sessionId = '9024f707-7e43-4648-9053-19e83ccd8cbc';
  const userId = 'test-user-uuid';
  
  console.log("1. Checking existing status...");
  let res = await fetch(`https://ppk-choir.pages.dev/api/checkin?studentId=${userId}&sessionId=${sessionId}`, { headers });
  console.log(await res.text());

  console.log("2. Simulating Check-In with GPS at Phayao Pittayakhom School...");
  res = await fetch(`https://ppk-choir.pages.dev/api/checkin`, { 
    method: 'POST',
    headers,
    body: JSON.stringify({
      studentId: userId,
      studentName: 'ทดสอบ ระบบ',
      location: { lat: 19.169867, lng: 99.910017 },
      devicePlatform: 'mobile',
      room: 'ม.5/5',
      sessionId: sessionId
    })
  });
  console.log(await res.text());

  console.log("3. Waiting 3 seconds...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log("4. Simulating Check-Out...");
  res = await fetch(`https://ppk-choir.pages.dev/api/checkin`, { 
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      studentId: userId,
      sessionId: sessionId
    })
  });
  console.log(await res.text());
}

run();
