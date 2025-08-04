import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common'; 
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Match, IBookingMatch, IMatchParticipant } from '../../../core/services/match';
import { Team, ITeamMember } from '../../../core/services/team';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';

@Component({
  selector: 'app-match-participants',
  templateUrl: './match-participants.html',
  styleUrls: ['./match-participants.css'],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class MatchParticipants implements OnInit, OnDestroy {
  match: IBookingMatch | null = null;
  teamMembers: ITeamMember[] = [];
  acceptedParticipants: IMatchParticipant[] = [];
  pendingParticipants: IMatchParticipant[] = [];
  participationRequests: IMatchParticipant[] = [];
  loading: boolean = true;
  isOrganizer: boolean = false;
  hasRequestedParticipation: boolean = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private matchService: Match,
    private teamService: Team,
    private authService: Auth,
    private notificationService: Notification
  ) {}

  ngOnInit(): void {
    this.loadMatchData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMatchData(): void {
    const matchId = this.route.snapshot.paramMap.get('id');
    const teamId = this.route.snapshot.paramMap.get('teamId');
    
    if (!matchId) {
      this.errorMessage = 'Match ID is required';
      this.loading = false;
      return;
    }

    // Load match details
    this.matchService.getBookingMatchById(matchId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (match) => {
        if (match) {
          this.match = match;
          this.checkUserRole();
          this.loadParticipants();
          this.loadTeamMembers();
        } else {
          this.errorMessage = 'Match not found';
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Failed to load match', err);
        this.errorMessage = 'Failed to load match details';
        this.loading = false;
      }
    });
  }

  checkUserRole(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.match) return;

    // Check if user is the organizer
    this.isOrganizer = currentUser.id === this.match.organizerId;
  }

  loadParticipants(): void {
    if (!this.match) return;

    this.matchService.getMatchParticipants(this.match.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (participants) => {
        this.acceptedParticipants = participants.filter(p => p.status === 'ACCEPTED');
        this.pendingParticipants = participants.filter(p => p.status === 'INVITED');
        this.participationRequests = participants.filter(p => p.status === 'INVITED');
        
        // Check if current user has requested participation
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          this.hasRequestedParticipation = participants.some(p => p.userId === currentUser.id);
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load participants', err);
        this.errorMessage = 'Failed to load participants';
        this.loading = false;
      }
    });
  }

  loadTeamMembers(): void {
    if (!this.match) return;

    this.teamService.getTeamMembers(this.match.teamId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (members) => {
        this.teamMembers = members.filter(m => m.status === 'APPROVED');
      },
      error: (err) => {
        console.error('Failed to load team members', err);
      }
    });
  }

  isParticipant(userId: number): boolean {
    return this.acceptedParticipants.some(p => p.userId === userId);
  }

  getParticipantName(userId: number): string {
    // Try to find in team members first
    const teamMember = this.teamMembers.find(m => m.userId === userId);
    if (teamMember) {
      return teamMember.username;
    }
    
    // Fallback to mock data or current user
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      return currentUser.username;
    }
    
    return 'Unknown User';
  }

  getParticipantEmail(userId: number): string {
    // Try to find in team members first
    const teamMember = this.teamMembers.find(m => m.userId === userId);
    if (teamMember) {
      return teamMember.email;
    }
    
    // Fallback to mock data or current user
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      return currentUser.email;
    }
    
    return 'unknown@email.com';
  }

  inviteTeamMember(member: ITeamMember): void {
    if (!this.match) return;

    this.matchService.addMatchParticipant(this.match.id, member.userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (participant) => {
        this.pendingParticipants.push(participant);
        
        // Create notification for the invited user
        this.notificationService.createMatchInvitationNotification(
          member.userId,
          this.match!.id,
          'Your Team', // In real app, get team name
          'Match Organizer' // In real app, get organizer name
        ).subscribe();

        this.successMessage = `Invitation sent to ${member.username}`;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        console.error('Failed to invite team member', err);
        this.errorMessage = 'Failed to send invitation';
      }
    });
  }

  removeParticipant(userId: number): void {
    if (!this.match) return;

    // Remove from accepted participants
    this.acceptedParticipants = this.acceptedParticipants.filter(p => p.userId !== userId);
    
    // Remove from pending participants
    this.pendingParticipants = this.pendingParticipants.filter(p => p.userId !== userId);
    
    // Remove from participation requests
    this.participationRequests = this.participationRequests.filter(p => p.userId !== userId);

    this.successMessage = 'Participant removed from match';
    setTimeout(() => this.successMessage = null, 3000);
  }

  approveParticipation(participantId: string): void {
    if (!this.match) return;

    this.matchService.respondToMatchInvite(participantId, 'ACCEPTED').pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        // Update local state
        const participant = this.participationRequests.find(p => p.id === participantId);
        if (participant) {
          participant.status = 'ACCEPTED';
          participant.respondedAt = new Date().toISOString();
          this.acceptedParticipants.push(participant);
          this.participationRequests = this.participationRequests.filter(p => p.id !== participantId);
        }

        // Create notification for the participant
        this.notificationService.createMatchParticipationApprovedNotification(
          participant!.userId,
          this.match!.id
        ).subscribe();

        this.successMessage = 'Participation request approved';
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        console.error('Failed to approve participation', err);
        this.errorMessage = 'Failed to approve participation';
      }
    });
  }

  rejectParticipation(participantId: string): void {
    if (!this.match) return;

    this.matchService.respondToMatchInvite(participantId, 'DECLINED').pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        // Update local state
        const participant = this.participationRequests.find(p => p.id === participantId);
        if (participant) {
          participant.status = 'DECLINED';
          participant.respondedAt = new Date().toISOString();
          this.participationRequests = this.participationRequests.filter(p => p.id !== participantId);
        }

        // Create notification for the participant
        this.notificationService.createMatchParticipationRejectedNotification(
          participant!.userId,
          this.match!.id
        ).subscribe();

        this.successMessage = 'Participation request rejected';
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        console.error('Failed to reject participation', err);
        this.errorMessage = 'Failed to reject participation';
      }
    });
  }

  requestParticipation(): void {
    if (!this.match) return;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.matchService.addMatchParticipant(this.match.id, currentUser.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (participant) => {
        this.participationRequests.push(participant);
        this.hasRequestedParticipation = true;

        // Create notification for the organizer
        this.notificationService.createMatchParticipationRequestNotification(
          this.match!.organizerId,
          this.match!.id,
          currentUser.username
        ).subscribe();

        this.successMessage = 'Participation request sent to organizer';
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        console.error('Failed to request participation', err);
        this.errorMessage = 'Failed to send participation request';
      }
    });
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
