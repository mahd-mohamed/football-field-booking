import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core/services/auth';
import { Team } from '../../../core/services/team';

@Component({
  selector: 'app-unified-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unified-dashboard.html',
  styleUrl: './unified-dashboard.css'
})
export class UnifiedDashboardComponent implements OnInit {
  isOrganizer: boolean = false;
  userTeams: any[] = [];
  currentUser: any;

  constructor(
    private authService: Auth,
    private teamService: Team
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUserTeams();
  }

  private loadUserTeams(): void {
    if (this.currentUser) {
      // Load teams created by the current user
      this.teamService.getTeamsByCreator(this.currentUser.id).subscribe({
        next: (teams) => {
          this.userTeams = teams;
          this.checkIfUserIsOrganizer();
        },
        error: (error) => {
          console.error('Error loading user teams:', error);
        }
      });
    }
  }

  private checkIfUserIsOrganizer(): void {
    if (!this.currentUser) return;

    // Check if user is organizer in any team
    const checkPromises = this.userTeams.map(team => 
      this.teamService.isUserTeamOrganizer(this.currentUser.id, team.id).toPromise()
    );

    Promise.all(checkPromises).then(results => {
      this.isOrganizer = results.some(isOrganizer => isOrganizer) || this.currentUser.role === 'ORGANIZER';
      console.log('User is organizer:', this.isOrganizer);
    }).catch(error => {
      console.error('Error checking organizer status:', error);
    });
  }

  get userRole(): string {
    if (this.currentUser?.role === 'ORGANIZER' || this.isOrganizer) {
      return 'ORGANIZER';
    }
    return 'PLAYER';
  }

  get teamCount(): number {
    return this.userTeams.length;
  }
} 