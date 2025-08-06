import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatchParticipantService, IUserMatch, IMatchParticipant } from '../../../core/services/match-participant.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatMenu, MatMenuModule } from "@angular/material/menu";

@Component({
  selector: 'app-match-list',
  standalone: true,
  templateUrl: './match-list.html',
  styleUrls: ['./match-list.css'],
  imports: [
    NgIf,
    NgFor,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule
]
})
export class MatchList implements OnInit, OnDestroy {
  matches: IUserMatch[] = [];

  upcomingAcceptedMatches: IUserMatch[] = [];
  pendingInvitations: IUserMatch[] = [];
  pastAcceptedMatches: IUserMatch[] = [];
  selectedParticipants: IMatchParticipant[] = [];

  successMessage: string | null = null;
  errorMessage: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private matchParticipantService: MatchParticipantService,
    private router: Router,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    console.log('MatchList: ngOnInit started.');
    this.loadUserParticipatedMatches();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Fetch all matches that the current user has participated in or is invited to
   */
  loadUserParticipatedMatches(): void {
    this.matchParticipantService.getUserParticipatedMatches()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (matches: IUserMatch[]) => {
          console.log('Matches fetched successfully:', matches);
          this.matches = matches;
          this.categorizeMatches();
          this.successMessage = null;
          this.errorMessage = null;
        },
        error: (err) => {
          console.error('Failed to load matches:', err);
          this.errorMessage = 'Failed to load your matches. Please try again later.';
          this.successMessage = null;
        }
      });
  }

  /**
   * Categorize matches into upcoming accepted, pending, past accepted, declined
   */
  private categorizeMatches(): void {
  const now = new Date();

  this.upcomingAcceptedMatches = this.matches.filter(
    m => m.invitationStatus === 'ACCEPTED' && new Date(m.startTime) > now
  );

  this.pendingInvitations = this.matches.filter(
    m => m.invitationStatus === 'INVITED' && new Date(m.startTime) > now
  );

  this.pastAcceptedMatches = this.matches.filter(
    m => m.bookingStatus === 'CONFIRMED' && new Date(m.startTime) <= now && m.invitationStatus === 'ACCEPTED'
  );

  console.log('Upcoming Accepted:', this.upcomingAcceptedMatches);
  console.log('Pending Invitations:', this.pendingInvitations);
  console.log('Past Accepted:', this.pastAcceptedMatches);
}

respondToInvitation(participantId: string, status: 'ACCEPTED' | 'DECLINED'): void {
  this.matchParticipantService.respondToMatchInvitation(participantId, status)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res: any) => {
        console.log(`Invitation ${status} successfully`, res);
        this.successMessage = `You have ${status === 'ACCEPTED' ? 'accepted' : 'declined'} the invitation.`;
        this.loadUserParticipatedMatches(); // refresh list
      },
      error: (err: any) => {
        console.error(`Failed to respond invitation:`, err);
        this.errorMessage = 'Failed to send your response. Please try again.';
      }
    });
}


viewParticipants(matchId: string): void {
  this.matchParticipantService.getParticipantsByMatch(matchId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (participants) => {
        console.log('Fetched participants:', participants);
        this.ngZone.run(() => {
          this.selectedParticipants = participants;
        });
      },
      error: (err) => {
        console.error('Failed to load participants:', err);
        this.errorMessage = 'Could not fetch participants.';
      }
    });
}



closeParticipants(): void {
  this.selectedParticipants = [];
}


  /**
   * Returns chip color based on match status
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'warn';
      case 'CONFIRMED':
      case 'ACCEPTED':
        return 'primary';
      case 'CANCELLED':
      case 'DECLINED':
        return 'accent';
      default:
        return 'primary';
    }
  }

  /**
   * Navigate to participants list for a specific match
   */
  goToMatchParticipants(matchId: string, teamId: string): void {
    this.router.navigate(['/dashboard/matches', matchId, 'participants', teamId]);
  }

  /**
   * Navigate to match details
   */
  goToMatchDetails(matchId: string): void {
    this.router.navigate(['/dashboard/matches', matchId]);
  }

  /**
   * Navigate to team requests page
   */
  goToTeamRequests(): void {
    this.router.navigate(['/dashboard/teams/requests']);
  }

  /**
   * Navigate back to dashboard
   */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
