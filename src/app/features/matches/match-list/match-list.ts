import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Match, IBookingMatch } from '../../../core/services/match';
import { Auth } from '../../../core/services/auth';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { NgIf, NgFor, DatePipe } from '@angular/common';

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
    MatIconModule
  ]
})
export class MatchList implements OnInit, OnDestroy {
  matches: IBookingMatch[] = [];
  successMessage: string | null = null;
  errorMessage: string | null = null;
  currentUser: any;
  private destroy$ = new Subject<void>();

  constructor(
    private matchService: Match,
    private router: Router,
    private authService: Auth
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUserMatches();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserMatches(): void {
    if (!this.currentUser) {
      this.errorMessage = 'User not authenticated. Please login again.';
      return;
    }

    this.matchService.getBookingMatchesByOrganizer(this.currentUser.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (matches) => {
        this.matches = matches;
        this.successMessage = null;
        this.errorMessage = null;
      },
      error: (err) => {
        console.error('Failed to load user matches', err);
        this.errorMessage = 'Failed to load your matches. Please try again.';
        this.successMessage = null;
      }
    });
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

  goToScheduleMatch(): void {
    // Navigate to schedule-match component directly
    this.router.navigate(['/dashboard/matches/schedule']);
  }

  goToMatchParticipants(matchId: string, teamId: string): void {
    this.router.navigate(['/dashboard/matches', matchId, 'participants', teamId]);
  }

  goToMatchDetails(matchId: string): void {
    this.router.navigate(['/dashboard/matches', matchId]);
  }

  goToMatchInvites(): void {
    // For now, navigate to a general invites page or show a message
    this.successMessage = 'Match invites feature coming soon!';
    setTimeout(() => this.successMessage = null, 3000);
  }

  goToTeamRequests(): void {
    this.router.navigate(['/dashboard/teams/requests']);
  }

  deleteMatch(matchId: string): void {
    if (confirm('Are you sure you want to delete this match?')) {
      this.matchService.deleteBookingMatch(matchId).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.successMessage = 'Match deleted successfully!';
          this.errorMessage = null;
          this.loadUserMatches(); // Reload matches after deletion
        },
        error: (err) => {
          console.error('Failed to delete match', err);
          this.errorMessage = 'Failed to delete match. Please try again.';
          this.successMessage = null;
        }
      });
    }
  }

  // getConfirmedMatches(): number {
  //   return this.matches.filter(match => match.status === 'CONFIRMED').length;
  // }

  // getScheduledMatches(): number {
  //   return this.matches.filter(match => match.status === 'SCHEDULED').length;
  // }

  // getCancelledMatches(): number {
  //   return this.matches.filter(match => match.status === 'CANCELLED').length;
  // }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
