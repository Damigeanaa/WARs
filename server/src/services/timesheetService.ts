import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { dbRun, dbGet, dbAll } from '../database/database.js'

interface TimesheetConfig {
  clientId: string
  clientSecret: string
  instanceName: string
  redirectUri: string
  baseUrl: string
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

interface Employee {
  employee_number: string
  employee_first_name: string
  employee_last_name: string
  employee_phone: string
  email: string
  workgroup: string[] | string
  manager: string
  employee_hired_date: string
  location_option?: string
  payroll_item?: string
}

interface Schedule {
  schedule_id: string
  emp_id: string
  job_id: string
  task_id: string
  start_date: string
  end_datetime: string
  hours_count: string
  status: string
  event_info?: string
}

interface Job {
  job_number: string
  job_name: string
  job_phone: string
  service_item: string
  billable: string
  street: string
  city: string
  state: string
  latitude: string
  longitude: string
}

interface TimesheetReport {
  employee_number: string
  employee_name: string
  date_time_in: string
  date_time_out: string
  job_number: string
  job_name: string
  duration: string
  workgroup_name: string[]
}

class TimesheetMobileService {
  private config: TimesheetConfig
  private apiClient: AxiosInstance
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private tokenExpiry: Date | null = null

  constructor() {
    this.config = {
      clientId: 'kingzqua2z1',
      clientSecret: 'df97a0e1e73850e3915101a3217bbc2bbc01c149',
      instanceName: 'kingzqua2z1',
      redirectUri: 'http://localhost:3001/api/timesheet/callback',
      baseUrl: 'https://eu.timesheetmobile.com'
    }

    this.apiClient = axios.create({
      baseURL: `${this.config.baseUrl}/${this.config.instanceName}/oauth`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    // Load saved tokens from database
    this.loadTokensFromDB()
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state: string = 'GSLV'): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      state: state
    })

    return `${this.config.baseUrl}/${this.config.instanceName}/oauth/connect.php?${params.toString()}`
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
    try {
      const response = await axios.post(`${this.config.baseUrl}/${this.config.instanceName}/oauth/token.php`, new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri
      }))

      const tokens = response.data as TokenResponse
      await this.saveTokens(tokens)
      return tokens
    } catch (error) {
      console.error('Error exchanging code for tokens:', error)
      throw new Error('Failed to exchange authorization code for tokens')
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<TokenResponse> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await axios.post(`${this.config.baseUrl}/${this.config.instanceName}/oauth/token.php`, new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri
      }))

      const tokens = response.data as TokenResponse
      await this.saveTokens(tokens)
      return tokens
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw new Error('Failed to refresh access token')
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || (this.tokenExpiry && new Date() >= this.tokenExpiry)) {
      await this.refreshAccessToken()
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeAuthenticatedRequest<T>(endpoint: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', data?: any): Promise<T> {
    await this.ensureValidToken()

    const config = {
      method,
      url: endpoint,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      },
      ...(data && { data })
    }

    const response = await this.apiClient.request(config)
    return response.data
  }

  /**
   * Save tokens to database
   */
  private async saveTokens(tokens: TokenResponse): Promise<void> {
    this.accessToken = tokens.access_token
    this.refreshToken = tokens.refresh_token
    this.tokenExpiry = new Date(Date.now() + (tokens.expires_in * 1000))

    await dbRun(`
      INSERT OR REPLACE INTO timesheet_tokens (id, access_token, refresh_token, expires_at)
      VALUES (1, ?, ?, ?)
    `, [this.accessToken, this.refreshToken, this.tokenExpiry.toISOString()])
  }

  /**
   * Load tokens from database
   */
  private async loadTokensFromDB(): Promise<void> {
    try {
      const tokenData = await dbGet('SELECT * FROM timesheet_tokens WHERE id = 1')
      if (tokenData) {
        this.accessToken = tokenData.access_token
        this.refreshToken = tokenData.refresh_token
        this.tokenExpiry = new Date(tokenData.expires_at)
      }
    } catch (error) {
      console.log('No saved tokens found')
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.makeAuthenticatedRequest<any>('/')
      return {
        success: true,
        message: result.message || 'Connection successful'
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  }

  /**
   * Get all employees
   */
  async getEmployees(): Promise<Employee[]> {
    const result = await this.makeAuthenticatedRequest<{ data: Employee[] }>('/employee/list')
    return result.data
  }

  /**
   * Get single employee by number
   */
  async getEmployee(employeeNumber: string): Promise<Employee> {
    const result = await this.makeAuthenticatedRequest<{ data: Employee }>(`/employee/${employeeNumber}`)
    return result.data
  }

  /**
   * Create new employee
   */
  async createEmployee(employeeData: Partial<Employee>): Promise<void> {
    const formData = new URLSearchParams()
    if (employeeData.employee_first_name) formData.append('first_name', employeeData.employee_first_name)
    if (employeeData.employee_last_name) formData.append('last_name', employeeData.employee_last_name)
    if (employeeData.employee_phone) formData.append('phone_num', employeeData.employee_phone)
    if (employeeData.email) formData.append('email', employeeData.email)
    if (employeeData.employee_hired_date) formData.append('hireDate', employeeData.employee_hired_date)
    if (employeeData.workgroup && Array.isArray(employeeData.workgroup)) {
      formData.append('workgroup', employeeData.workgroup.join(','))
    } else if (typeof employeeData.workgroup === 'string') {
      formData.append('workgroup', employeeData.workgroup)
    }

    await this.makeAuthenticatedRequest('/employee/add', 'POST', formData)
  }

  /**
   * Update employee
   */
  async updateEmployee(employeeNumber: string, employeeData: Partial<Employee>): Promise<void> {
    const formData = new URLSearchParams()
    if (employeeData.employee_first_name) formData.append('first_name', employeeData.employee_first_name)
    if (employeeData.employee_last_name) formData.append('last_name', employeeData.employee_last_name)
    if (employeeData.employee_phone) formData.append('phone_num', employeeData.employee_phone)
    if (employeeData.email) formData.append('email', employeeData.email)

    await this.makeAuthenticatedRequest(`/employee/update/${employeeNumber}`, 'POST', formData)
  }

  /**
   * Delete employee
   */
  async deleteEmployee(employeeNumber: string): Promise<void> {
    await this.makeAuthenticatedRequest(`/employee/delete/${employeeNumber}`, 'DELETE')
  }

  /**
   * Get all jobs
   */
  async getJobs(): Promise<Job[]> {
    const result = await this.makeAuthenticatedRequest<{ data: Job[] }>('/job/list')
    return result.data
  }

  /**
   * Get schedules for date range
   */
  async getSchedules(fromDate: string, toDate: string): Promise<Schedule[]> {
    const result = await this.makeAuthenticatedRequest<{ data: Schedule[] }>(`/schedule/list?from_date=${fromDate}&to_date=${toDate}`)
    return result.data
  }

  /**
   * Create schedule
   */
  async createSchedule(scheduleData: {
    emp_id: string
    job_id?: string
    task_id?: string
    start_date: string
    end_date: string
  }): Promise<void> {
    const formData = new URLSearchParams()
    formData.append('emp_id', scheduleData.emp_id)
    formData.append('start_date', scheduleData.start_date)
    formData.append('end_date', scheduleData.end_date)
    if (scheduleData.job_id) formData.append('job_id', scheduleData.job_id)
    if (scheduleData.task_id) formData.append('task_id', scheduleData.task_id)

    await this.makeAuthenticatedRequest('/schedule/add', 'POST', formData)
  }

  /**
   * Get timesheet reports
   */
  async getTimesheetReport(fromDate: string, toDate: string, employeeNumber?: string): Promise<TimesheetReport[]> {
    const formData = new URLSearchParams()
    formData.append('from_date', fromDate)
    formData.append('to_date', toDate)
    if (employeeNumber) formData.append('emp_num', employeeNumber)

    const result = await this.makeAuthenticatedRequest<{ data: TimesheetReport[] }>('/report', 'POST', formData)
    return result.data
  }

  /**
   * Get schedule vs actual report
   */
  async getScheduleVsActualReport(fromDate: string, toDate: string): Promise<{
    scheduled_logs: any[]
    unscheduled_logs: any[]
  }> {
    const formData = new URLSearchParams()
    formData.append('from_date', fromDate)
    formData.append('to_date', toDate)

    return await this.makeAuthenticatedRequest('/schedule_vs_actual', 'POST', formData)
  }

  /**
   * Sync employees from TimeSheet Mobile to local database
   */
  async syncEmployees(): Promise<{ synced: number; errors: string[] }> {
    try {
      const employees = await this.getEmployees()
      let synced = 0
      const errors: string[] = []

      for (const emp of employees) {
        try {
          // Check if employee already exists in our database
          const existing = await dbGet('SELECT id FROM drivers WHERE email = ?', [emp.email])
          
          if (!existing) {
            // Create new driver in our system
            await dbRun(`
              INSERT INTO drivers (
                driver_id, name, email, phone, license_number, 
                join_date, employment_type, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              emp.employee_number,
              `${emp.employee_first_name} ${emp.employee_last_name}`,
              emp.email,
              emp.employee_phone,
              `TSM-${emp.employee_number}`, // Generate license number
              emp.employee_hired_date,
              'Fulltime',
              'Active'
            ])
            synced++
          }
        } catch (error) {
          errors.push(`Failed to sync employee ${emp.employee_number}: ${error}`)
        }
      }

      return { synced, errors }
    } catch (error) {
      throw new Error(`Failed to sync employees: ${error}`)
    }
  }

  /**
   * Disconnect/revoke token
   */
  async disconnect(): Promise<void> {
    if (!this.refreshToken) return

    try {
      await axios.post(`${this.config.baseUrl}/${this.config.instanceName}/oauth/disconnect`, new URLSearchParams({
        refresh_token: this.refreshToken
      }), {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      // Clear tokens from database
      await dbRun('DELETE FROM timesheet_tokens WHERE id = 1')
      
      this.accessToken = null
      this.refreshToken = null
      this.tokenExpiry = null
    } catch (error) {
      console.error('Error disconnecting:', error)
    }
  }
}

export default new TimesheetMobileService()
