const fs = require('fs');
const file = 'node_modules/@cloudflare/next-on-pages/dist/index.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/'npx'/g, "'npx.cmd'");
content = content.replace(/"npx"/g, '"npx.cmd"');
fs.writeFileSync(file, content);
console.log('Patched successfully!');
