import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Match, IBookingMatch } from '../../../core/services/match';
import { Team } from '../../../core/services/team';

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
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private matchService: Match,
    private teamService: Team
  ) {}

  ngOnInit(): void {
    const matchId = this.route.snapshot.paramMap.get('id');
    if (!matchId) {
      this.errorMessage = 'Match ID not found';
      this.isLoading = false;
      return;
    }

    this.loadMatchDetails(matchId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
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
