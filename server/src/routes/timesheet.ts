import express from 'express';
import timesheetService from '../services/timesheetService';

const router = express.Router();

// Auth routes
router.get('/auth/url', async (req, res) => {
  try {
    const authUrl = timesheetService.getAuthorizationUrl('dashboard-auth');
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

router.post('/auth/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const tokens = await timesheetService.exchangeCodeForTokens(code);
    
    if (tokens) {
      res.json({ success: true, message: 'Authentication successful', tokens });
    } else {
      res.status(400).json({ error: 'Failed to exchange code for token' });
    }
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/auth/status', async (req, res) => {
  try {
    const connectionTest = await timesheetService.testConnection();
    res.json({ 
      authenticated: connectionTest.success,
      message: connectionTest.message
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({ error: 'Failed to check authentication status' });
  }
});

// Employee routes
router.get('/employees', async (req, res) => {
  try {
    const employees = await timesheetService.getEmployees();
    res.json({ data: employees, count: employees.length });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

router.get('/employees/:employeeNumber', async (req, res) => {
  try {
    const { employeeNumber } = req.params;
    const employee = await timesheetService.getEmployee(employeeNumber);
    
    if (employee) {
      res.json({ data: employee });
    } else {
      res.status(404).json({ error: 'Employee not found' });
    }
  } catch (error) {
    console.error(`Error fetching employee ${req.params.employeeNumber}:`, error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

router.post('/employees', async (req, res) => {
  try {
    await timesheetService.createEmployee(req.body);
    res.status(201).json({ message: 'Employee created successfully' });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

router.put('/employees/:employeeNumber', async (req, res) => {
  try {
    const { employeeNumber } = req.params;
    await timesheetService.updateEmployee(employeeNumber, req.body);
    res.json({ message: 'Employee updated successfully' });
  } catch (error) {
    console.error(`Error updating employee ${req.params.employeeNumber}:`, error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

router.delete('/employees/:employeeNumber', async (req, res) => {
  try {
    const { employeeNumber } = req.params;
    await timesheetService.deleteEmployee(employeeNumber);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error(`Error deleting employee ${req.params.employeeNumber}:`, error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// Job routes
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await timesheetService.getJobs();
    res.json({ data: jobs, count: jobs.length });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Schedule routes
router.get('/schedules', async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    
    if (!from_date || !to_date) {
      return res.status(400).json({ error: 'from_date and to_date are required' });
    }

    const schedules = await timesheetService.getSchedules(
      from_date as string,
      to_date as string
    );
    
    res.json({ data: schedules, count: schedules.length });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

router.post('/schedules', async (req, res) => {
  try {
    const scheduleResult = await timesheetService.createSchedule(req.body);
    res.status(201).json({ 
      message: 'Schedule created successfully',
      data: scheduleResult 
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

// Reporting routes
router.get('/reports/timesheet', async (req, res) => {
  try {
    const { from_date, to_date, employee_number } = req.query;
    
    if (!from_date || !to_date) {
      return res.status(400).json({ error: 'from_date and to_date are required' });
    }

    const report = await timesheetService.getTimesheetReport(
      from_date as string,
      to_date as string,
      employee_number as string
    );
    
    res.json({ data: report });
  } catch (error) {
    console.error('Error generating timesheet report:', error);
    res.status(500).json({ error: 'Failed to generate timesheet report' });
  }
});

router.get('/reports/schedule-vs-actual', async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    
    if (!from_date || !to_date) {
      return res.status(400).json({ error: 'from_date and to_date are required' });
    }

    const report = await timesheetService.getScheduleVsActualReport(
      from_date as string,
      to_date as string
    );
    
    res.json(report);
  } catch (error) {
    console.error('Error generating schedule vs actual report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Sync operations
router.post('/sync/employees', async (req, res) => {
  try {
    const result = await timesheetService.syncEmployees();
    res.json({
      message: 'Employee sync completed',
      synced: result.synced,
      errors: result.errors
    });
  } catch (error) {
    console.error('Error syncing employees:', error);
    res.status(500).json({ error: 'Failed to sync employees' });
  }
});

// Health check and connection test
router.get('/health', async (req, res) => {
  try {
    const connectionTest = await timesheetService.testConnection();
    
    res.json({
      status: connectionTest.success ? 'connected' : 'disconnected',
      message: connectionTest.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Disconnect from TimeSheet Mobile
router.post('/disconnect', async (req, res) => {
  try {
    await timesheetService.disconnect();
    res.json({ message: 'Disconnected from TimeSheet Mobile successfully' });
  } catch (error) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;
