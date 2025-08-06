import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TeamService, ITeamMember, TeamMemberStatus } from '../../../core/services/team.service';
import { TeamMemberService } from '../../../core/services/team-member.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService,INotification } from '../../../core/services/notification.service';


@Component({
  selector: 'app-team-requests',
  templateUrl: './team-requests.html',
  styleUrls: ['./team-requests.css'],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class TeamRequests implements OnInit, OnDestroy {
  joinRequests: INotification[] = [];
  requestsCount: number = 0;
  loading: boolean = true;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private teamService: TeamService,
    private teamMemberService: TeamMemberService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadRequests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRequests(): void {
    this.loading = true;
    this.notificationService.getUserNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications: INotification[]) => {
          this.loading = false;

          // Clear existing requests
          this.joinRequests = [];

          // Filter and transform notifications to join requests
          for (let i = 0; i < notifications.length; i++) {
            const notification = notifications[i];
            if (notification.requestType === 'JOIN_TEAM_REQUEST' && notification.status === 'PENDING') {
              const joinRequest: INotification = {
                id: notification.id,
                requestType: notification.requestType,
                sendTime: notification.sendTime,
                status: notification.status,
                requestMessage: notification.requestMessage,
                senderId: notification.senderId,
                receiverId: notification.receiverId,
                jokerId: notification.jokerId,
                senderEmail: notification.senderEmail
              };
              this.joinRequests.push(joinRequest);
              this.requestsCount = this.joinRequests.length;
              // print the request to console for debugging
              console.log('Join Request:', joinRequest);
            }
          }
        },
        error: (err) => {
          console.error('Failed to load notifications', err);
          this.errorMessage = 'Failed to load notifications';
          this.loading = false;
        }
      });
  }

respondToInvitation(teamMemberId: string, status: 'APPROVED' | 'REJECTED'): void {

}

respondToJoinRequest(teamMemberId: string, status: 'APPROVED' | 'REJECTED'): void {
  console.log('Responding to join request:', teamMemberId, 'with status:', status);
  const currentUser = this.authService.getCurrentUser();
  if (!currentUser) {
    this.errorMessage = 'User not authenticated';
    return;
  }

  if (!teamMemberId || !status) {
    this.errorMessage = 'Team member ID and status are required';
    return;
  }

  // console.log('Responding to join request:', teamMemberId, 'with status:', status);

  // Show loading state
  this.loading = true;

  // Call the service to respond to the join request
  this.teamMemberService.respondToJoinRequest(teamMemberId, status as TeamMemberStatus, currentUser.id)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        console.log('Join Response Finished:');

        // this.successMessage = status === 'APPROVED'
        //   // ? `Successfully approved ${response.userName}'s request to join the team!`
        //   // : `Rejected ${response.userName}'s request to join the team`;


        // Clear success message after 3 seconds
        // setTimeout(() => this.successMessage = null, 3000);

        this.loading = false;
        this.loadRequests();

      },
      error: (err) => {
        console.error('Failed to respond to join request', err);
        this.errorMessage = err.message || 'Failed to respond to join request';
        this.loading = false;

        // Error message will be cleared by user interaction or page navigation
      }
    });
    // update the requests list from the database service
    // this.loadRequests();
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
}
