const { execSync } = require('child_process');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const lines = envFile.split('\n');

for (const line of lines) {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    let value = valueParts.join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    console.log(`Adding ${key}...`);
    try {
      execSync(`npx vercel env add ${key} production`, { input: value });
    } catch (e) {
      console.log('Error adding', key);
    }
  }
}
console.log('Done!');
