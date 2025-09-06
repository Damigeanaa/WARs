import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { 
  Settings,
  Globe,
  Save,
  RefreshCw,
  Shield,
  Database,
  Bell,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Server,
  Wifi,
  Zap,
  HardDrive,
  Activity,
  Calendar,
  Users,
  UserCheck
} from 'lucide-react';

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

const ProjectSettingsPage: React.FC = () => {
  const { toast } = useToast();
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [systemStatus] = useState({
    database: { status: 'connected', lastCheck: new Date() },
    api: { status: 'operational', lastCheck: new Date() },
    timesheet: { status: 'disconnected', lastCheck: new Date() },
    storage: { status: 'healthy', usage: 65 }
  });
  const [settings, setSettings] = useState<ProjectSettings>({
    // System Settings
    enableNotifications: true,
    enableAuditLogs: true,
    autoBackup: true,
    backupFrequency: 'daily',
    systemMaintenanceMode: false,
    darkModeEnabled: false,
    
    // Security Settings
    requireTwoFactor: false,
    passwordExpiration: 90,
    maxLoginAttempts: 5,
    
    // Driver Management Settings
    defaultVacationDays: 25,
    defaultVacationDaysMinijob: 20,
    defaultVacationDaysFulltime: 30,
    warningExpirationDays: 365,
    requireProfilePictures: false,
    enableSelfServiceHolidays: true,
    autoApproveHolidays: false,
    maxHolidayRequestDays: 30,
    
    // Integration Settings
    timesheetIntegrationEnabled: true,
    apiRateLimit: 1000,
    sessionTimeout: 60,
    enableDataSync: true,
    
    // Performance Settings
    cacheExpiration: 3600,
    maxFileUploadSize: 10,
    enableCompression: true,
  });

  // Load settings from API on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const apiSettings = await response.json();
          setSettings(prev => ({ ...prev, ...apiSettings }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings from server.",
          variant: "destructive",
        });
      }
    };

    loadSettings();
  }, [toast]);

  const handleInputChange = (field: keyof ProjectSettings, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `project-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Settings Exported",
      description: "Settings have been exported successfully.",
    });
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings(importedSettings);
        toast({
          title: "Settings Imported",
          description: "Settings have been imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid settings file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'disconnected':
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      toast({
        title: "Settings Saved",
        description: "Project settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save project settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      const response = await fetch('/api/settings/reset', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset settings');
      }

      // Reload settings from API
      const settingsResponse = await fetch('/api/settings');
      if (settingsResponse.ok) {
        const apiSettings = await settingsResponse.json();
        setSettings(prev => ({ ...prev, ...apiSettings }));
      }
      
      toast({
        title: "Settings Reset",
        description: "All settings have been reset to default values.",
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkUpdateVacationDays = async () => {
    try {
      setIsUpdating(true);
      
      const response = await fetch('/api/drivers/bulk-update-vacation-days', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update vacation days');
      }

      const result = await response.json();
      
      toast({
        title: "Vacation Days Updated",
        description: `Successfully updated vacation days for ${result.updated.total} drivers (${result.updated.minijob} Minijob, ${result.updated.fulltime} Fulltime)`,
      });
    } catch (error) {
      console.error('Error updating vacation days:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update vacation days. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900">Project Settings</h1>
                <p className="text-slate-600 text-lg mt-1">
                  Configure your system preferences and manage integrations
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportSettings}
                  className="hidden"
                  id="import-settings"
                  aria-label="Import settings file"
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('import-settings')?.click()}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
              <Button 
                variant="outline" 
                onClick={handleExportSettings}
                className="border-green-200 text-green-600 hover:bg-green-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={loading} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* System Status Overview */}
        <Card className="shadow-xl border-slate-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription className="text-green-100">
              Real-time system health and performance monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                {getStatusIcon(systemStatus.database.status)}
                <div>
                  <div className="font-semibold text-slate-900">Database</div>
                  <div className="text-sm text-slate-600 capitalize">{systemStatus.database.status}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                {getStatusIcon(systemStatus.api.status)}
                <div>
                  <div className="font-semibold text-slate-900">API Server</div>
                  <div className="text-sm text-slate-600 capitalize">{systemStatus.api.status}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200">
                {getStatusIcon(systemStatus.timesheet.status)}
                <div>
                  <div className="font-semibold text-slate-900">TimeSheet API</div>
                  <div className="text-sm text-slate-600 capitalize">{systemStatus.timesheet.status}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <HardDrive className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="font-semibold text-slate-900">Storage</div>
                  <div className="text-sm text-slate-600">{systemStatus.storage.usage}% used</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="shadow-xl border-slate-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Configuration
            </CardTitle>
            <CardDescription className="text-blue-100">
              Core system settings and operational preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Language Selector */}
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-indigo-600" />
                    <Label className="font-semibold text-slate-900">{t('settings.language')}</Label>
                  </div>
                </div>
                <Select value={currentLanguage} onValueChange={changeLanguage}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('settings.selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.nativeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-600 mt-2">{t('settings.languageDescription')}</p>
              </div>

              {/* Notifications */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-amber-600" />
                    <Label className="font-semibold text-slate-900">Notifications</Label>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings.enableNotifications}
                      onChange={(e) => handleInputChange('enableNotifications', e.target.checked)}
                      className="sr-only"
                      id="notifications-toggle"
                      aria-label="Enable notifications"
                    />
                    <label
                      htmlFor="notifications-toggle"
                      className={`flex items-center cursor-pointer w-12 h-6 rounded-full transition-colors duration-200 ${
                        settings.enableNotifications ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                          settings.enableNotifications ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </label>
                  </div>
                </div>
                <p className="text-sm text-slate-600">Enable system-wide notifications and alerts</p>
              </div>

              {/* Audit Logs */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    <Label className="font-semibold text-slate-900">Audit Logging</Label>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings.enableAuditLogs}
                      onChange={(e) => handleInputChange('enableAuditLogs', e.target.checked)}
                      className="sr-only"
                      id="audit-toggle"
                      aria-label="Enable audit logging"
                    />
                    <label
                      htmlFor="audit-toggle"
                      className={`flex items-center cursor-pointer w-12 h-6 rounded-full transition-colors duration-200 ${
                        settings.enableAuditLogs ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                          settings.enableAuditLogs ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </label>
                  </div>
                </div>
                <p className="text-sm text-slate-600">Track all system activities and changes</p>
              </div>

              {/* Auto Backup */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <Label className="font-semibold text-slate-900">Auto Backup</Label>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings.autoBackup}
                      onChange={(e) => handleInputChange('autoBackup', e.target.checked)}
                      className="sr-only"
                      id="backup-toggle"
                      aria-label="Enable auto backup"
                    />
                    <label
                      htmlFor="backup-toggle"
                      className={`flex items-center cursor-pointer w-12 h-6 rounded-full transition-colors duration-200 ${
                        settings.autoBackup ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                          settings.autoBackup ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </label>
                  </div>
                </div>
                <p className="text-sm text-slate-600">Automatically backup system data</p>
              </div>

              {/* Maintenance Mode */}
              <div className="p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-red-600" />
                    <Label className="font-semibold text-slate-900">Maintenance Mode</Label>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings.systemMaintenanceMode}
                      onChange={(e) => handleInputChange('systemMaintenanceMode', e.target.checked)}
                      className="sr-only"
                      id="maintenance-toggle"
                      aria-label="Enable maintenance mode"
                    />
                    <label
                      htmlFor="maintenance-toggle"
                      className={`flex items-center cursor-pointer w-12 h-6 rounded-full transition-colors duration-200 ${
                        settings.systemMaintenanceMode ? 'bg-red-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                          settings.systemMaintenanceMode ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </label>
                  </div>
                </div>
                <p className="text-sm text-slate-600">Enable system maintenance mode</p>
              </div>

              {/* Session Timeout */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <Label className="font-semibold text-slate-900">Session Timeout</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value) || 60)}
                    className="w-20 text-center border-purple-200 focus:border-purple-500"
                    min="15"
                    max="480"
                  />
                  <span className="text-sm text-slate-600">minutes</span>
                </div>
              </div>

              {/* Cache Expiration */}
              <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-200">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-teal-600" />
                  <Label className="font-semibold text-slate-900">Cache Expiration</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.cacheExpiration}
                    onChange={(e) => handleInputChange('cacheExpiration', parseInt(e.target.value) || 3600)}
                    className="w-24 text-center border-teal-200 focus:border-teal-500"
                    min="300"
                    max="86400"
                  />
                  <span className="text-sm text-slate-600">seconds</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Settings */}
        <Card className="shadow-xl border-slate-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Integration Settings
            </CardTitle>
            <CardDescription className="text-cyan-100">
              External API integrations and connectivity
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-blue-600" />
                    <Label className="font-semibold text-slate-900">TimeSheet Mobile</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.timesheetIntegrationEnabled}
                        onChange={(e) => handleInputChange('timesheetIntegrationEnabled', e.target.checked)}
                        className="sr-only"
                        id="timesheet-toggle"
                        aria-label="Enable timesheet integration"
                      />
                      <label
                        htmlFor="timesheet-toggle"
                        className={`flex items-center cursor-pointer w-12 h-6 rounded-full transition-colors duration-200 ${
                          settings.timesheetIntegrationEnabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                            settings.timesheetIntegrationEnabled ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </label>
                    </div>
                    <Badge variant={settings.timesheetIntegrationEnabled ? "default" : "secondary"}>
                      {settings.timesheetIntegrationEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-slate-600">Enable TimeSheet Mobile API integration</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-600" />
                    <Label className="font-semibold text-slate-900">Data Sync</Label>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings.enableDataSync}
                      onChange={(e) => handleInputChange('enableDataSync', e.target.checked)}
                      className="sr-only"
                      id="sync-toggle"
                      aria-label="Enable data sync"
                    />
                    <label
                      htmlFor="sync-toggle"
                      className={`flex items-center cursor-pointer w-12 h-6 rounded-full transition-colors duration-200 ${
                        settings.enableDataSync ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                          settings.enableDataSync ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </label>
                  </div>
                </div>
                <p className="text-sm text-slate-600">Enable automatic data synchronization</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <Label className="font-semibold text-slate-900">API Rate Limit</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.apiRateLimit}
                    onChange={(e) => handleInputChange('apiRateLimit', parseInt(e.target.value) || 1000)}
                    className="w-24 text-center border-purple-200 focus:border-purple-500"
                    min="100"
                    max="10000"
                  />
                  <span className="text-sm text-slate-600">requests/hour</span>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <HardDrive className="h-5 w-5 text-orange-600" />
                  <Label className="font-semibold text-slate-900">Max Upload Size</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.maxFileUploadSize}
                    onChange={(e) => handleInputChange('maxFileUploadSize', parseInt(e.target.value) || 10)}
                    className="w-20 text-center border-orange-200 focus:border-orange-500"
                    min="1"
                    max="100"
                  />
                  <span className="text-sm text-slate-600">MB</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Management Settings */}
        <Card className="shadow-xl border-slate-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Driver Management Settings
            </CardTitle>
            <CardDescription className="text-emerald-100">
              Configure driver policies and employment-specific settings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* General Default Vacation Days */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <Label className="font-semibold text-slate-900">Default Vacation Days</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.defaultVacationDays}
                    onChange={(e) => handleInputChange('defaultVacationDays', parseInt(e.target.value) || 25)}
                    className="w-20 text-center border-blue-200 focus:border-blue-500"
                    min="0"
                    max="50"
                  />
                  <span className="text-sm text-slate-600">days</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">General default for new drivers</p>
              </div>

              {/* Minijob Vacation Days */}
              <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="h-5 w-5 text-orange-600" />
                  <Label className="font-semibold text-slate-900">Minijob Vacation Days</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.defaultVacationDaysMinijob}
                    onChange={(e) => handleInputChange('defaultVacationDaysMinijob', parseInt(e.target.value) || 20)}
                    className="w-20 text-center border-orange-200 focus:border-orange-500"
                    min="0"
                    max="50"
                  />
                  <span className="text-sm text-slate-600">days</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Default for part-time workers</p>
              </div>

              {/* Fulltime Vacation Days */}
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <Label className="font-semibold text-slate-900">Fulltime Vacation Days</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.defaultVacationDaysFulltime}
                    onChange={(e) => handleInputChange('defaultVacationDaysFulltime', parseInt(e.target.value) || 30)}
                    className="w-20 text-center border-green-200 focus:border-green-500"
                    min="0"
                    max="50"
                  />
                  <span className="text-sm text-slate-600">days</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Default for full-time employees</p>
              </div>

              {/* Bulk Update Vacation Days */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  <Label className="font-semibold text-slate-900">Update Existing Drivers</Label>
                </div>
                <Button
                  onClick={handleBulkUpdateVacationDays}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Apply to All Drivers
                    </>
                  )}
                </Button>
                <p className="text-xs text-slate-500 mt-2">Update all existing drivers' vacation days based on their employment type</p>
              </div>

              {/* Warning Expiration */}
              <div className="p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <Label className="font-semibold text-slate-900">Warning Expiration</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.warningExpirationDays}
                    onChange={(e) => handleInputChange('warningExpirationDays', parseInt(e.target.value) || 365)}
                    className="w-20 text-center border-red-200 focus:border-red-500"
                    min="30"
                    max="730"
                  />
                  <span className="text-sm text-slate-600">days</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">How long warnings remain active</p>
              </div>

              {/* Profile Pictures Required */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <Label className="font-semibold text-slate-900">Profile Pictures</Label>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings.requireProfilePictures}
                      onChange={(e) => handleInputChange('requireProfilePictures', e.target.checked)}
                      className="sr-only"
                      id="profile-pics-toggle"
                      aria-label="Require profile pictures"
                    />
                    <label
                      htmlFor="profile-pics-toggle"
                      className={`flex items-center cursor-pointer w-12 h-6 rounded-full transition-colors duration-200 ${
                        settings.requireProfilePictures ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                          settings.requireProfilePictures ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </label>
                  </div>
                </div>
                <p className="text-sm text-slate-600">Require profile pictures for all drivers</p>
              </div>

              {/* Self-Service Holidays */}
              <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-teal-600" />
                    <Label className="font-semibold text-slate-900">Self-Service Holidays</Label>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings.enableSelfServiceHolidays}
                      onChange={(e) => handleInputChange('enableSelfServiceHolidays', e.target.checked)}
                      className="sr-only"
                      id="self-service-toggle"
                      aria-label="Enable self-service holidays"
                    />
                    <label
                      htmlFor="self-service-toggle"
                      className={`flex items-center cursor-pointer w-12 h-6 rounded-full transition-colors duration-200 ${
                        settings.enableSelfServiceHolidays ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                          settings.enableSelfServiceHolidays ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </label>
                  </div>
                </div>
                <p className="text-sm text-slate-600">Allow drivers to request holidays</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectSettingsPage;
