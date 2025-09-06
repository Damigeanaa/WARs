import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import timesheetAPI, { type ConnectionStatus, type Employee, type Job } from '@/services/timesheetAPI';
import { 
  Clock, 
  Users, 
  Briefcase, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  Download,
  Upload,
  Calendar,
  BarChart3
} from 'lucide-react';

const TimesheetIntegrationPage: React.FC = () => {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState({
    connection: false,
    auth: false,
    employees: false,
    jobs: false,
    sync: false
  });

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setLoading(prev => ({ ...prev, connection: true }));
    try {
      const status = await timesheetAPI.checkConnection();
      setConnectionStatus(status);
      
      if (status.authenticated) {
        await loadData();
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to check TimeSheet Mobile connection",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, connection: false }));
    }
  };

  const loadData = async () => {
    try {
      setLoading(prev => ({ ...prev, employees: true, jobs: true }));
      
      const [employeesData, jobsData] = await Promise.all([
        timesheetAPI.getEmployees(),
        timesheetAPI.getJobs()
      ]);
      
      setEmployees(employeesData);
      setJobs(jobsData);
    } catch (error) {
      toast({
        title: "Data Loading Error",
        description: "Failed to load data from TimeSheet Mobile",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, employees: false, jobs: false }));
    }
  };

  const handleAuth = async () => {
    setLoading(prev => ({ ...prev, auth: true }));
    try {
      await timesheetAPI.initiateAuth();
      toast({
        title: "Authentication Successful",
        description: "Successfully connected to TimeSheet Mobile",
      });
      await checkConnection();
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "Failed to authenticate",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, auth: false }));
    }
  };

  const handleDisconnect = async () => {
    try {
      await timesheetAPI.disconnect();
      setConnectionStatus(null);
      setEmployees([]);
      setJobs([]);
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from TimeSheet Mobile",
      });
    } catch (error) {
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect from TimeSheet Mobile",
        variant: "destructive",
      });
    }
  };

  const handleSyncEmployees = async () => {
    setLoading(prev => ({ ...prev, sync: true }));
    try {
      const result = await timesheetAPI.syncEmployees();
      toast({
        title: "Sync Complete",
        description: `Synced ${result.synced} employees. ${result.errors.length} errors.`,
      });
      await loadData();
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync employees",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, sync: false }));
    }
  };

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'connected':
        return 'default';
      case 'disconnected':
        return 'secondary';
      default:
        return 'destructive';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">TimeSheet Mobile Integration</h1>
          <p className="text-muted-foreground">
            Manage your TimeSheet Mobile API connection and sync data
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={checkConnection}
          disabled={loading.connection}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading.connection ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Current status of your TimeSheet Mobile API connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {connectionStatus && getStatusIcon(connectionStatus.status)}
              <span className="font-medium">
                {connectionStatus ? connectionStatus.status.charAt(0).toUpperCase() + connectionStatus.status.slice(1) : 'Unknown'}
              </span>
              {connectionStatus && (
                <Badge variant={getStatusColor(connectionStatus.status)}>
                  {connectionStatus.authenticated ? 'Authenticated' : 'Not Authenticated'}
                </Badge>
              )}
            </div>
            
            {connectionStatus?.authenticated ? (
              <Button variant="destructive" onClick={handleDisconnect}>
                Disconnect
              </Button>
            ) : (
              <Button onClick={handleAuth} disabled={loading.auth}>
                {loading.auth ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Connect to TimeSheet Mobile
              </Button>
            )}
          </div>
          
          {connectionStatus?.message && (
            <p className="text-sm text-muted-foreground">{connectionStatus.message}</p>
          )}
          
          {connectionStatus?.timestamp && (
            <p className="text-xs text-muted-foreground">
              Last checked: {new Date(connectionStatus.timestamp).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Data Overview */}
      {connectionStatus?.authenticated && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading.employees ? (
                  <RefreshCw className="h-6 w-6 animate-spin" />
                ) : (
                  employees.length
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Total employees in TimeSheet Mobile
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading.jobs ? (
                  <RefreshCw className="h-6 w-6 animate-spin" />
                ) : (
                  jobs.length
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Active jobs available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                No sync performed yet
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      {connectionStatus?.authenticated && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Perform common TimeSheet Mobile operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button 
                variant="outline" 
                onClick={handleSyncEmployees}
                disabled={loading.sync}
                className="flex items-center gap-2"
              >
                {loading.sync ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Sync Employees
              </Button>

              <Button 
                variant="outline" 
                onClick={loadData}
                disabled={loading.employees || loading.jobs}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Refresh Data
              </Button>

              <Button 
                variant="outline" 
                disabled
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                View Schedules
              </Button>

              <Button 
                variant="outline" 
                disabled
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Generate Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee List */}
      {connectionStatus?.authenticated && employees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Employees</CardTitle>
            <CardDescription>
              Latest employees from TimeSheet Mobile (showing first 10)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {employees.slice(0, 10).map((employee) => (
                <div key={employee.employee_number} className="flex items-center justify-between p-2 rounded border">
                  <div>
                    <p className="font-medium">
                      {employee.employee_first_name} {employee.employee_last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {employee.employee_number} • {employee.email}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {Array.isArray(employee.workgroup) ? employee.workgroup.join(', ') : employee.workgroup}
                  </Badge>
                </div>
              ))}
              {employees.length > 10 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  ... and {employees.length - 10} more employees
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TimesheetIntegrationPage;
