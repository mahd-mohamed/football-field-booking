import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Auth } from '../../core/services/auth';
import { Team } from '../../core/services/team';
import { Notification } from '../../core/services/notification';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, RouterModule, FontAwesomeModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  role: string | undefined;
  isOrganizerInAnyTeam: boolean = false;
  userTeams: any[] = [];
  unreadNotificationCount: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private auth: Auth,
    private teamService: Team,
    private notificationService: Notification,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.role = this.auth.getCurrentUser()?.role;
    this.loadUserTeams();
    this.loadNotificationCount();
    
    // Listen for team creation events to refresh sidebar state
    window.addEventListener('teamCreated', this.handleTeamCreated.bind(this) as EventListener);
  }

  ngOnDestroy(): void {
    // Clean up event listener
    window.removeEventListener('teamCreated', this.handleTeamCreated.bind(this) as EventListener);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleTeamCreated(event: Event): void {
    console.log('Team created event received, refreshing sidebar state...');
    // Refresh user teams and organizer status
    this.loadUserTeams();
  }

  private loadUserTeams(): void {
    const currentUser = this.auth.getCurrentUser();
    if (currentUser) {
      // Load teams created by the current user
      this.teamService.getTeamsByCreator(currentUser.id).subscribe({
        next: (teams) => {
          this.userTeams = teams;
          this.checkIfUserIsOrganizer(currentUser.id);
        },
        error: (error) => {
          console.error('Error loading user teams:', error);
        }
      });
    }
  }

  private loadNotificationCount(): void {
    const currentUser = this.auth.getCurrentUser();
    if (currentUser) {
      this.notificationService.getUnreadCount(currentUser.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (count) => {
            this.unreadNotificationCount = count;
          },
          error: (err) => {
            console.error('Error loading notification count:', err);
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

  // Get effective role for navigation
  get effectiveRole(): string {
    if (this.role === 'ADMIN') return 'ADMIN';
    if (this.role === 'ORGANIZER' || this.isOrganizerInAnyTeam) return 'ORGANIZER';
    return 'USER';
  }

  // Check if user can access teams
  get canAccessTeams(): boolean {
    return this.effectiveRole === 'ORGANIZER' || this.effectiveRole === 'USER' || this.effectiveRole === 'ADMIN';
  }

  // Check if user can access matches
  get canAccessMatches(): boolean {
    return this.effectiveRole === 'ORGANIZER' || this.effectiveRole === 'USER' || this.effectiveRole === 'ADMIN';
  }

  // Check if user can access places
  get canAccessPlaces(): boolean {
    return this.effectiveRole === 'ORGANIZER' || this.effectiveRole === 'USER' || this.effectiveRole === 'ADMIN';
  }

  // Check if user can access bookings
  get canAccessBookings(): boolean {
    return this.effectiveRole === 'ORGANIZER' || this.effectiveRole === 'USER' || this.effectiveRole === 'ADMIN';
  }

  // Check if user can access profile
  get canAccessProfile(): boolean {
    return this.effectiveRole === 'ORGANIZER' || this.effectiveRole === 'USER' || this.effectiveRole === 'ADMIN';
  }

  // Logout method
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
