import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface Employee {
  employee_number: string;
  employee_first_name: string;
  employee_last_name: string;
  employee_phone: string;
  email: string;
  workgroup: string[] | string;
  manager: string;
  employee_hired_date: string;
  location_option?: string;
  payroll_item?: string;
}

interface Job {
  job_number: string;
  job_name: string;
  job_description: string;
  job_location: string;
  job_start_date: string;
  job_end_date: string;
  job_status: string;
}

interface Schedule {
  employee_number: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  job_number: string;
  location: string;
  notes?: string;
}

interface TimesheetReport {
  employee_number: string;
  date: string;
  start_time: string;
  end_time: string;
  job_number: string;
  total_hours: number;
  break_hours: number;
  notes?: string;
}

interface AuthStatus {
  authenticated: boolean;
  message?: string;
}

interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'error';
  authenticated: boolean;
  message?: string;
  timestamp: string;
}

class TimesheetAPIService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api/timesheet`;
  }

  // Authentication
  async getAuthUrl(): Promise<string> {
    try {
      const response = await axios.get(`${this.baseURL}/auth/url`);
      return response.data.authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      throw new Error('Failed to get authorization URL');
    }
  }

  async handleAuthCallback(code: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseURL}/auth/callback`, { code });
      return response.data.success;
    } catch (error) {
      console.error('Error handling auth callback:', error);
      throw new Error('Authentication failed');
    }
  }

  async getAuthStatus(): Promise<AuthStatus> {
    try {
      const response = await axios.get(`${this.baseURL}/auth/status`);
      return response.data;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return { authenticated: false, message: 'Failed to check authentication status' };
    }
  }

  async disconnect(): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/disconnect`);
    } catch (error) {
      console.error('Error disconnecting:', error);
      throw new Error('Failed to disconnect');
    }
  }

  // Employee management
  async getEmployees(): Promise<Employee[]> {
    try {
      const response = await axios.get(`${this.baseURL}/employees`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw new Error('Failed to fetch employees');
    }
  }

  async getEmployee(employeeNumber: string): Promise<Employee | null> {
    try {
      const response = await axios.get(`${this.baseURL}/employees/${employeeNumber}`);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      console.error(`Error fetching employee ${employeeNumber}:`, error);
      throw new Error('Failed to fetch employee');
    }
  }

  async createEmployee(employee: Partial<Employee>): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/employees`, employee);
    } catch (error) {
      console.error('Error creating employee:', error);
      throw new Error('Failed to create employee');
    }
  }

  async updateEmployee(employeeNumber: string, employee: Partial<Employee>): Promise<void> {
    try {
      await axios.put(`${this.baseURL}/employees/${employeeNumber}`, employee);
    } catch (error) {
      console.error(`Error updating employee ${employeeNumber}:`, error);
      throw new Error('Failed to update employee');
    }
  }

  async deleteEmployee(employeeNumber: string): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/employees/${employeeNumber}`);
    } catch (error) {
      console.error(`Error deleting employee ${employeeNumber}:`, error);
      throw new Error('Failed to delete employee');
    }
  }

  // Job management
  async getJobs(): Promise<Job[]> {
    try {
      const response = await axios.get(`${this.baseURL}/jobs`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw new Error('Failed to fetch jobs');
    }
  }

  // Schedule management
  async getSchedules(params: {
    from_date: string;
    to_date: string;
  }): Promise<Schedule[]> {
    try {
      const response = await axios.get(`${this.baseURL}/schedules`, { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching schedules:', error);
      throw new Error('Failed to fetch schedules');
    }
  }

  async createSchedule(schedule: Schedule): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/schedules`, schedule);
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw new Error('Failed to create schedule');
    }
  }

  // Reporting
  async getTimesheetReport(params: {
    from_date: string;
    to_date: string;
    employee_number?: string;
  }): Promise<TimesheetReport[]> {
    try {
      const response = await axios.get(`${this.baseURL}/reports/timesheet`, { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching timesheet report:', error);
      throw new Error('Failed to fetch timesheet report');
    }
  }

  async getScheduleVsActualReport(params: {
    from_date: string;
    to_date: string;
  }): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/reports/schedule-vs-actual`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching schedule vs actual report:', error);
      throw new Error('Failed to fetch schedule vs actual report');
    }
  }

  // Sync operations
  async syncEmployees(): Promise<{ synced: number; errors: string[] }> {
    try {
      const response = await axios.post(`${this.baseURL}/sync/employees`);
      return {
        synced: response.data.synced,
        errors: response.data.errors || []
      };
    } catch (error) {
      console.error('Error syncing employees:', error);
      throw new Error('Failed to sync employees');
    }
  }

  // Health check
  async checkConnection(): Promise<ConnectionStatus> {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return response.data;
    } catch (error) {
      console.error('Connection check failed:', error);
      return {
        status: 'error',
        authenticated: false,
        message: 'Connection check failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Helper methods
  async isConnected(): Promise<boolean> {
    try {
      const status = await this.checkConnection();
      return status.status === 'connected' && status.authenticated;
    } catch (error) {
      return false;
    }
  }

  // OAuth flow helpers
  initiateAuth(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const authUrl = await this.getAuthUrl();
        
        // Open OAuth window
        const popup = window.open(
          authUrl,
          'timesheet_auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          reject(new Error('Popup blocked. Please allow popups for this site.'));
          return;
        }

        // Listen for auth completion
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            // Check if auth was successful
            this.getAuthStatus().then(status => {
              if (status.authenticated) {
                resolve();
              } else {
                reject(new Error('Authentication was cancelled or failed'));
              }
            }).catch(reject);
          }
        }, 1000);

        // Listen for auth success message
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'TIMESHEET_AUTH_SUCCESS') {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener('message', messageHandler);
            resolve();
          } else if (event.data.type === 'TIMESHEET_AUTH_ERROR') {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener('message', messageHandler);
            reject(new Error(event.data.message || 'Authentication failed'));
          }
        };

        window.addEventListener('message', messageHandler);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Format dates for API
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Parse API dates
  parseDate(dateString: string): Date {
    return new Date(dateString);
  }
}

export default new TimesheetAPIService();
export type { 
  Employee, 
  Job, 
  Schedule, 
  TimesheetReport, 
  AuthStatus, 
  ConnectionStatus 
};
