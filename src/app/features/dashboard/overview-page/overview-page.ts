import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core/services/auth';
import { Team } from '../../../core/services/team';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard';
import { UnifiedDashboardComponent } from '../unified-dashboard/unified-dashboard';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    FontAwesomeModule,
    AdminDashboardComponent,
    UnifiedDashboardComponent
  ],
  templateUrl: './overview-page.html',
  styleUrls: ['./overview-page.css'],
})
export class OverviewComponent implements OnInit {
  role: string | undefined;
  isOrganizerInAnyTeam: boolean = false;
  userTeams: any[] = [];

  constructor(
    private auth: Auth,
    private teamService: Team
  ) {
    this.role = this.auth.getCurrentUser()?.role;
  }

  ngOnInit(): void {
    this.loadUserTeams();
  }

  private loadUserTeams(): void {
    const currentUser = this.auth.getCurrentUser();
    if (currentUser) {
      // Load teams created by the current user
      this.teamService.getTeamsByCreator(currentUser.id).subscribe({
        next: (teams) => {
          this.userTeams = teams;
          // Check if user is organizer in any team
          this.checkIfUserIsOrganizer(currentUser.id);
        },
        error: (error) => {
          console.error('Error loading user teams:', error);
        }
      });
    }
  }

  private checkIfUserIsOrganizer(userId: number): void {
    // Check if user is organizer in any team
    const checkPromises = this.userTeams.map(team => 
      this.teamService.isUserTeamOrganizer(userId, team.id).toPromise()
    );

    Promise.all(checkPromises).then(results => {
      this.isOrganizerInAnyTeam = results.some(isOrganizer => isOrganizer);
      console.log('User is organizer in any team:', this.isOrganizerInAnyTeam);
    }).catch(error => {
      console.error('Error checking organizer status:', error);
    });
  }

  // Determine which dashboard to show
  get shouldShowAdminDashboard(): boolean {
    return this.role === 'ADMIN';
  }

  get shouldShowUnifiedDashboard(): boolean {
    return this.role === 'PLAYER' || this.role === 'ORGANIZER' || this.isOrganizerInAnyTeam;
  }

  // Get effective role for dashboard display
  get effectiveRole(): string {
    if (this.role === 'ADMIN') return 'ADMIN';
    if (this.role === 'ORGANIZER' || this.isOrganizerInAnyTeam) return 'ORGANIZER';
    return 'PLAYER';
  }
}


