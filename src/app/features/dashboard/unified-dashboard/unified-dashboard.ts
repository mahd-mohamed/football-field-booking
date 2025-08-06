import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TeamService } from '../../../core/services/team.service';

@Component({
  selector: 'app-unified-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './unified-dashboard.html',
  styleUrl: './unified-dashboard.css'
})
export class UnifiedDashboardComponent implements OnInit {
  isOrganizer: boolean = false;
  userTeams: any[] = [];
  currentUser: any;

  constructor(
    private authService: AuthService,
    private teamService: TeamService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUserTeams();
  }

private loadUserTeams(): void {
  const currentUser = this.authService.getCurrentUser();
  if (currentUser) {
    this.teamService.getTeamsByCreator().subscribe({
      next: (response: any) => {
        // If response is an array, assign directly; if it's an object with 'content', use that; otherwise, assign empty array
        if (Array.isArray(response)) {
          this.userTeams = response;
        } else if (response && Array.isArray(response.content)) {
          this.userTeams = response.content;
        } else {
          this.userTeams = [];
        }
        this.checkIfUserIsOrganizer();
      },
      error: (error) => {
        console.error('Error loading user teams:', error);
        this.userTeams = [];
      }
    });
  }
}

  private checkIfUserIsOrganizer(): void {
    if (!this.currentUser) return;

    // Check if user is organizer in any team
    const checkPromises = this.userTeams.map(team =>
      this.teamService.isUserTeamOrganizer(team.id).toPromise()
    );

    Promise.all(checkPromises).then(results => {
      this.isOrganizer = results.some(isOrganizer => isOrganizer) || this.currentUser.role === 'ORGANIZER';
      console.log('User is organizer:', this.isOrganizer);
    }).catch(error => {
      console.error('Error checking organizer status:', error);
    });
  }

  get userRole(): string {

    return 'USER';
  }

  get teamCount(): number {
    return this.userTeams.length;
  }
}
