import { dbRun, dbGet, dbAll } from './database.js'

export async function initializeDatabase() {
  try {
    // Create drivers table with driver_id from the start
    await dbRun(`
      CREATE TABLE IF NOT EXISTS drivers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        driver_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        license_number TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'Active',
        join_date DATE NOT NULL,
        profile_picture TEXT,
        current_address TEXT,
        employment_type TEXT DEFAULT 'Fulltime',
        annual_vacation_days INTEGER DEFAULT 25,
        used_vacation_days INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create users table for authentication
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create routes table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        start_location TEXT NOT NULL,
        end_location TEXT NOT NULL,
        distance REAL NOT NULL,
        estimated_duration INTEGER NOT NULL,
        difficulty TEXT DEFAULT 'Medium',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create assignments table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        driver_id INTEGER NOT NULL,
        route_id INTEGER NOT NULL,
        assignment_date DATE NOT NULL,
        status TEXT DEFAULT 'Scheduled',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES drivers(id),
        FOREIGN KEY (route_id) REFERENCES routes(id)
      )
    `)

    // Create holidays table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS holidays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        driver_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        days INTEGER NOT NULL,
        type TEXT DEFAULT 'Annual Leave',
        status TEXT DEFAULT 'Pending',
        reason TEXT,
        request_date DATE NOT NULL,
        approved_by TEXT,
        approved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES drivers(id)
      )
    `)

    // Create warning_categories table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS warning_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#6B7280',
        icon TEXT DEFAULT 'AlertTriangle',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create warnings table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        driver_id INTEGER NOT NULL,
        category_id INTEGER,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT DEFAULT 'Medium',
        status TEXT DEFAULT 'Active',
        location TEXT,
        date DATE NOT NULL,
        expiration_date DATE,
        document_path TEXT,
        issued_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES drivers(id),
        FOREIGN KEY (category_id) REFERENCES warning_categories(id)
      )
    `)

    // Create warning_templates table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS warning_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category_id INTEGER,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT DEFAULT 'Medium',
        location_placeholder TEXT,
        expiration_days INTEGER,
        is_active BOOLEAN DEFAULT 1,
        usage_count INTEGER DEFAULT 0,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES warning_categories(id)
      )
    `)

    // Create notifications table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        driver_id INTEGER,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        icon TEXT DEFAULT 'Bell',
        severity TEXT DEFAULT 'info',
        is_read BOOLEAN DEFAULT 0,
        is_global BOOLEAN DEFAULT 0,
        action_url TEXT,
        action_label TEXT,
        metadata TEXT,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES drivers(id)
      )
    `)

    // Create holiday_requests table for public requests
    await dbRun(`
      CREATE TABLE IF NOT EXISTS holiday_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        driver_name TEXT NOT NULL,
        driver_id TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        department TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT NOT NULL,
        emergency_contact TEXT,
        emergency_phone TEXT,
        notes TEXT,
        requested_days INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        submitted_at DATETIME NOT NULL,
        approved_by TEXT,
        approved_at DATETIME,
        management_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create audit_logs table for tracking all system changes
    await dbRun(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('CREATE', 'UPDATE', 'DELETE')),
        old_values TEXT,
        new_values TEXT,
        user_id INTEGER,
        user_email TEXT,
        ip_address TEXT,
        user_agent TEXT,
        session_id TEXT,
        endpoint TEXT,
        method TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `)

    console.log('✅ Database tables created successfully')
    
    // Migrate holiday_requests table to make email and phone optional
    try {
      // Check if the table needs migration by trying to insert a record without email/phone
      const testResult = await dbGet(`PRAGMA table_info(holiday_requests)`)
      
      // Create a new table with the correct schema
      await dbRun(`
        CREATE TABLE IF NOT EXISTS holiday_requests_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          driver_name TEXT NOT NULL,
          driver_id TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          department TEXT,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          reason TEXT NOT NULL,
          emergency_contact TEXT,
          emergency_phone TEXT,
          notes TEXT,
          requested_days INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          submitted_at DATETIME NOT NULL,
          approved_by TEXT,
          approved_at DATETIME,
          management_notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      // Copy data from old table to new table
      await dbRun(`
        INSERT INTO holiday_requests_new 
        SELECT * FROM holiday_requests
      `)
      
      // Drop old table and rename new table
      await dbRun(`DROP TABLE holiday_requests`)
      await dbRun(`ALTER TABLE holiday_requests_new RENAME TO holiday_requests`)
      
      console.log('✅ Holiday requests table migrated successfully')
    } catch (error) {
      console.log('ℹ️ Holiday requests table migration not needed or already completed')
    }
    
    // Check if sample data exists
    const existingDrivers = await dbGet('SELECT COUNT(*) as count FROM drivers')
    if (existingDrivers.count === 0) {
      await insertSampleData()
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    throw error
  }
}

// Function to generate unique driver ID
function generateDriverId(): string {
  const year = new Date().getFullYear()
  const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `DRV-${year}-${randomNum}`
}

async function insertSampleData() {
  // Sample warning categories
  const warningCategories = [
    {
      name: 'Safety',
      description: 'Safety-related violations and concerns',
      color: '#EF4444',
      icon: 'Shield'
    },
    {
      name: 'Performance',
      description: 'Performance and efficiency issues',
      color: '#F59E0B',
      icon: 'TrendingDown'
    },
    {
      name: 'Compliance',
      description: 'Regulatory and policy compliance violations',
      color: '#8B5CF6',
      icon: 'FileText'
    },
    {
      name: 'Behavioral',
      description: 'Behavioral and conduct issues',
      color: '#06B6D4',
      icon: 'Users'
    },
    {
      name: 'Vehicle',
      description: 'Vehicle maintenance and operation issues',
      color: '#10B981',
      icon: 'Truck'
    },
    {
      name: 'Documentation',
      description: 'Missing or incorrect documentation',
      color: '#6B7280',
      icon: 'FileX'
    }
  ]

  for (const category of warningCategories) {
    await dbRun(
      `INSERT OR IGNORE INTO warning_categories (name, description, color, icon) VALUES (?, ?, ?, ?)`,
      [category.name, category.description, category.color, category.icon]
    )
  }

  // Sample warning templates
  const warningTemplates = [
    {
      name: 'Speed Violation - Highway',
      category_id: 1, // Safety
      type: 'Speed Violation',
      description: 'Exceeded speed limit by [AMOUNT] mph on [LOCATION]',
      severity: 'High',
      location_placeholder: 'Highway/Road name',
      expiration_days: 365,
      created_by: 'System'
    },
    {
      name: 'Late Arrival - Standard',
      category_id: 2, // Performance
      type: 'Late Arrival',
      description: 'Arrived [TIME] minutes late for scheduled route without prior notification',
      severity: 'Medium',
      location_placeholder: 'Route/Depot location',
      expiration_days: 180,
      created_by: 'System'
    },
    {
      name: 'Customer Complaint - Service',
      category_id: 4, // Behavioral
      type: 'Customer Complaint',
      description: 'Received customer complaint regarding [ISSUE] during service delivery',
      severity: 'Medium',
      location_placeholder: 'Customer location',
      expiration_days: 365,
      created_by: 'System'
    },
    {
      name: 'Vehicle Inspection Failure',
      category_id: 5, // Vehicle
      type: 'Vehicle Inspection',
      description: 'Failed to complete required [INSPECTION_TYPE] inspection',
      severity: 'High',
      location_placeholder: 'Inspection location',
      expiration_days: 90,
      created_by: 'System'
    },
    {
      name: 'Parking Violation',
      category_id: 3, // Compliance
      type: 'Parking Violation',
      description: 'Parked in unauthorized area: [VIOLATION_DETAILS]',
      severity: 'Low',
      location_placeholder: 'Violation location',
      expiration_days: 180,
      created_by: 'System'
    },
    {
      name: 'Missing Documentation',
      category_id: 6, // Documentation
      type: 'Documentation',
      description: 'Failed to provide required [DOCUMENT_TYPE] documentation',
      severity: 'Medium',
      location_placeholder: 'N/A',
      expiration_days: 30,
      created_by: 'System'
    },
    {
      name: 'Unsafe Driving Behavior',
      category_id: 1, // Safety
      type: 'Unsafe Driving',
      description: 'Observed unsafe driving behavior: [BEHAVIOR_DETAILS]',
      severity: 'High',
      location_placeholder: 'Location of incident',
      expiration_days: 365,
      created_by: 'System'
    },
    {
      name: 'Route Deviation',
      category_id: 3, // Compliance
      type: 'Route Deviation',
      description: 'Deviated from assigned route without authorization: [DEVIATION_DETAILS]',
      severity: 'Medium',
      location_placeholder: 'Deviation location',
      expiration_days: 180,
      created_by: 'System'
    }
  ]

  for (const template of warningTemplates) {
    await dbRun(
      `INSERT OR IGNORE INTO warning_templates (name, category_id, type, description, severity, location_placeholder, expiration_days, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [template.name, template.category_id, template.type, template.description, template.severity, template.location_placeholder, template.expiration_days, template.created_by]
    )
  }

  // Sample drivers with driver_id
  const drivers = [
    {
      driver_id: 'DRV-2023-0001',
      name: 'John Smith',
      email: 'john.smith@company.com',
      phone: '+1 234 567 8900',
      license_number: 'DL123456789',
      join_date: '2023-01-15'
    },
    {
      driver_id: 'DRV-2023-0002',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      phone: '+1 234 567 8901',
      license_number: 'DL123456790',
      join_date: '2023-03-22'
    },
    {
      driver_id: 'DRV-2022-0003',
      name: 'Mike Davis',
      email: 'mike.davis@company.com',
      phone: '+1 234 567 8902',
      license_number: 'DL123456791',
      join_date: '2022-11-08'
    },
    {
      driver_id: 'DRV-2024-0004',
      name: 'Emma Wilson',
      email: 'emma.wilson@company.com',
      phone: '+1 234 567 8903',
      license_number: 'DL123456792',
      join_date: '2024-02-14'
    },
    {
      driver_id: 'DRV-2025-0005',
      name: 'James Brown',
      email: 'james.brown@company.com',
      phone: '+1 234 567 8904',
      license_number: 'DL123456793',
      join_date: '2025-01-03'
    }
  ]

  for (const driver of drivers) {
    await dbRun(`
      INSERT INTO drivers (driver_id, name, email, phone, license_number, join_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [driver.driver_id, driver.name, driver.email, driver.phone, driver.license_number, driver.join_date])
  }

  // Sample routes
  const routes = [
    { name: 'Downtown Express', start_location: 'Terminal A', end_location: 'Downtown Plaza', distance: 15.5, estimated_duration: 35 },
    { name: 'Suburban Loop', start_location: 'Mall Central', end_location: 'Residential District', distance: 22.3, estimated_duration: 45 },
    { name: 'Airport Shuttle', start_location: 'City Center', end_location: 'International Airport', distance: 28.7, estimated_duration: 55 },
    { name: 'University Route', start_location: 'Student Village', end_location: 'University Campus', distance: 8.2, estimated_duration: 20 },
    { name: 'Industrial Zone', start_location: 'Factory District', end_location: 'Warehouse Area', distance: 18.9, estimated_duration: 40 }
  ]

  for (const route of routes) {
    await dbRun(`
      INSERT INTO routes (name, start_location, end_location, distance, estimated_duration)
      VALUES (?, ?, ?, ?, ?)
    `, [route.name, route.start_location, route.end_location, route.distance, route.estimated_duration])
  }

  // Sample assignments
  const assignments = [
    { driver_id: 1, route_id: 1, assignment_date: '2025-08-25', status: 'In Progress' },
    { driver_id: 2, route_id: 2, assignment_date: '2025-08-25', status: 'Completed' },
    { driver_id: 3, route_id: 3, assignment_date: '2025-08-24', status: 'Completed' },
    { driver_id: 4, route_id: 4, assignment_date: '2025-08-24', status: 'Completed' },
    { driver_id: 5, route_id: 5, assignment_date: '2025-08-26', status: 'Scheduled' },
    { driver_id: 1, route_id: 2, assignment_date: '2025-08-23', status: 'Completed' },
    { driver_id: 2, route_id: 3, assignment_date: '2025-08-23', status: 'Completed' },
    { driver_id: 3, route_id: 1, assignment_date: '2025-08-22', status: 'Completed' },
    { driver_id: 4, route_id: 5, assignment_date: '2025-08-26', status: 'Scheduled' },
    { driver_id: 5, route_id: 4, assignment_date: '2025-08-27', status: 'Scheduled' }
  ]

  for (const assignment of assignments) {
    await dbRun(`
      INSERT INTO assignments (driver_id, route_id, assignment_date, status)
      VALUES (?, ?, ?, ?)
    `, [assignment.driver_id, assignment.route_id, assignment.assignment_date, assignment.status])
  }

  // Sample holidays
  const holidays = [
    { driver_id: 1, start_date: '2025-07-01', end_date: '2025-07-07', days: 7, type: 'Annual Leave', status: 'Approved', request_date: '2025-06-15' },
    { driver_id: 2, start_date: '2025-08-15', end_date: '2025-08-20', days: 6, type: 'Sick Leave', status: 'Pending', request_date: '2025-08-10' },
    { driver_id: 3, start_date: '2025-09-10', end_date: '2025-09-15', days: 6, type: 'Personal Leave', status: 'Pending', request_date: '2025-09-01' },
    { driver_id: 4, start_date: '2025-06-01', end_date: '2025-06-05', days: 5, type: 'Annual Leave', status: 'Approved', request_date: '2025-05-15' },
    { driver_id: 5, start_date: '2025-07-20', end_date: '2025-07-25', days: 6, type: 'Annual Leave', status: 'Approved', request_date: '2025-07-10' },
    { driver_id: 1, start_date: '2025-05-01', end_date: '2025-05-03', days: 3, type: 'Personal Leave', status: 'Approved', request_date: '2025-04-20' }
  ]

  for (const holiday of holidays) {
    await dbRun(`
      INSERT INTO holidays (driver_id, start_date, end_date, days, type, status, request_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [holiday.driver_id, holiday.start_date, holiday.end_date, holiday.days, holiday.type, holiday.status, holiday.request_date])
  }

  // Sample warnings
  const warnings = [
    { driver_id: 1, category_id: 1, type: 'Speed Violation', description: 'Exceeded speed limit by 15 mph on Highway 101', severity: 'Medium', status: 'Active', date: '2025-08-15' },
    { driver_id: 2, category_id: 2, type: 'Late Arrival', description: 'Arrived 30 minutes late for scheduled route', severity: 'Low', status: 'Resolved', date: '2025-08-20' },
    { driver_id: 3, category_id: 4, type: 'Customer Complaint', description: 'Received complaint about rude behavior', severity: 'High', status: 'Under Review', date: '2025-07-25' },
    { driver_id: 1, category_id: 5, type: 'Vehicle Inspection', description: 'Failed to complete pre-trip inspection', severity: 'Medium', status: 'Active', date: '2025-08-01' },
    { driver_id: 4, category_id: 1, type: 'Speed Violation', description: 'Exceeded speed limit by 20 mph on I-95', severity: 'High', status: 'Active', date: '2025-07-10' },
    { driver_id: 2, category_id: 3, type: 'Parking Violation', description: 'Parked in no-parking zone during delivery', severity: 'Low', status: 'Resolved', date: '2025-06-15' },
    { driver_id: 5, category_id: 2, type: 'Customer Complaint', description: 'Package delivered to wrong address', severity: 'Medium', status: 'Resolved', date: '2025-06-28' },
    { driver_id: 3, category_id: 2, type: 'Late Arrival', description: 'Arrived 45 minutes late without notification', severity: 'Medium', status: 'Active', date: '2025-07-05' }
  ]

  for (const warning of warnings) {
    await dbRun(`
      INSERT INTO warnings (driver_id, category_id, type, description, severity, status, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [warning.driver_id, warning.category_id, warning.type, warning.description, warning.severity, warning.status, warning.date])
  }

  // Default admin user (password: admin123)
  const adminPasswordHash = '$2a$10$rBjQ2Ql3VVcbK8TXjN.OLOxGwpjJV4k/7yP6kZNtA8Ef7G3HzYwGy'
  
  // Check if admin user already exists
  const existingAdmin = await dbGet('SELECT id FROM users WHERE email = ?', ['admin@company.com'])
  if (!existingAdmin) {
    await dbRun(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, ['admin', 'admin@company.com', adminPasswordHash, 'admin'])
  }

  // Sample notifications
  const notifications = [
    {
      type: 'warning_created',
      title: 'New Warning Issued',
      message: 'A new speed violation warning has been issued to John Smith',
      icon: 'AlertTriangle',
      severity: 'warning',
      driver_id: 1,
      action_url: '/warnings',
      action_label: 'View Details',
      is_global: false
    },
    {
      type: 'holiday_request',
      title: 'Holiday Request Pending',
      message: 'Sarah Johnson has submitted a holiday request for review',
      icon: 'Calendar',
      severity: 'info',
      driver_id: 2,
      action_url: '/holidays',
      action_label: 'Review Request',
      is_global: false
    },
    {
      type: 'system_update',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight from 2 AM to 4 AM',
      icon: 'Settings',
      severity: 'info',
      is_global: true,
      expires_at: '2025-08-27 06:00:00'
    },
    {
      type: 'driver_achievement',
      title: 'Driver Milestone',
      message: 'Mike Davis has completed 1000 safe driving days!',
      icon: 'Award',
      severity: 'success',
      driver_id: 3,
      action_url: '/drivers/3',
      action_label: 'View Profile',
      is_global: false
    },
    {
      type: 'warning_resolved',
      title: 'Warning Resolved',
      message: 'Late arrival warning for Sarah Johnson has been resolved',
      icon: 'CheckCircle',
      severity: 'success',
      driver_id: 2,
      action_url: '/warnings',
      action_label: 'View History',
      is_global: false,
      is_read: true
    }
  ]

  for (const notification of notifications) {
    await dbRun(`
      INSERT INTO notifications (type, title, message, icon, severity, driver_id, action_url, action_label, is_global, expires_at, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      notification.type,
      notification.title,
      notification.message,
      notification.icon,
      notification.severity,
      notification.driver_id || null,
      notification.action_url || null,
      notification.action_label || null,
      notification.is_global ? 1 : 0,
      notification.expires_at || null,
      notification.is_read ? 1 : 0
    ])
  }

  console.log('✅ Sample data inserted successfully')
}
