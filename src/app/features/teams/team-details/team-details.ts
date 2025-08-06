import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, NgIf, NgFor, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

import { ITeam, ITeamMember, TeamMemberRole, TeamMemberStatus, TeamService } from '../../../core/services/team.service';
import { TeamMemberService, ITeamMemberUpdateRequest } from '../../../core/services/team-member.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog';

import { IUser } from '../../../core/models/iuser.model';
@Component({
  selector: 'app-team-details',
  imports: [CommonModule, ReactiveFormsModule, DatePipe, MatIconModule, ConfirmationDialogComponent],
  templateUrl: './team-details.html',
  styleUrls: ['./team-details.css']
})
export class TeamDetails implements OnInit, OnDestroy {
  team: ITeam | undefined;
  teamMembers: ITeamMember[] = [];
  usersInTeam: IUser[] = [];
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isOrganizer: boolean = false;
  isTeamMember: boolean = false;
  hasRequestedJoin: boolean = false;
  isEditing: boolean = false;
  editTeamForm!: FormGroup;
  
  // Confirmation dialog properties
  showConfirmationDialog: boolean = false;
  confirmationDialogData: ConfirmationDialogData = {
    title: '',
    message: '',
    type: 'warning'
  };
  pendingAction: 'remove' | 'makeOrganizer' | null = null;
  pendingMember: ITeamMember | null = null;

  private destroy$ = new Subject<void>();
  // private mockMatchIdToLink: string = 'match_for_dynamic_team';
  teamId!: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teamService: TeamService,
    private teamMemberService: TeamMemberService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    console.log('TeamDetailsComponent: Initialized.');

    this.editTeamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', Validators.maxLength(500)]
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const teamId = params.get('id');
      console.log('TeamDetailsComponent: Team ID from route params:', teamId);
      if (teamId) {
        this.teamId = teamId;
        this.loadTeamDetails(teamId);
        this.loadTeamMembers(teamId);
        this.checkUserTeamStatus(teamId);
      } else {
        this.errorMessage = 'Team ID not provided in URL.';
        console.error('TeamDetailsComponent: Team ID is missing in the URL. Redirecting to team list.');
        this.router.navigate(['/dashboard/teams']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTeamDetails(id: string): void {
    console.log(`TeamDetailsComponent: Attempting to load details for team ID: "${id}"`);
    this.teamService.getTeamById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (team) => {
        if (team) {
          this.team = team;
          console.log('TeamDetailsComponent: Team details loaded successfully:', this.team);
          this.editTeamForm.patchValue({
            name: this.team.name,
            description: this.team.description
          });

          // Check if current user is the team organizer (creator)
          this.checkIfUserIsTeamOrganizer(team);
          console.log('TeamDetailsComponent: Checking if current user is team organizer:', this.isOrganizer);
        } else {
          this.errorMessage = 'Team not found.';
          console.warn(`TeamDetailsComponent: Team with ID "${id}" not found. Redirecting to team list.`);
          this.router.navigate(['/dashboard/teams']);
        }
      },
      error: (err: any) => {
        console.error("TeamDetailsComponent: Error loading team details:", err);
        this.errorMessage = `Failed to load team details: ${err.message || 'Unknown error'}`;
        this.router.navigate(['/dashboard/teams']);
      }
    });
  }

  checkIfUserIsTeamOrganizer(team: ITeam): void {
    // call is organizer service
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.teamService.isUserTeamOrganizer(team.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (isOrganizer) => {
        this.isOrganizer = isOrganizer;
        console.log('TeamDetailsComponent: Current user is team organizer?', this.isOrganizer);
      },
      error: (err) => {
        console.error('TeamDetailsComponent: Error checking if user is team organizer:', err);
      }
    });
  }

  loadTeamMembers(teamId: string): void {
    console.log(`TeamDetailsComponent: Attempting to load team members for team ID: "${teamId}"`);
    this.teamService.getTeamMembers(teamId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (members) => {
        // Filter to show only approved team members
        this.teamMembers = members.filter(member => member.status === 'APPROVED');
        console.log('TeamDetailsComponent: Team members loaded (approved only):', this.teamMembers);
        console.log('TeamDetailsComponent: Total members from API:', members.length, 'Approved members:', this.teamMembers.length);
      },
      error: (err: any) => {
        console.error('TeamDetailsComponent: Error loading team members:', err);
        this.errorMessage = `Failed to load team members: ${err.message || 'Unknown error'}`;
      }
    });
  }

  checkUserTeamStatus(teamId: string): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.teamService.getTeamMembers(teamId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (members) => {
        const userMember = members.find(m => m.userId === currentUser.id);
        if (userMember) {
          this.isTeamMember = userMember.status === 'APPROVED';
          this.hasRequestedJoin = userMember.status === 'PENDING';
        } else {
          this.isTeamMember = false;
          this.hasRequestedJoin = false;
        }
      },
      error: (err) => {
        console.error('Error checking user team status:', err);
      }
    });
  }

  requestToJoinTeam(): void {
    if (!this.team) return;

    // Clear any previous messages
    this.errorMessage = null;
    this.successMessage = null;

    console.log('Sending join request for team:', this.team.id);

    this.teamMemberService.requestToJoinTeam(this.team.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('Join request successful:', response);
        this.hasRequestedJoin = true;
        
        // Show success snack bar notification
        this.errorHandler.showSuccessNotification('Your request to join the team has been sent successfully!');
        
        this.successMessage = 'Your request to join the team has been sent successfully!';

        // Update the team members list to include the pending request
        if (response) {
          const newMember: ITeamMember = {
            id: response.id,
            teamId: response.teamId,
            userId: response.userId,
            username: this.authService.getCurrentUser()?.username || '',
            email: this.authService.getCurrentUser()?.email || '',
            role: response.role as TeamMemberRole,
            status: response.status as TeamMemberStatus,
            createdAt: response.createdAt,
            respondedAt: response.respondedAt
          };
          this.teamMembers = [...this.teamMembers, newMember];
        }

        // Success message will be cleared by user interaction or page navigation
      },
      error: (error) => {
        console.error('Failed to send join request:', error);
        this.errorMessage = error.message || 'Failed to send join request. Please try again.';

        // Error message will be cleared by user interaction or page navigation
      }
    });
  }

  getUserForTeamMember(userId: string): IUser | undefined {
    return this.usersInTeam.find(user => user.id === userId);
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.editTeamForm.patchValue({
        name: this.team?.name,
        description: this.team?.description
      });
    }
  }

  saveTeamChanges(): void {
    if (this.editTeamForm.valid && this.team) {
      const teamData = {
        name: this.editTeamForm.value.name,
        description: this.editTeamForm.value.description
      };

      this.teamService.updateTeam(this.team.id, teamData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (responseTeam: ITeam) => {
          this.team = responseTeam;
          
          // Show success snack bar notification
          this.errorHandler.showSuccessNotification('Team updated successfully!');
          
          this.successMessage = 'Team updated successfully!';
          this.errorMessage = null;
          this.isEditing = false;
          // Success message will be cleared by user interaction or page navigation
        },
        error: (err: any) => {
          console.error('Failed to update team', err);
          this.errorMessage = `Failed to update team: ${err.message || 'Unknown error'}`;
          this.successMessage = null;
        }
      });
    } else {
      this.errorMessage = 'Please correct the form errors.';
      this.editTeamForm.markAllAsTouched();
    }
  }

  removeTeamMember(teamMemberId: string): void {
    const member = this.teamMembers.find(m => m.id === teamMemberId);
    if (!member) return;

    this.pendingAction = 'remove';
    this.pendingMember = member;
    this.confirmationDialogData = {
      title: 'Remove Team Member',
      message: `Are you sure you want to remove ${member.username} from the team? This action cannot be undone.`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      type: 'danger'
    };
    this.showConfirmationDialog = true;
  }

  private executeRemoveMember(): void {
    if (!this.pendingMember) return;

    console.log(`TeamDetailsComponent: Initiating removal of team member ${this.pendingMember.id}`);

    this.teamMemberService.removeTeamMember(this.pendingMember.id).subscribe({
      next: () => {
        // Only update the UI after successful backend removal
        this.teamMembers = this.teamMembers.filter(member => member.id !== this.pendingMember!.id);
        
        // Show success snack bar notification
        this.errorHandler.showSuccessNotification(`${this.pendingMember!.username} has been removed from the team.`);
        
        this.successMessage = 'Member removed successfully!';
        this.errorMessage = null;
        // Success message will be cleared by user interaction or page navigation
        console.log(`TeamDetailsComponent: Team member ${this.pendingMember!.id} removed successfully.`);
        this.closeConfirmationDialog();
      },
      error: (error) => {
        console.error('Error removing team member:', error);
        this.errorMessage = error.message || 'Failed to remove team member';
        this.successMessage = null;
        // Error message will be cleared by user interaction or page navigation
        this.closeConfirmationDialog();
      }
    });
  }

  makeOrganizer(member: ITeamMember): void {
    this.pendingAction = 'makeOrganizer';
    this.pendingMember = member;
    this.confirmationDialogData = {
      title: 'Make Team Organizer',
      message: `Are you sure you want to make ${member.username} an organizer of this team? They will have the same management privileges as you.`,
      confirmText: 'Make Organizer',
      cancelText: 'Cancel',
      type: 'warning'
    };
    this.showConfirmationDialog = true;
  }

  private executeMakeOrganizer(): void {
    if (!this.pendingMember) return;

    console.log(`TeamDetailsComponent: Making ${this.pendingMember.username} an organizer`);

    const updateRequest: ITeamMemberUpdateRequest = {
      id: this.pendingMember.id,
      role: 'ORGANIZER',
      status: this.pendingMember.status
    };

    this.teamMemberService.updateTeamMember(updateRequest).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedMember) => {
        // Update the member in the local array
        const memberIndex = this.teamMembers.findIndex(m => m.id === this.pendingMember!.id);
        if (memberIndex !== -1) {
          this.teamMembers[memberIndex] = updatedMember;
        }
        
        // Show success snack bar notification
        this.errorHandler.showSuccessNotification(`${this.pendingMember!.username} is now an organizer!`);
        
        this.successMessage = `${this.pendingMember!.username} is now an organizer!`;
        this.errorMessage = null;
        // Success message will be cleared by user interaction or page navigation
        console.log(`TeamDetailsComponent: ${this.pendingMember!.username} promoted to organizer successfully.`);
        //update the team details to reflect the change
        this.loadTeamDetails(this.teamId);
        this.loadTeamMembers(this.teamId);
        this.checkUserTeamStatus(this.teamId);
        this.closeConfirmationDialog();
      },
      error: (error) => {
        console.error('Error promoting member to organizer:', error);
        this.errorMessage = error.message || 'Failed to promote member to organizer';
        this.successMessage = null;
        // Error message will be cleared by user interaction or page navigation
        this.closeConfirmationDialog();
      }
    });
  }

  closeConfirmationDialog(): void {
    this.showConfirmationDialog = false;
    this.pendingAction = null;
    this.pendingMember = null;
  }

  onConfirmationConfirmed(): void {
    switch (this.pendingAction) {
      case 'remove':
        this.executeRemoveMember();
        break;
      case 'makeOrganizer':
        this.executeMakeOrganizer();
        break;
    }
  }

  onConfirmationCancelled(): void {
    this.closeConfirmationDialog();
  }

  // Helper method to check if a member can be removed
  canRemoveMember(member: ITeamMember): boolean {
    return this.isOrganizer && member.role !== 'ORGANIZER';
  }

  // Helper method to check if a member can be made organizer
  canMakeOrganizer(member: ITeamMember): boolean {
    // Only show "Make Organizer" button for approved members who are NOT already organizers
    return this.isOrganizer && member.status === 'APPROVED' && member.role !== 'ORGANIZER';
  }

  goToInvitePlayer(teamId: string): void {
    // Route is: teams/:id/invite
    console.log(`Navigating to invite player for team: ${teamId}`);
    this.router.navigate(['/dashboard/teams', teamId, 'invite'])
      .then(() => console.log('Navigation to invite player successful'))
      .catch(err => {
        console.error('Navigation to invite player failed:', err);
        this.errorMessage = 'Failed to navigate to invite player page';
      });
  }

  goToTeamRequests(): void {
    // Route is: teams/requests
    console.log('Navigating to team requests');
    this.router.navigate(['/dashboard/teams/requests'])
      .then(() => console.log('Navigation to team requests successful'))
      .catch(err => {
        console.error('Navigation to team requests failed:', err);
        this.errorMessage = 'Failed to navigate to team requests page';
      });
  }

  goToTeamMembers(): void {
    // Stay on current page but scroll to members section
    // Since we're already on the team details page, just stay here
    // The members section is already visible on this page
    console.log('Already on team members page - members section is visible');
    // Optionally scroll to members section
    const membersSection = document.querySelector('.team-members-list');
    if (membersSection) {
      membersSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  navigateToMatchParticipants(matchId: string): void {
    console.log('navigateToMatchParticipants called.');
    console.log('Current teamId:', this.teamId);
    console.log('Match ID:', matchId);

    // Navigate to match participants page with both matchId and teamId
    this.router.navigate(['/dashboard/matches', matchId, 'participants', this.teamId]);
  }

  goBackToList(): void {
    console.log('TeamDetailsComponent: Attempting to navigate back to team list.');
    this.router.navigate(['/dashboard/teams']);
  }
}
