const fs = require('fs');
const img = fs.readFileSync('C:/Users/krumu/.gemini/antigravity-ide/brain/edc28de7-620f-4eb1-a173-9b2ae11cfca2/.user_uploaded/media_1791272547406.png');
const b64 = 'data:image/png;base64,' + img.toString('base64');
fs.writeFileSync('upload.sql', `INSERT OR REPLACE INTO settings (id, data) VALUES ('consent_document_image', '${b64}');`);
