import { execSync } from 'child_process';
import fs from 'fs';

// 1. Get all users
const output = execSync('npx wrangler d1 execute ppk-choir-db --remote --json --command "SELECT id, name, voiceType, section FROM users"').toString();
// Parse the stdout. Wrangler might print logs before the json array.
const jsonStr = output.substring(output.indexOf('['), output.lastIndexOf(']') + 1);
const data = JSON.parse(jsonStr)[0].results;

const maleVoices = ['Tenor 1', 'Tenor 2', 'Baritone', 'Bass'];
const femaleVoices = ['Soprano 1', 'Soprano 2', 'Alto 1', 'Alto 2'];

const updates = [];

for (const user of data) {
  if (user.id === 'admin-krumum-piano') continue;
  
  const name = user.name.trim();
  if (name.startsWith('นาย') || name.startsWith('นางสาว') || name.startsWith('ด.ช.') || name.startsWith('ด.ญ.')) {
    continue; // Already has prefix
  }

  let isMale = maleVoices.includes(user.voiceType);
  let isFemale = femaleVoices.includes(user.voiceType);
  
  if (!isMale && !isFemale) continue; // Cannot determine gender

  let section = (user.section || '').trim();
  let gradeMatch = section.match(/^(?:ม\.)?([1-6])/);
  
  let prefix = '';
  if (gradeMatch) {
    let grade = parseInt(gradeMatch[1]);
    if (grade >= 1 && grade <= 3) {
      prefix = isMale ? 'ด.ช.' : 'ด.ญ.';
    } else if (grade >= 4 && grade <= 6) {
      prefix = isMale ? 'นาย' : 'นางสาว';
    }
  } else {
    // If no section info, we can't reliably guess age. We'll default to senior for now, or just skip.
    // Given it's high school/middle school, defaulting is risky, let's skip if we don't know the grade.
    continue;
  }

  if (prefix) {
    const newName = `${prefix}${name}`;
    updates.push(`UPDATE users SET name = '${newName}' WHERE id = '${user.id}';`);
    console.log(`Will update: ${name} -> ${newName} (Voice: ${user.voiceType}, Section: ${section})`);
  }
}

if (updates.length > 0) {
  fs.writeFileSync('scratch/update_prefixes.sql', updates.join('\n'));
  console.log(`Wrote ${updates.length} updates to scratch/update_prefixes.sql`);
} else {
  console.log('No users to update.');
}
