import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Team, ITeamRequest } from '../../../core/services/team';
import { Auth } from '../../../core/services/auth';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { NgIf, NgFor, DatePipe } from '@angular/common';

@Component({
  selector: 'app-team-requests',
  standalone: true,
  templateUrl: './team-requests.html',
  styleUrls: ['./team-requests.css'],
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
export class TeamRequests implements OnInit, OnDestroy {
  teamRequests: ITeamRequest[] = [];
  successMessage: string | null = null;
  errorMessage: string | null = null;
  currentUser: any;
  private destroy$ = new Subject<void>();

  constructor(
    private teamService: Team,
    private router: Router,
    private authService: Auth
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadTeamRequests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTeamRequests(): void {
    if (!this.currentUser) {
      this.errorMessage = 'User not authenticated. Please login again.';
      return;
    }

    // Load requests for teams where current user is organizer
    this.teamService.getTeamsByCreator(this.currentUser.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (teams) => {
        const teamIds = teams.map(team => team.id);
        this.loadRequestsForTeams(teamIds);
      },
      error: (err) => {
        console.error('Failed to load teams for requests', err);
        this.errorMessage = 'Failed to load team requests. Please try again.';
      }
    });
  }

  private loadRequestsForTeams(teamIds: string[]): void {
    const allRequests: ITeamRequest[] = [];
    
    teamIds.forEach(teamId => {
      this.teamService.getTeamRequests(teamId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (requests) => {
          allRequests.push(...requests);
          if (allRequests.length === requests.length) {
            this.teamRequests = allRequests.filter(req => req.status === 'PENDING');
            this.successMessage = null;
            this.errorMessage = null;
          }
        },
        error: (err) => {
          console.error('Failed to load requests for team', teamId, err);
          this.errorMessage = 'Failed to load some team requests.';
        }
      });
    });
  }

  approveRequest(requestId: string): void {
    this.teamService.respondToRequest(requestId, 'APPROVED').pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.successMessage = 'Request approved successfully!';
        this.errorMessage = null;
        this.loadTeamRequests(); // Reload requests
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        console.error('Failed to approve request', err);
        this.errorMessage = 'Failed to approve request. Please try again.';
        this.successMessage = null;
      }
    });
  }

  rejectRequest(requestId: string): void {
    this.teamService.respondToRequest(requestId, 'REJECTED').pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.successMessage = 'Request rejected successfully!';
        this.errorMessage = null;
        this.loadTeamRequests(); // Reload requests
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        console.error('Failed to reject request', err);
        this.errorMessage = 'Failed to reject request. Please try again.';
        this.successMessage = null;
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'warn';
      case 'APPROVED':
        return 'primary';
      case 'REJECTED':
        return 'accent';
      default:
        return 'primary';
    }
  }

  goToTeamDetails(teamId: string): void {
    this.router.navigate(['/dashboard/teams', teamId]);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/teams']);
  }
}
