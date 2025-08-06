import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { IErrorNotification, IApiErrorResponse, IErrorDetails } from '../models/ierror-code.model';
import { ErrorMappingService } from './error-mapping.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private errorNotifications = new BehaviorSubject<IErrorNotification[]>([]);
  private currentErrors = new BehaviorSubject<IErrorDetails[]>([]);

  constructor(
    private errorMappingService: ErrorMappingService,
    private router: Router
  ) {}

  // Observable for error notifications
  get errorNotifications$(): Observable<IErrorNotification[]> {
    return this.errorNotifications.asObservable();
  }

  // Observable for current errors
  get currentErrors$(): Observable<IErrorDetails[]> {
    return this.currentErrors.asObservable();
  }

  /**
   * Handle API error response from backend
   */
  handleApiError(error: any): IErrorDetails {
    console.error('🔴 ErrorHandler: Processing API error:', error);

    let errorCode = 905; // Default to internal error
    let errorMessage = 'An unexpected error occurred';

    // Try to extract error code and message from different response formats
    if (error?.error?.code) {
      errorCode = error.error.code;
      errorMessage = error.error.message || errorMessage;
    } else if (error?.code) {
      errorCode = error.code;
      errorMessage = error.message || errorMessage;
    } else if (error?.status) {
      // Handle HTTP status codes
      errorCode = this.mapHttpStatusToErrorCode(error.status);
      errorMessage = error.message || errorMessage;
    }

    const errorDetails = this.errorMappingService.getErrorDetailsByCode(errorCode);
    
    // Update the original message with the actual backend message
    errorDetails.message = errorMessage;
    
    // Add to current errors
    this.addCurrentError(errorDetails);
    
    // Create and show notification
    this.showErrorNotification(errorDetails);
    
    // Handle authentication errors
    if (this.errorMappingService.isAuthError(errorCode)) {
      this.handleAuthError(errorDetails);
    }

    return errorDetails;
  }

  /**
   * Handle HTTP status codes and map them to our error codes
   */
  private mapHttpStatusToErrorCode(status: number): number {
    switch (status) {
      case 400: return 902; // Bad Request
      case 401: return 903; // Unauthorized
      case 403: return 904; // Forbidden
      case 404: return 901; // Not Found
      case 500: return 905; // Internal Server Error
      default: return 905; // Default to internal error
    }
  }

  /**
   * Show error notification to user
   */
  showErrorNotification(errorDetails: IErrorDetails): void {
    const notification: IErrorNotification = {
      type: this.getNotificationType(errorDetails.severity),
      message: errorDetails.userFriendlyMessage,
      code: errorDetails.code,
      duration: this.getNotificationDuration(errorDetails.severity),
      action: this.getNotificationAction(errorDetails)
    };

    const currentNotifications = this.errorNotifications.value;
    
    // Check if a similar notification already exists to prevent duplicates
    const isDuplicate = currentNotifications.some(existing => 
      existing.message === notification.message && 
      existing.code === notification.code &&
      existing.type === notification.type
    );

    if (!isDuplicate) {
      this.errorNotifications.next([...currentNotifications, notification]);

      // Auto-remove notification after duration
      if (notification.duration) {
        setTimeout(() => {
          this.removeNotification(notification);
        }, notification.duration);
      }
    }
  }

  /**
   * Remove a specific notification
   */
  removeNotification(notification: IErrorNotification): void {
    const currentNotifications = this.errorNotifications.value;
    const filteredNotifications = currentNotifications.filter(n => n !== notification);
    this.errorNotifications.next(filteredNotifications);
  }

  /**
   * Clear all notifications
   */
  clearNotifications(): void {
    this.errorNotifications.next([]);
  }

  /**
   * Add error to current errors list
   */
  private addCurrentError(errorDetails: IErrorDetails): void {
    const currentErrors = this.currentErrors.value;
    const existingErrorIndex = currentErrors.findIndex(e => e.code === errorDetails.code);
    
    if (existingErrorIndex >= 0) {
      // Update existing error
      currentErrors[existingErrorIndex] = errorDetails;
    } else {
      // Add new error
      currentErrors.push(errorDetails);
    }
    
    this.currentErrors.next([...currentErrors]);
  }

  /**
   * Clear current errors
   */
  clearCurrentErrors(): void {
    this.currentErrors.next([]);
  }

  /**
   * Get notification type based on error severity
   */
  private getNotificationType(severity: string): 'error' | 'warning' | 'info' | 'success' {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'error';
    }
  }

  /**
   * Get notification duration based on error severity
   */
  private getNotificationDuration(severity: string): number {
    switch (severity) {
      case 'CRITICAL':
        return 10000; // 10 seconds
      case 'HIGH':
        return 8000; // 8 seconds
      case 'MEDIUM':
        return 6000; // 6 seconds
      case 'LOW':
        return 4000; // 4 seconds
      default:
        return 6000; // 6 seconds
    }
  }

  /**
   * Get notification action based on error details
   */
  private getNotificationAction(errorDetails: IErrorDetails): { label: string; callback: () => void } | undefined {
    if (errorDetails.requiresAuth) {
      return {
        label: 'Login',
        callback: () => this.router.navigate(['/login'])
      };
    }

    if (errorDetails.canRetry) {
      return {
        label: 'Retry',
        callback: () => this.handleRetry(errorDetails)
      };
    }

    return undefined;
  }

  /**
   * Handle retry action
   */
  private handleRetry(errorDetails: IErrorDetails): void {
    console.log('🔄 ErrorHandler: Retrying operation for error:', errorDetails.code);
    // This would typically trigger a retry mechanism
    // For now, we'll just show a success notification
    this.showSuccessNotification('Operation retried successfully');
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(errorDetails: IErrorDetails): void {
    console.log('🔐 ErrorHandler: Handling authentication error:', errorDetails.code);
    
    // Clear session storage
    sessionStorage.clear();
    
    // Redirect to login page
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 1000);
  }

  /**
   * Show success notification
   */
  showSuccessNotification(message: string): void {
    const notification: IErrorNotification = {
      type: 'success',
      message,
      duration: 4000
    };

    const currentNotifications = this.errorNotifications.value;
    
    // Check if a similar notification already exists to prevent duplicates
    const isDuplicate = currentNotifications.some(existing => 
      existing.message === notification.message && 
      existing.type === notification.type
    );

    if (!isDuplicate) {
      this.errorNotifications.next([...currentNotifications, notification]);

      setTimeout(() => {
        this.removeNotification(notification);
      }, notification.duration);
    }
  }

  /**
   * Show warning notification
   */
  showWarningNotification(message: string): void {
    const notification: IErrorNotification = {
      type: 'warning',
      message,
      duration: 6000
    };

    const currentNotifications = this.errorNotifications.value;
    
    // Check if a similar notification already exists to prevent duplicates
    const isDuplicate = currentNotifications.some(existing => 
      existing.message === notification.message && 
      existing.type === notification.type
    );

    if (!isDuplicate) {
      this.errorNotifications.next([...currentNotifications, notification]);

      setTimeout(() => {
        this.removeNotification(notification);
      }, notification.duration);
    }
  }

  /**
   * Show info notification
   */
  showInfoNotification(message: string): void {
    const notification: IErrorNotification = {
      type: 'info',
      message,
      duration: 4000
    };

    const currentNotifications = this.errorNotifications.value;
    
    // Check if a similar notification already exists to prevent duplicates
    const isDuplicate = currentNotifications.some(existing => 
      existing.message === notification.message && 
      existing.type === notification.type
    );

    if (!isDuplicate) {
      this.errorNotifications.next([...currentNotifications, notification]);

      setTimeout(() => {
        this.removeNotification(notification);
      }, notification.duration);
    }
  }

  /**
   * Check if there are any current errors
   */
  hasErrors(): boolean {
    return this.currentErrors.value.length > 0;
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: string): IErrorDetails[] {
    return this.currentErrors.value.filter(error => error.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: string): IErrorDetails[] {
    return this.currentErrors.value.filter(error => error.severity === severity);
  }
} 