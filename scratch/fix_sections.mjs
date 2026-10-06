import { execSync } from 'child_process';
import fs from 'fs';

// 1. Fetch all users from D1
console.log('Fetching users from D1...');
try {
  const output = execSync('npx wrangler d1 execute ppk-choir-db --remote --json --command "SELECT id, section FROM users WHERE section IS NOT NULL AND section != \'\'"', { encoding: 'utf8' });
  const data = JSON.parse(output);
  const rows = data[0].results;
  
  let sql = '';
  
  for (const row of rows) {
    if (!row.section) continue;
    let section = row.section.trim();
    
    // Normalize format to ม.X/Y
    // Match "5/5", "ม.5/5", "ม5/5", "ม. 5/5"
    const match = section.match(/^(?:ม\.|ม\.?\s*)?([1-6])\s*\/\s*([1-9][0-9]?)$/);
    if (match) {
      const normalized = `ม.${match[1]}/${match[2]}`;
      if (normalized !== row.section) {
        sql += `UPDATE users SET section = '${normalized}' WHERE id = '${row.id}';\n`;
      }
    }
  }
  
  if (sql.length > 0) {
    console.log(`Found ${sql.split('\\n').length - 1} users to update.`);
    fs.writeFileSync('scratch/update_sections.sql', sql);
    console.log('Executing updates on D1...');
    execSync('npx wrangler d1 execute ppk-choir-db --remote --file scratch/update_sections.sql', { stdio: 'inherit' });
    console.log('Done!');
  } else {
    console.log('No users need updating.');
  }
  
} catch (error) {
  console.error(error);
}
