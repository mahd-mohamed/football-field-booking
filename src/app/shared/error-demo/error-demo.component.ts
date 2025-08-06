import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ErrorUtils } from '../../core/utils/error-utils';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-error-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-demo-container">
      <h3>Error Handling Demo</h3>
      
      <div class="demo-buttons">
        <button class="btn btn-primary" (click)="testSuccess()">
          Test Success Notification
        </button>
        
        <button class="btn btn-warning" (click)="testWarning()">
          Test Warning Notification
        </button>
        
        <button class="btn btn-info" (click)="testInfo()">
          Test Info Notification
        </button>
        
        <button class="btn btn-danger" (click)="testError()">
          Test Error Notification
        </button>
        
        <button class="btn btn-secondary" (click)="testApiError()">
          Test API Error (404)
        </button>
        
        <button class="btn btn-dark" (click)="testAuthError()">
          Test Auth Error (401)
        </button>
        
        <button class="btn btn-outline-danger" (click)="clearNotifications()">
          Clear All Notifications
        </button>
      </div>
      
      <div class="demo-info">
        <h4>Error Handling Features:</h4>
        <ul>
          <li>✅ Automatic error code mapping from backend</li>
          <li>✅ User-friendly error messages</li>
          <li>✅ Different notification types (error, warning, info, success)</li>
          <li>✅ Auto-dismissing notifications with progress bar</li>
          <li>✅ Action buttons for retry/login</li>
          <li>✅ Authentication error handling</li>
          <li>✅ Error categorization and severity levels</li>
          <li>✅ Responsive design for mobile devices</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .error-demo-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .demo-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 20px 0;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .btn-primary {
      background: #007bff;
      color: white;
    }
    
    .btn-warning {
      background: #ffc107;
      color: #212529;
    }
    
    .btn-info {
      background: #17a2b8;
      color: white;
    }
    
    .btn-danger {
      background: #dc3545;
      color: white;
    }
    
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
    
    .btn-dark {
      background: #343a40;
      color: white;
    }
    
    .btn-outline-danger {
      background: transparent;
      color: #dc3545;
      border: 2px solid #dc3545;
    }
    
    .btn-outline-danger:hover {
      background: #dc3545;
      color: white;
    }
    
    .demo-info {
      margin-top: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #007bff;
    }
    
    .demo-info h4 {
      color: #007bff;
      margin-bottom: 15px;
    }
    
    .demo-info ul {
      margin: 0;
      padding-left: 20px;
    }
    
    .demo-info li {
      margin-bottom: 8px;
      line-height: 1.4;
    }
    
    @media (max-width: 600px) {
      .demo-buttons {
        flex-direction: column;
      }
      
      .btn {
        width: 100%;
      }
    }
  `]
})
export class ErrorDemoComponent {
  
  constructor(
    private http: HttpClient,
    private errorUtils: ErrorUtils
  ) {}

  testSuccess(): void {
    this.errorUtils.showSuccess('This is a success notification!');
  }

  testWarning(): void {
    this.errorUtils.showWarning('This is a warning notification!');
  }

  testInfo(): void {
    this.errorUtils.showInfo('This is an info notification!');
  }

  testError(): void {
    this.errorUtils.showErrorNotification({
      code: 905,
      message: 'Internal server error',
      category: 'GENERIC' as any,
      severity: 'CRITICAL' as any,
      userFriendlyMessage: 'This is a test error notification!',
      canRetry: true,
      requiresAuth: false
    });
  }

  testApiError(): void {
    // This will trigger a 404 error which will be caught by the error interceptor
    // We don't need to handle it manually since the interceptor will show the notification
    this.http.get('http://localhost:8080/api/nonexistent-endpoint').subscribe({
      error: (error) => {
        // The interceptor will handle this automatically
        console.log('API error triggered:', error);
      }
    });
  }

  testAuthError(): void {
    // This will trigger a 401 error which will be caught by the error interceptor
    // We don't need to handle it manually since the interceptor will show the notification
    this.http.get('http://localhost:8080/api/protected-endpoint').subscribe({
      error: (error) => {
        // The interceptor will handle this automatically
        console.log('Auth error triggered:', error);
      }
    });
  }

  clearNotifications(): void {
    this.errorUtils.clearNotifications();
  }
} 