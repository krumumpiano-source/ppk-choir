import fs from 'fs';

let sql = fs.readFileSync('scratch/update_prefixes.sql', 'utf8');
sql = sql.replace(/ด\.ญ\.กฤตฑรรศ/g, 'ด.ช.กฤตฑรรศ');
sql = sql.replace(/ด\.ญ\.ภูริเดช/g, 'ด.ช.ภูริเดช');

fs.writeFileSync('scratch/update_prefixes_fixed.sql', sql);
