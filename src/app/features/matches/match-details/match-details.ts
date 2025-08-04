import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Match, IBookingMatch, IMatchParticipant } from '../../../core/services/match';
import { Team } from '../../../core/services/team';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';

@Component({
  selector: 'app-match-details',
  imports: [CommonModule, NgIf],
  templateUrl: './match-details.html',
  styleUrls: ['./match-details.css']
})
export class MatchDetails implements OnInit, OnDestroy {
  match: IBookingMatch | null = null;
  errorMessage: string | null = null;
  isLoading = true;
  currentUser: any = null;
  userParticipation: IMatchParticipant | null = null;
  isOrganizer = false;
  successMessage: string | null = null;
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
    this.currentUser = this.authService.getCurrentUser();
    const matchId = this.route.snapshot.paramMap.get('id');
    if (!matchId) {
      this.errorMessage = 'Match ID not found';
      this.isLoading = false;
      return;
    }

    this.loadMatchDetails(matchId);
  }

  ngOnDestroy(): void {
    this.destroy$ = new Subject<void>();
    this.destroy$.complete();
  }

  private loadMatchDetails(matchId: string): void {
    this.matchService.getBookingMatchById(matchId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (match) => {
        if (!match) {
          this.errorMessage = 'Match not found';
        } else {
          this.match = match;
          this.checkUserParticipation(matchId);
          this.checkIfUserIsOrganizer();
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading match details:', err);
        this.errorMessage = 'Failed to load match details';
        this.isLoading = false;
      }
    });
  }

  private checkUserParticipation(matchId: string): void {
    if (!this.currentUser) return;

    this.matchService.getMatchParticipants(matchId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (participants) => {
        this.userParticipation = participants.find(p => p.userId === this.currentUser.id) || null;
        console.log('User participation:', this.userParticipation);
      },
      error: (err) => {
        console.error('Error checking user participation:', err);
      }
    });
  }

  private checkIfUserIsOrganizer(): void {
    if (!this.currentUser || !this.match) return;

    this.isOrganizer = this.match.organizerId === this.currentUser.id;
  }

  acceptInvitation(): void {
    if (!this.currentUser || !this.match || !this.userParticipation) return;

    this.matchService.respondToMatchInvite(
      this.userParticipation.id,
      'ACCEPTED'
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.userParticipation!.status = 'ACCEPTED';
        this.successMessage = 'Successfully accepted match invitation!';
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err: any) => {
        console.error('Error accepting invitation:', err);
        this.errorMessage = 'Failed to accept invitation';
      }
    });
  }

  declineInvitation(): void {
    if (!this.currentUser || !this.match || !this.userParticipation) return;

    this.matchService.respondToMatchInvite(
      this.userParticipation.id,
      'DECLINED'
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.userParticipation!.status = 'DECLINED';
        this.successMessage = 'Match invitation declined.';
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err: any) => {
        console.error('Error declining invitation:', err);
        this.errorMessage = 'Failed to decline invitation';
      }
    });
  }

  goToParticipants(): void {
    if (this.match) {
      this.router.navigate(['/dashboard/matches', this.match.id, 'participants', this.match.teamId]);
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/matches']);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'SCHEDULED':
        return 'warn';
      case 'CONFIRMED':
        return 'primary';
      case 'CANCELLED':
        return 'accent';
      default:
        return 'primary';
    }
  }
}
