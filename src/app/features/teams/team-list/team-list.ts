import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Team, ITeam } from '../../../core/services/team';
import { Auth } from '../../../core/services/auth';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { NgIf,NgFor } from '@angular/common';

@Component({
  selector: 'app-team-list',
  standalone: true,
  templateUrl: './team-list.html',
  styleUrls: ['./team-list.css'],
  imports: [
    NgIf,
    NgFor,
    MatCardModule,
    MatButtonModule
  ]
})
export class TeamList implements OnInit, OnDestroy {
  teams: ITeam[] = []; // Use ITeam interface
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
    this.loadUserTeams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserTeams(): void {
    if (!this.currentUser) {
      this.errorMessage = 'User not authenticated. Please login again.';
      return;
    }

    // Load teams created by the current user
    this.teamService.getTeamsByCreator(this.currentUser.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (teams) => {
        this.teams = teams;
        this.successMessage = null;
        this.errorMessage = null;
        console.log('Loaded teams created by user:', this.currentUser.username, teams);
      },
      error: (err) => {
        console.error('Failed to load user teams', err);
        this.errorMessage = 'Failed to load your teams. Please try again.';
        this.successMessage = null;
      }
    });
  }

  goToTeamDetails(id: string): void {
    this.router.navigate(['/dashboard/teams', id]);
  }

  goToCreateTeam(): void {
    this.router.navigate(['/dashboard/teams/create']);
  }

  editTeamList(): void {
    console.log('Edit team list clicked');
    this.successMessage = 'Edit Team List functionality would go here!';
    setTimeout(() => this.successMessage = null, 2000);
  }

  deleteTeam(id: string): void {
    // Using a simple confirm dialog. For a real app, use a Material dialog.
    if (confirm('Are you sure you want to delete this team?')) {
      this.teamService.deleteTeam(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.successMessage = 'Team deleted successfully!';
          this.errorMessage = null;
          this.loadUserTeams(); // Reload teams after deletion
        },
        error: (err) => {
          console.error('Failed to delete team', err);
          this.errorMessage = 'Failed to delete team. Please try again.';
          this.successMessage = null;
        }
      });
    }
  }

  goToHome(): void {
    // Assuming '/home' is your actual home page. Adjust if needed.
    this.router.navigate(['/']);
  }
}
