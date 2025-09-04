import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding working_tour_id column to driver_schedules table...');

db.run('ALTER TABLE driver_schedules ADD COLUMN working_tour_id INTEGER', function(err) {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('✅ working_tour_id column already exists');
    } else {
      console.error('❌ Error adding column:', err);
    }
  } else {
    console.log('✅ working_tour_id column added successfully');
  }
  
  // Now verify the schema
  db.all('PRAGMA table_info(driver_schedules)', (err, rows) => {
    if (err) {
      console.error('Error checking schema:', err);
    } else {
      console.log('\nUpdated driver_schedules columns:');
      rows.forEach(row => {
        console.log(`  ${row.cid}: ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULLABLE'} - Default: ${row.dflt_value || 'NULL'}`);
      });
    }
    
    db.close();
  });
});
