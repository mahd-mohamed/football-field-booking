import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from '../../core/services/auth.service';
import { TeamService } from '../../core/services/team.service';
import { NotificationService } from '../../core/services/notification.service';
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
    private authService: AuthService,
    private teamService: TeamService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

ngOnInit(): void {
  this.role = this.authService.getCurrentUser()?.role?.toUpperCase();
  console.log('Sidebar detected role:', this.role, 'Raw user:', this.authService.getCurrentUser());
  
  if (this.role !== 'ADMIN') {
    this.loadUserTeams();
  }
  
  this.loadNotificationCount();
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
  if (this.role === 'ADMIN') {
    this.userTeams = [];
    console.log('Admin user detected, skipping team fetch.');
    return;
  }

  this.teamService.getTeamsByCreator().subscribe({
    next: (response: any) => {
      const teams = response?.content || [];
      this.userTeams = teams.filter((team: any) =>
        team.members?.some((m: any) => m.role === 'ORGANIZER')
      );
      console.log('Organizer teams:', this.userTeams);
    },
    error: (error: any) => {
      console.error('Error loading user teams:', error);
    }
  });
}


  private loadNotificationCount(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.notificationService.getNotificationCount(currentUser.id).subscribe(count => {
        this.unreadNotificationCount = count;
      });
    }
  }

  private checkIfUserIsOrganizer(userId: string): void {
    // Check if user is organizer in any team
    const checkPromises = this.userTeams.map(team =>
      this.teamService.isUserTeamOrganizer(team.id).toPromise()
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


  // Logout method
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
