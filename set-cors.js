const { Storage } = require('@google-cloud/storage');

const storage = new Storage({
  projectId: 'ppk-choir',
  keyFilename: './ppk-choir-firebase-adminsdk-fbsvc-0f4723930d.json'
});

async function run() {
  const bucketName = 'ppk-choir.appspot.com';
  try {
    const bucket = storage.bucket(bucketName);
    const corsConfiguration = [
      {
        maxAgeSeconds: 3600,
        method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        origin: ['*'],
        responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'x-goog-resumable'],
      },
    ];

    await bucket.setCorsConfiguration(corsConfiguration);
    console.log(`[SUCCESS] CORS set on bucket: ${bucketName}`);
  } catch (error) {
    console.error(`Error for bucket ${bucketName}:`, error.message);
  }
}

run();
