import { useQuery } from '@tanstack/react-query';

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

const fetchSettings = async (): Promise<ProjectSettings> => {
  const response = await fetch('/api/settings');
  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }
  return response.json();
};

export const useProjectSettings = () => {
  return useQuery({
    queryKey: ['project-settings'],
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time)
  });
};

export type { ProjectSettings };
