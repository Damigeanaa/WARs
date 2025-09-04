import express from 'express';
import { db, dbRun, dbGet, dbAll } from '../database/database';

const router = express.Router();

interface ProjectSettings {
  // System Settings
  enableNotifications: boolean;
  enableAuditLogs: boolean;
  autoBackup: boolean;
  backupFrequency: string;
  systemMaintenanceMode: boolean;
  darkModeEnabled: boolean;
  
  // Security Settings
  requireTwoFactor: boolean;
  passwordExpiration: number;
  maxLoginAttempts: number;
  
  // Driver Management Settings
  defaultVacationDays: number;
  defaultVacationDaysMinijob: number;
  defaultVacationDaysFulltime: number;
  warningExpirationDays: number;
  requireProfilePictures: boolean;
  enableSelfServiceHolidays: boolean;
  autoApproveHolidays: boolean;
  maxHolidayRequestDays: number;
  
  // Integration Settings
  timesheetIntegrationEnabled: boolean;
  apiRateLimit: number;
  sessionTimeout: number;
  enableDataSync: boolean;
  
  // Performance Settings
  cacheExpiration: number;
  maxFileUploadSize: number;
  enableCompression: boolean;
}

// Initialize settings table if it doesn't exist
const initializeSettingsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS project_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      setting_type TEXT NOT NULL DEFAULT 'string',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER,
      FOREIGN KEY (updated_by) REFERENCES users(id)
    )
  `;
  
  await dbRun(createTableQuery);
  
  // Insert default settings if they don't exist
  const defaultSettings: ProjectSettings = {
    enableNotifications: true,
    enableAuditLogs: true,
    autoBackup: true,
    backupFrequency: 'daily',
    systemMaintenanceMode: false,
    darkModeEnabled: false,
    requireTwoFactor: false,
    passwordExpiration: 90,
    maxLoginAttempts: 5,
    defaultVacationDays: 25,
    defaultVacationDaysMinijob: 20,
    defaultVacationDaysFulltime: 30,
    warningExpirationDays: 365,
    requireProfilePictures: false,
    enableSelfServiceHolidays: true,
    autoApproveHolidays: false,
    maxHolidayRequestDays: 30,
    timesheetIntegrationEnabled: true,
    apiRateLimit: 1000,
    sessionTimeout: 60,
    enableDataSync: true,
    cacheExpiration: 3600,
    maxFileUploadSize: 10,
    enableCompression: true,
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    const type = typeof value;
    const insertQuery = `
      INSERT OR IGNORE INTO project_settings (setting_key, setting_value, setting_type) 
      VALUES (?, ?, ?)
    `;
    await dbRun(insertQuery, [key, JSON.stringify(value), type]);
  }
};

// Initialize the table
initializeSettingsTable();

// GET /api/settings - Get all project settings
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT setting_key, setting_value, setting_type FROM project_settings';
    const rows = await dbAll(query) as { setting_key: string; setting_value: string; setting_type: string }[];
    
    const settings: Partial<ProjectSettings> = {};
    rows.forEach(row => {
      try {
        settings[row.setting_key as keyof ProjectSettings] = JSON.parse(row.setting_value);
      } catch (error) {
        console.error(`Error parsing setting ${row.setting_key}:`, error);
      }
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Update project settings
router.put('/', async (req, res) => {
  try {
    const settings: Partial<ProjectSettings> = req.body;
    const userId = 1; // Default to admin user
    
    // Update each setting
    const updateQuery = `
      UPDATE project_settings 
      SET setting_value = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
      WHERE setting_key = ?
    `;
    
    for (const [key, value] of Object.entries(settings)) {
      await dbRun(updateQuery, [JSON.stringify(value), userId, key]);
    }
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// GET /api/settings/:key - Get a specific setting
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const query = 'SELECT setting_value FROM project_settings WHERE setting_key = ?';
    const row = await dbGet(query, [key]) as { setting_value: string } | undefined;
    
    if (!row) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    const value = JSON.parse(row.setting_value);
    res.json({ [key]: value });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// PUT /api/settings/:key - Update a specific setting
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = 1;
    
    const updateQuery = `
      UPDATE project_settings 
      SET setting_value = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
      WHERE setting_key = ?
    `;
    
    const result = await dbRun(updateQuery, [JSON.stringify(value), userId, key]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// POST /api/settings/reset - Reset all settings to defaults
router.post('/reset', async (req, res) => {
  try {
    const userId = 1;
    
    // Delete all existing settings
    await dbRun('DELETE FROM project_settings');
    
    // Reinitialize with defaults
    await initializeSettingsTable();
    
    res.json({ message: 'Settings reset to defaults successfully' });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

export default router;
