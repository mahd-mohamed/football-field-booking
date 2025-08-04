import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Notification, INotification, NotificationType } from '../../../core/services/notification';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.html',
  styleUrls: ['./notification-list.css'],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class NotificationList implements OnInit, OnDestroy {
  notifications: INotification[] = [];
  unreadCount: number = 0;
  loading: boolean = true;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: Notification,
    private authService: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.errorMessage = 'User not authenticated';
      this.loading = false;
      return;
    }

    this.notificationService.getUserNotifications(currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications) => {
          this.notifications = notifications;
          this.loading = false;
          this.loadUnreadCount();
        },
        error: (err) => {
          console.error('Failed to load notifications', err);
          this.errorMessage = 'Failed to load notifications';
          this.loading = false;
        }
      });
  }

  loadUnreadCount(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.notificationService.getUnreadCount(currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (count) => {
          this.unreadCount = count;
        },
        error: (err) => {
          console.error('Failed to load unread count', err);
        }
      });
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update local state
          const notification = this.notifications.find(n => n.id === notificationId);
          if (notification && notification.status === 'UNREAD') {
            notification.status = 'READ';
            notification.readAt = new Date().toISOString();
            this.unreadCount = Math.max(0, this.unreadCount - 1);
          }
        },
        error: (err) => {
          console.error('Failed to mark notification as read', err);
          this.errorMessage = 'Failed to mark notification as read';
        }
      });
  }

  markAllAsRead(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.notificationService.markAllAsRead(currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update local state
          this.notifications.forEach(n => {
            if (n.status === 'UNREAD') {
              n.status = 'READ';
              n.readAt = new Date().toISOString();
            }
          });
          this.unreadCount = 0;
          this.successMessage = 'All notifications marked as read';
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (err) => {
          console.error('Failed to mark all notifications as read', err);
          this.errorMessage = 'Failed to mark all notifications as read';
        }
      });
  }

  deleteNotification(notificationId: string): void {
    this.notificationService.deleteNotification(notificationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update local state
          const deletedNotification = this.notifications.find(n => n.id === notificationId);
          if (deletedNotification && deletedNotification.status === 'UNREAD') {
            this.unreadCount = Math.max(0, this.unreadCount - 1);
          }
          this.notifications = this.notifications.filter(n => n.id !== notificationId);
          this.successMessage = 'Notification deleted';
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (err) => {
          console.error('Failed to delete notification', err);
          this.errorMessage = 'Failed to delete notification';
        }
      });
  }

  getNotificationIcon(type: NotificationType): string {
    const iconMap: Record<NotificationType, string> = {
      'BOOKING_CONFIRMATION': 'event_available',
      'MATCH_INVITATION': 'sports_soccer',
      'TEAM_JOIN_REQUEST': 'group_add',
      'TEAM_INVITATION': 'group',
      'APPROVAL': 'check_circle',
      'REJECTION': 'cancel',
      'MATCH_PARTICIPATION_REQUEST': 'person_add',
      'MATCH_PARTICIPATION_APPROVED': 'thumb_up',
      'MATCH_PARTICIPATION_REJECTED': 'thumb_down'
    };
    return iconMap[type] || 'notifications';
  }

  getNotificationIconClass(type: NotificationType): string {
    const classMap: Record<NotificationType, string> = {
      'BOOKING_CONFIRMATION': 'icon-success',
      'MATCH_INVITATION': 'icon-primary',
      'TEAM_JOIN_REQUEST': 'icon-warning',
      'TEAM_INVITATION': 'icon-info',
      'APPROVAL': 'icon-success',
      'REJECTION': 'icon-danger',
      'MATCH_PARTICIPATION_REQUEST': 'icon-warning',
      'MATCH_PARTICIPATION_APPROVED': 'icon-success',
      'MATCH_PARTICIPATION_REJECTED': 'icon-danger'
    };
    return classMap[type] || 'icon-default';
  }

  getNotificationTypeLabel(type: NotificationType): string {
    const labelMap: Record<NotificationType, string> = {
      'BOOKING_CONFIRMATION': 'Booking',
      'MATCH_INVITATION': 'Match',
      'TEAM_JOIN_REQUEST': 'Team Request',
      'TEAM_INVITATION': 'Team Invite',
      'APPROVAL': 'Approval',
      'REJECTION': 'Rejection',
      'MATCH_PARTICIPATION_REQUEST': 'Participation',
      'MATCH_PARTICIPATION_APPROVED': 'Approved',
      'MATCH_PARTICIPATION_REJECTED': 'Rejected'
    };
    return labelMap[type] || 'Notification';
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  }

  hasAction(notification: INotification): boolean {
    return ['MATCH_INVITATION', 'TEAM_INVITATION', 'TEAM_JOIN_REQUEST', 'MATCH_PARTICIPATION_REQUEST'].includes(notification.type);
  }

  getActionLabel(notification: INotification): string {
    const actionMap: Record<NotificationType, string> = {
      'MATCH_INVITATION': 'View Match',
      'TEAM_INVITATION': 'View Team',
      'TEAM_JOIN_REQUEST': 'Manage Request',
      'MATCH_PARTICIPATION_REQUEST': 'Manage Request',
      'BOOKING_CONFIRMATION': '',
      'APPROVAL': '',
      'REJECTION': '',
      'MATCH_PARTICIPATION_APPROVED': '',
      'MATCH_PARTICIPATION_REJECTED': ''
    };
    return actionMap[notification.type] || '';
  }

  handleNotificationAction(notification: INotification): void {
    switch (notification.type) {
      case 'MATCH_INVITATION':
        if (notification.metadata?.matchId) {
          this.router.navigate(['/dashboard/matches', notification.metadata.matchId]);
        }
        break;
      case 'TEAM_INVITATION':
        if (notification.metadata?.teamId) {
          this.router.navigate(['/dashboard/teams', notification.metadata.teamId]);
        }
        break;
      case 'TEAM_JOIN_REQUEST':
        if (notification.metadata?.teamId) {
          this.router.navigate(['/dashboard/teams/requests']);
        }
        break;
      case 'MATCH_PARTICIPATION_REQUEST':
        if (notification.metadata?.matchId) {
          this.router.navigate(['/dashboard/matches', notification.metadata.matchId, 'participants']);
        }
        break;
    }
  }
}
