import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService, INotification, RequestType } from '../../../core/services/notification.service';
import { TeamMemberService, TeamMemberStatus } from '../../../core/services/team-member.service';
import { MatchParticipantService } from '../../../core/services/match-participant.service';
import { AuthService } from '../../../core/services/auth.service';
import { WebSocketService } from '../../../core/services/websocket.service';
// TODO: Add imports for other services when they become available
// import { MatchService } from '../../../core/services/match.service';
// import { TeamInvitationService } from '../../../core/services/team-invitation.service';

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
    private notificationService: NotificationService,
    private teamMemberService: TeamMemberService,
    private matchParticipantService: MatchParticipantService,
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private router: Router
    // TODO: Add other services when available
    // private matchService: MatchService,
    // private teamInvitationService: TeamInvitationService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.webSocketService.onNotification().subscribe(() => {
      this.loadNotifications();
    });
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

    this.notificationService.getUserNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications) => {
          // Filter to show only pending notifications
          this.notifications = notifications.filter(n => n.status === 'PENDING');
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
    // Since we only show pending notifications, unread count equals total count
    this.unreadCount = this.notifications.length;
  }

  getNotificationIcon(type: RequestType): string {
    const iconMap: Record<RequestType, string> = {
      'MATCH_INVITATION': 'sports_soccer',
      'JOIN_TEAM_REQUEST': 'group_add',
      'JOIN_TEAM_INVITATION': 'group'
    };
    return iconMap[type] || 'notifications';
  }

  getNotificationIconClass(type: RequestType): string {
    const classMap: Record<RequestType, string> = {
      'MATCH_INVITATION': 'icon-primary',
      'JOIN_TEAM_REQUEST': 'icon-warning',
      'JOIN_TEAM_INVITATION': 'icon-info'
    };
    return classMap[type] || 'icon-default';
  }

  getNotificationTypeLabel(type: RequestType): string {
    const labelMap: Record<RequestType, string> = {
      'MATCH_INVITATION': 'Match Invitation',
      'JOIN_TEAM_REQUEST': 'Join Request',
      'JOIN_TEAM_INVITATION': 'Team Invitation'
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
    return ['MATCH_INVITATION', 'JOIN_TEAM_INVITATION', 'JOIN_TEAM_REQUEST'].includes(notification.requestType);
  }

  getActionLabel(notification: INotification): string {
    const actionMap: Record<RequestType, string> = {
      'MATCH_INVITATION': 'View Match',
      'JOIN_TEAM_INVITATION': 'View Team',
      'JOIN_TEAM_REQUEST': 'Manage Request',
    };
    return actionMap[notification.requestType] || '';
  }

  handleNotificationAction(notification: INotification): void {
    switch (notification.requestType) {
      case 'MATCH_INVITATION':
        // Navigate to match details using jokerId
        if (notification.jokerId) {
          this.router.navigate(['/dashboard/matches', notification.jokerId]);
        }
        break;
      case 'JOIN_TEAM_INVITATION':
        // Navigate to team details using jokerId
        if (notification.jokerId) {
          this.router.navigate(['/dashboard/teams', notification.jokerId]);
        }
        break;
      case 'JOIN_TEAM_REQUEST':
        // Navigate to team requests page
        this.router.navigate(['/dashboard/teams/requests']);
        break;
    }
  }

  approveRequest(notification: INotification): void {
    this.respondToRequest(notification, 'APPROVED');
  }

  rejectRequest(notification: INotification): void {
    this.respondToRequest(notification, 'REJECTED');
  }

  private respondToRequest(notification: INotification, status: 'APPROVED' | 'REJECTED'): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.errorMessage = 'User not authenticated';
      return;
    }

    if (!notification.jokerId || !status) {
      this.errorMessage = 'Invalid request data';
      return;
    }

    console.log('Responding to notification request:', notification.id, 'with status:', status, 'type:', notification.requestType);

    // Show loading state
    this.loading = true;

    // Route to different services based on request type
    switch (notification.requestType) {
      case 'JOIN_TEAM_REQUEST':
        this.handleJoinTeamRequest(notification, status);
        break;
      case 'JOIN_TEAM_INVITATION':
        this.handleJoinTeamInvitation(notification, status);
        break;
      case 'MATCH_INVITATION':
        this.handleMatchInvitation(notification, status);
        break;
      default:
        console.error('Unknown request type:', notification.requestType);
        this.errorMessage = 'Unknown request type';
        this.loading = false;
        break;
    }
  }

  private handleJoinTeamRequest(notification: INotification, status: 'APPROVED' | 'REJECTED'): void {
    // Use TeamMemberService for join team requests
    const currentUser = this.authService.getCurrentUser();
  if (!currentUser) {
    this.errorMessage = 'User not authenticated';
    return;
  }

    this.teamMemberService.respondToJoinRequest(notification.jokerId, status as TeamMemberStatus, currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Join team request response finished');
          this.handleSuccessResponse(status, 'join request');
        },
        error: (err) => {
          this.handleErrorResponse(err, 'join request');
        }
      });
  }

  private handleJoinTeamInvitation(notification: INotification, status: 'APPROVED' | 'REJECTED'): void {
    // Use TeamMemberService for team invitations
    this.teamMemberService.respondToInvitation(notification.jokerId, status as TeamMemberStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Team invitation response finished:', response);
          this.handleSuccessResponse(status, 'team invitation');
        },
        error: (err) => {
          this.handleErrorResponse(err, 'team invitation');
        }
      });
  }

  private handleMatchInvitation(notification: INotification, status: 'APPROVED' | 'REJECTED'): void {
    // Convert APPROVED/REJECTED to ACCEPTED/DECLINED for match participant service
    const participantStatus = status === 'APPROVED' ? 'ACCEPTED' : 'DECLINED';

    // Use MatchParticipantService for match invitations
    this.matchParticipantService.respondToMatchInvitation(notification.jokerId, participantStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Match invitation response finished:', response);
          this.handleSuccessResponse(status, 'match invitation');
        },
        error: (err) => {
          this.handleErrorResponse(err, 'match invitation');
        }
      });
  }

  private handleSuccessResponse(status: 'APPROVED' | 'REJECTED', requestType: string): void {
    this.successMessage = status === 'APPROVED'
      ? `Successfully approved the ${requestType}!`
      : `Rejected the ${requestType}`;

    // Remove the notification from the list or reload notifications
    this.loadNotifications();

    // Success message will be cleared by user interaction or page navigation

    this.loading = false;
  }

  private handleErrorResponse(error: any, requestType: string): void {
    console.error(`Failed to respond to ${requestType}`, error);
    this.errorMessage = error.message || `Failed to respond to ${requestType}`;
    this.loading = false;

    // Error message will be cleared by user interaction or page navigation
  }
}
