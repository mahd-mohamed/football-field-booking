import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatchParticipantService, IUserMatch } from '../../../core/services/match-participant.service';
import { TeamService } from '../../../core/services/team.service';

@Component({
  selector: 'app-match-details',
  imports: [CommonModule, NgIf],
  templateUrl: './match-details.html',
  styleUrls: ['./match-details.css']
})
export class MatchDetails implements OnInit, OnDestroy {
  match: IUserMatch | null = null;
  errorMessage: string | null = null;
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private matchParticipantService: MatchParticipantService,
    private teamService: TeamService
  ) {}

  ngOnInit(): void {
    const matchId = this.route.snapshot.paramMap.get('id');
    if (!matchId) {
      this.errorMessage = 'Match ID not found';
      this.isLoading = false;
      return;
    }

    // this.loadMatchDetails(matchId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // private loadMatchDetails(matchId: string): void {
  //   this.matchParticipantService.getBookingMatchById(matchId).pipe(
  //     takeUntil(this.destroy$)
  //   ).subscribe({
  //     next: (match: IBookingMatch | null) => {
  //       if (!match) {
  //         this.errorMessage = 'Match not found';
  //       } else {
  //         this.match = match;
  //       }
  //       this.isLoading = false;
  //     },
  //     error: (err: any) => {
  //       console.error('Error loading match details:', err);
  //       this.errorMessage = 'Failed to load match details';
  //       this.isLoading = false;
  //     }
  //   });
  // }

  goToParticipants(): void {
    if (this.match) {
      this.router.navigate(['/dashboard/matches', this.match.matchId, 'participants', this.match.teamId]);
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
