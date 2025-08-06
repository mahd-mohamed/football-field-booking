import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TeamService } from '../../../core/services/team.service';
import { TeamMemberService, ITeam, TeamMemberStatus } from '../../../core/services/team-member.service';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-team-list',
  templateUrl: './team-list.html',
  styleUrls: ['./team-list.css'],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    ConfirmationDialogComponent
  ]
})
export class TeamList implements OnInit, OnDestroy {
  teams: ITeam[] = [];
  successMessage: string | null = null;
  errorMessage: string | null = null;
  isLoading = true;
  currentUserId: string | null = null;
  isMemberMap: { [teamId: string]: boolean } = {};
  isRequestingJoin: { [teamId: string]: boolean } = {};
  userRoleMap: { [teamId: string]: 'ORGANIZER' | 'MEMBER' | null } = {};
  teamViewFilter: 'MY_TEAMS' | 'OTHER_TEAMS' = 'MY_TEAMS';
  
  // Confirmation dialog properties
  showConfirmationDialog: boolean = false;
  confirmationDialogData: ConfirmationDialogData = {
    title: '',
    message: '',
    type: 'warning'
  };
  pendingDeleteTeamId: string | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private teamService: TeamService,
    private teamMemberService: TeamMemberService,
    private authService: AuthService,
    private errorHandler: ErrorHandlerService,
    private router: Router
  ) {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || null;
    console.log('TeamList: Constructor called');
  }

  ngOnInit(): void {
    console.log('TeamList: ngOnInit called');
    this.loadTeams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  requestToJoinTeam(teamId: string, event: Event): void {
    event.stopPropagation();
    if (!this.currentUserId) {
      this.errorMessage = 'You need to be logged in to join a team';
      return;
    }

    this.isRequestingJoin[teamId] = true;

    this.teamMemberService.requestToJoinTeam(teamId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        // Show success snack bar notification
        this.errorHandler.showSuccessNotification('Join request sent successfully!');
        
        this.successMessage = 'Join request sent successfully!';
        this.errorMessage = null;
        this.isRequestingJoin[teamId] = false;
        // Update UI to show request pending
        this.isMemberMap[teamId] = true;
        // Success message will be cleared by user interaction or page navigation
      },
      error: (err) => {
        console.error('Error requesting to join team:', err);
        this.errorMessage = err.message || 'Failed to send join request';
        this.successMessage = null;
        this.isRequestingJoin[teamId] = false;
        // Error message will be cleared by user interaction or page navigation
      }
    });
  }

  isTeamMember(team: ITeam): boolean {
    if (!this.currentUserId) return false;

    // Check if user is the creator
    if (team.createdBy === this.currentUserId) return true;

    // Check if user is in members list
    return team.members?.some(member =>
      member.userId === this.currentUserId &&
      (member.status === 'APPROVED' || member.status === 'PENDING')
    ) || false;
  }

  getJoinButtonText(team: ITeam): string {
    if (!this.currentUserId) return 'Login to Join';

    const member = team.members?.find(m => m.userId === this.currentUserId);
    if (!member) return 'Join Team';

    return member.status === 'PENDING' ? 'Request Pending' : 'Member';
  }

  isJoinDisabled(team: ITeam): boolean {
    if (!this.currentUserId) return false;

    const member = team.members?.find(m => m.userId === this.currentUserId);
    return !!member && (member.status === 'PENDING' || member.status === 'APPROVED');
  }

  loadTeams(): void {
    console.log('TeamList: loadTeams() called with filter:', this.teamViewFilter);
    this.isLoading = true;
    this.teams = []; // Clear existing teams
    this.userRoleMap = {}; // Clear existing roles

    // Choose service method based on filter
    const teamsObservable = this.teamViewFilter === 'MY_TEAMS'
      ? this.teamService.getUserTeams()
      : this.teamService.getOtherTeams();

    teamsObservable.pipe(takeUntil(this.destroy$)).subscribe({
      next: (teams: ITeam[]) => {
        console.log('TeamList: Received teams from service:', teams);
        console.log('TeamList: Number of teams received:', teams.length);
        this.teams = teams;

        // Only load user roles for "My Teams" view
        if (this.teamViewFilter === 'MY_TEAMS') {
          this.loadUserRoles();
        } else {
          // For "Other Teams", set all roles to null (no role indicators)
          this.teams.forEach(team => {
            this.userRoleMap[team.id] = null;
          });
        }

        this.successMessage = null;
        this.errorMessage = null;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('TeamList: Error loading teams:', err);
        this.errorMessage = 'Failed to load teams. Please try again.';
        this.successMessage = null;
        this.isLoading = false;
      }
    });
  }

  goToTeamDetails(id: string): void {
    this.router.navigate(['/dashboard/teams', id]);
  }

  loadUserRoles(): void {
    console.log('TeamList: loadUserRoles() called');
    if (!this.currentUserId) {
      console.log('TeamList: No current user ID, skipping role loading');
      return;
    }

    // Check user role for each team where user is a member
    this.teams.forEach(team => {
      // First check if user is a member of this team
      const userMember = team.members?.find(member =>
        member.userId === this.currentUserId &&
        member.status === 'APPROVED'
      );

      if (!userMember) {
        // User is not a member of this team
        console.log(`TeamList: User is not a member of team ${team.id}`);
        this.userRoleMap[team.id] = null;
        return;
      }

      // Check if user is the team creator (automatically organizer)
      if (team.createdBy === this.currentUserId) {
        console.log(`TeamList: User is creator/organizer of team ${team.id}`);
        this.userRoleMap[team.id] = 'ORGANIZER';
        return;
      }

      // For other members, check organizer status via API
      this.teamService.isUserTeamOrganizer( team.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (isOrganizer) => {
          console.log(`TeamList: User role for team ${team.id}:`, isOrganizer ? 'ORGANIZER' : 'MEMBER');
          this.userRoleMap[team.id] = isOrganizer ? 'ORGANIZER' : 'MEMBER';
        },
        error: (err) => {
          console.error(`TeamList: Error checking role for team ${team.id}:`, err);
          // Fallback: assume member role if API call fails
          this.userRoleMap[team.id] = 'MEMBER';
        }
      });
    });
  }

  getUserRole(teamId: string): 'ORGANIZER' | 'MEMBER' | null {
    return this.userRoleMap[teamId] || null;
  }

  onTeamViewFilterChange(newFilter: 'MY_TEAMS' | 'OTHER_TEAMS'): void {
    console.log('TeamList: Filter changed to:', newFilter);
    this.teamViewFilter = newFilter;
    this.loadTeams();
  }

  goToCreateTeam(): void {
    this.router.navigate(['/dashboard/teams/create']);
  }

  editTeamList(): void {
    console.log('Edit team list clicked');
    this.successMessage = 'Edit Team List functionality would go here!';
    // Success message will be cleared by user interaction or page navigation
  }

  deleteTeam(id: string): void {
    const team = this.teams.find(t => t.id === id);
    if (!team) return;

    this.pendingDeleteTeamId = id;
    this.confirmationDialogData = {
      title: 'Delete Team',
      message: `Are you sure you want to delete "${team.name}"? This action cannot be undone and will remove all team members and data.`,
      confirmText: 'Delete Team',
      cancelText: 'Cancel',
      type: 'danger'
    };
    this.showConfirmationDialog = true;
  }

  private executeDeleteTeam(): void {
    if (!this.pendingDeleteTeamId) return;

    this.teamService.deleteTeam(this.pendingDeleteTeamId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        // Show success snack bar notification
        this.errorHandler.showSuccessNotification('Team deleted successfully!');
        
        this.successMessage = 'Team deleted successfully!';
        this.errorMessage = null;
        this.loadTeams();
        this.closeConfirmationDialog();
      },
      error: (err) => {
        console.error('Failed to delete team', err);
        this.errorMessage = 'Failed to delete team. Please try again.';
        this.successMessage = null;
        this.closeConfirmationDialog();
      }
    });
  }

  closeConfirmationDialog(): void {
    this.showConfirmationDialog = false;
    this.pendingDeleteTeamId = null;
  }

  onConfirmationConfirmed(): void {
    this.executeDeleteTeam();
  }

  onConfirmationCancelled(): void {
    this.closeConfirmationDialog();
  }

  goToHome(): void {
    this.router.navigate(['/dashboard']);
  }
}
