export interface SystemHealthResponse {
  status: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  jvm: JvmHealthResponse;
  database: DatabaseHealthResponse;
  redis: ComponentHealthResponse;
  version: string;
  environment: string;
}

export interface JvmHealthResponse {
  memoryUsedMb: number;
  memoryMaxMb: number;
  memoryUsagePercent: number;
  availableProcessors: number;
}

export interface DatabaseHealthResponse {
  status: string;
  activeConnections: number;
  idleConnections: number;
  maxConnections: number;
  utilizationPercent: number;
}

export interface ComponentHealthResponse {
  status: string;
}

export interface ScheduledJobResponse {
  name: string;
  description: string;
  schedule: string;
  lastRunAt: string | null;
  isRunning: boolean;
  lockedBy: string | null;
}

export interface ErrorSummaryResponse {
  last24Hours: ErrorCounts;
  last7Days: ErrorCounts;
  last30Days: ErrorCounts;
  topErrors: ErrorTypeCount[];
}

export interface ErrorCounts {
  total: number;
  serverErrors: number;
  clientErrors: number;
}

export interface ErrorTypeCount {
  type: string;
  count: number;
  lastOccurred: string | null;
}
