import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { ErrorHandlerService } from '../services/error-handler.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandlerService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('🔴 ErrorInterceptor: Caught HTTP error:', error);

      // Handle the error through our error handler service
      errorHandler.handleApiError(error);

      // Re-throw the error so other interceptors or components can handle it if needed
      return throwError(() => error);
    })
  );
}; 