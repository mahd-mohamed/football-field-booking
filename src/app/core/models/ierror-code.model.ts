export interface IErrorCode {
  code: number;
  message: string;
}

export interface IApiErrorResponse {
  code: number;
  message: string;
  timestamp?: string;
  path?: string;
}

export interface IErrorNotification {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  code?: number;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

// Error categories based on your backend ErrorCode enum
export enum ErrorCategory {
  USER = 'USER',
  TEAM = 'TEAM',
  TEAM_MEMBER = 'TEAM_MEMBER',
  PLACE = 'PLACE',
  BOOKING = 'BOOKING',
  MATCH_PARTICIPANT = 'MATCH_PARTICIPANT',
  REQUEST = 'REQUEST',
  GENERIC = 'GENERIC'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface IErrorDetails {
  code: number;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  userFriendlyMessage: string;
  canRetry: boolean;
  requiresAuth: boolean;
}
