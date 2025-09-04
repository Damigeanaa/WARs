import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking existing driver IDs in database...');

db.all('SELECT driver_id, name FROM drivers ORDER BY driver_id', (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Current drivers in database:');
    rows.forEach(row => {
      console.log(`  ${row.driver_id} - ${row.name}`);
    });
    console.log(`\nTotal drivers: ${rows.length}`);
  }
  
  db.close();
});
