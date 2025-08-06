import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { ErrorHandlerService } from '../services/error-handler.service';
import { IErrorDetails } from '../models/ierror-code.model';

@Injectable({
  providedIn: 'root'
})
export class ErrorUtils {

  constructor(private errorHandler: ErrorHandlerService) {}

  /**
   * Create a catchError operator that handles errors through the error handler service
   */
  handleError<T>() {
    return (error: any): Observable<T> => {
      this.errorHandler.handleApiError(error);
      return throwError(() => error);
    };
  }

  /**
   * Handle error in a component and return error details
   */
  handleComponentError(error: any): IErrorDetails {
    return this.errorHandler.handleApiError(error);
  }

  /**
   * Show a success notification
   */
  showSuccess(message: string): void {
    this.errorHandler.showSuccessNotification(message);
  }

  /**
   * Show a warning notification
   */
  showWarning(message: string): void {
    this.errorHandler.showWarningNotification(message);
  }

  /**
   * Show an info notification
   */
  showInfo(message: string): void {
    this.errorHandler.showInfoNotification(message);
  }

  /**
   * Show an error notification
   */
  showErrorNotification(errorDetails: IErrorDetails): void {
    this.errorHandler.showErrorNotification(errorDetails);
  }

  /**
   * Check if an error requires authentication
   */
  isAuthError(error: any): boolean {
    const errorCode = this.extractErrorCode(error);
    return this.errorHandler['errorMappingService'].isAuthError(errorCode);
  }

  /**
   * Check if an error can be retried
   */
  canRetryError(error: any): boolean {
    const errorCode = this.extractErrorCode(error);
    return this.errorHandler['errorMappingService'].canRetryError(errorCode);
  }

  /**
   * Extract error code from various error formats
   */
  private extractErrorCode(error: any): number {
    if (error?.error?.code) {
      return error.error.code;
    } else if (error?.code) {
      return error.code;
    } else if (error?.status) {
      return error.status;
    }
    return 905; // Default to internal error
  }

  /**
   * Create a safe HTTP request with error handling
   */
  createSafeRequest<T>(request: Observable<T>): Observable<T> {
    return request.pipe(
      catchError(this.handleError<T>())
    );
  }

  /**
   * Handle form validation errors
   */
  handleFormErrors(errors: any): void {
    if (errors && typeof errors === 'object') {
      Object.keys(errors).forEach(key => {
        const error = errors[key];
        if (error && error.message) {
          this.errorHandler.showErrorNotification({
            code: error.code || 902,
            message: error.message,
            category: 'GENERIC' as any,
            severity: 'MEDIUM' as any,
            userFriendlyMessage: error.message,
            canRetry: false,
            requiresAuth: false
          });
        }
      });
    }
  }

  /**
   * Clear all notifications
   */
  clearNotifications(): void {
    this.errorHandler.clearNotifications();
  }

  /**
   * Clear current errors
   */
  clearCurrentErrors(): void {
    this.errorHandler.clearCurrentErrors();
  }
} 