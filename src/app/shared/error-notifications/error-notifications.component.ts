import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { IErrorNotification } from '../../core/models/ierror-code.model';
import { ErrorHandlerService } from '../../core/services/error-handler.service';

@Component({
  selector: 'app-error-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container" *ngIf="notifications.length > 0">
      <div 
        *ngFor="let notification of notifications; trackBy: trackByNotification"
        class="notification"
        [ngClass]="getNotificationClasses(notification)"
      >
        <div class="notification-content">
          <div class="notification-icon">
            <i [class]="getNotificationIcon(notification.type)"></i>
          </div>
          <div class="notification-message">
            <div class="message-text">{{ notification.message }}</div>
            <!-- <div class="error-code" *ngIf="notification.code">
              Error Code: {{ notification.code }}
            </div> -->
          </div>
          <div class="notification-actions">
            <button 
              *ngIf="notification.action"
              class="action-btn"
              (click)="notification.action!.callback()"
            >
              {{ notification.action!.label }}
            </button>
            <button 
              class="close-btn"
              (click)="removeNotification(notification)"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div 
          *ngIf="notification.duration"
          class="notification-progress"
          [style.animation-duration]="notification.duration + 'ms'"
        ></div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
      width: 100%;
    }

    .notification {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      margin-bottom: 10px;
      overflow: hidden;
      position: relative;
      border-left: 4px solid;
      animation: slideIn 0.3s ease-out;
    }

    .notification.error {
      border-left-color: #dc3545;
      background: #fff5f5;
    }

    .notification.warning {
      border-left-color: #ffc107;
      background: #fffbf0;
    }

    .notification.info {
      border-left-color: #17a2b8;
      background: #f0f8ff;
    }

    .notification.success {
      border-left-color: #28a745;
      background: #f0fff4;
    }

    .notification-content {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      gap: 12px;
    }

    .notification-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .notification.error .notification-icon {
      color: #dc3545;
      background: rgba(220, 53, 69, 0.1);
    }

    .notification.warning .notification-icon {
      color: #ffc107;
      background: rgba(255, 193, 7, 0.1);
    }

    .notification.info .notification-icon {
      color: #17a2b8;
      background: rgba(23, 162, 184, 0.1);
    }

    .notification.success .notification-icon {
      color: #28a745;
      background: rgba(40, 167, 69, 0.1);
    }

    .notification-message {
      flex: 1;
      min-width: 0;
    }

    .message-text {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
      line-height: 1.4;
    }

    .error-code {
      font-size: 12px;
      color: #666;
      font-family: monospace;
    }

    .notification-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .action-btn {
      background: transparent;
      border: 1px solid currentColor;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: currentColor;
      color: white;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #333;
    }

    .notification-progress {
      height: 3px;
      background: currentColor;
      animation: progressShrink linear forwards;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes progressShrink {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }

    @media (max-width: 480px) {
      .notifications-container {
        left: 10px;
        right: 10px;
        max-width: none;
      }
    }
  `]
})
export class ErrorNotificationsComponent implements OnInit, OnDestroy {
  notifications: IErrorNotification[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private errorHandler: ErrorHandlerService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.errorHandler.errorNotifications$.subscribe(notifications => {
        this.notifications = notifications;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  removeNotification(notification: IErrorNotification): void {
    this.errorHandler.removeNotification(notification);
  }

  trackByNotification(index: number, notification: IErrorNotification): string {
    // Create a unique identifier for each notification to prevent duplicates
    return `${notification.type}-${notification.code || 'no-code'}-${notification.message}-${index}`;
  }

  getNotificationClasses(notification: IErrorNotification): string {
    return `notification ${notification.type}`;
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'error':
        return 'fas fa-exclamation-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'info':
        return 'fas fa-info-circle';
      case 'success':
        return 'fas fa-check-circle';
      default:
        return 'fas fa-info-circle';
    }
  }
} 