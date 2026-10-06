import { execSync } from 'child_process';
import fs from 'fs';

// 2. Fetch checkins from D1
console.log('Fetching checkins from D1...');
try {
  const output = execSync('npx wrangler d1 execute ppk-choir-db --remote --json --command "SELECT id, room FROM checkins WHERE room IS NOT NULL AND room != \'\'"', { encoding: 'utf8' });
  const data = JSON.parse(output);
  const rows = data[0].results;
  
  let sql = '';
  
  for (const row of rows) {
    if (!row.room) continue;
    let room = row.room.trim();
    
    // Normalize format to ม.X/Y
    const match = room.match(/^(?:ม\.|ม\.?\s*)?([1-6])\s*\/\s*([1-9][0-9]?)$/);
    if (match) {
      const normalized = `ม.${match[1]}/${match[2]}`;
      if (normalized !== row.room) {
        sql += `UPDATE checkins SET room = '${normalized}' WHERE id = '${row.id}';\n`;
      }
    }
  }
  
  if (sql.length > 0) {
    console.log(`Found ${sql.split('\\n').length - 1} checkins to update.`);
    fs.writeFileSync('scratch/update_checkins.sql', sql);
    console.log('Executing updates on D1...');
    execSync('npx wrangler d1 execute ppk-choir-db --remote --file scratch/update_checkins.sql', { stdio: 'inherit' });
    console.log('Done!');
  } else {
    console.log('No checkins need updating.');
  }
  
} catch (error) {
  console.error(error);
}
