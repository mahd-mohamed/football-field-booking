import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, NgIf, NgFor, DatePipe } from '@angular/common'; 
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

import { ITeam, Team, ITeamMember } from '../../../core/services/team';
import { User, Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';

@Component({
  selector: 'app-team-details',
  imports: [CommonModule, ReactiveFormsModule, DatePipe, MatIconModule], 
  templateUrl: './team-details.html', 
  styleUrls: ['./team-details.css'] 
})
export class TeamDetails implements OnInit, OnDestroy { 
  team: ITeam | undefined;
  teamMembers: ITeamMember[] = [];
  usersInTeam: User[] = [];
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isOrganizer: boolean = false;
  isTeamMember: boolean = false;
  hasRequestedJoin: boolean = false;
  isEditing: boolean = false;
  editTeamForm!: FormGroup;

  private destroy$ = new Subject<void>();
  private mockMatchIdToLink: string = 'match_for_dynamic_team';
  teamId!: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teamService: Team,
    private authService: Auth,
    private notificationService: Notification,
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
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    // Check if current user is the team creator
    this.isOrganizer = currentUser.id === team.createdBy;
    console.log('TeamDetailsComponent: Current user is team organizer?', this.isOrganizer);
    console.log('TeamDetailsComponent: Current user ID:', currentUser.id);
    console.log('TeamDetailsComponent: Team creator ID:', team.createdBy);
  }

  loadTeamMembers(teamId: string): void {
    console.log(`TeamDetailsComponent: Attempting to load team members for team ID: "${teamId}"`);
    this.teamService.getTeamMembers(teamId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (members) => {
        this.teamMembers = members;
        console.log('TeamDetailsComponent: Team members loaded:', this.teamMembers);
        // For now, we'll use mock user data since getPlayersByTeamId doesn't exist
        this.usersInTeam = [
          { id: 1, username: 'admin', email: 'admin@admin.com', password: 'admin1', role: 'ADMIN', status: 'ACTIVE' },
          { id: 2, username: 'organizer', email: 'org@org.com', password: 'organizer', role: 'ORGANIZER', status: 'ACTIVE' },
          { id: 3, username: 'player', email: 'player@player.com', password: 'player', role: 'USER', status: 'ACTIVE' }
        ];
        console.log('TeamDetailsComponent: Mock user details for members loaded:', this.usersInTeam);
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
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.team) return;

    console.log('Sending join request for team:', this.team.id);
    console.log('Current user:', currentUser);

    this.teamService.addTeamMember(
      this.team.id,
      currentUser.id,
      currentUser.username,
      currentUser.email,
      'MEMBER',
      'PENDING'
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (member) => {
        console.log('Join request created successfully:', member);
        this.hasRequestedJoin = true;
        this.teamMembers.push(member);

        // Debug: Check if member was saved to localStorage
        const membersString = localStorage.getItem('teamMembers');
        const members = membersString ? JSON.parse(membersString) : [];
        console.log('All team members after adding request:', members);

        // Create notification for team organizer
        this.notificationService.createTeamJoinRequestNotification(
          this.team!.createdBy,
          this.team!.id,
          this.team!.name,
          currentUser.username
        ).subscribe();

        this.successMessage = 'Join request sent successfully! The team organizer will review your request.';
        setTimeout(() => this.successMessage = null, 5000);
      },
      error: (err) => {
        console.error('Failed to send join request:', err);
        this.errorMessage = 'Failed to send join request. Please try again.';
      }
    });
  }

  getUserForTeamMember(userId: number): User | undefined {
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
      const updatedTeam: ITeam = {
        ...this.team,
        name: this.editTeamForm.value.name,
        description: this.editTeamForm.value.description
      };

      this.teamService.updateTeam(updatedTeam).pipe(takeUntil(this.destroy$)).subscribe({
        next: (responseTeam) => {
          this.team = responseTeam;
          this.successMessage = 'Team updated successfully!';
          this.errorMessage = null;
          this.isEditing = false;
          setTimeout(() => this.successMessage = null, 3000);
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
    if (confirm('Are you sure you want to remove this member from the team?')) {
      console.log(`TeamDetailsComponent: Initiating removal of team member ${teamMemberId}`);
      // For now, we'll just remove from the local array since removeTeamMember doesn't exist
      this.teamMembers = this.teamMembers.filter(member => member.id !== teamMemberId);
      this.successMessage = 'Member removed successfully!';
      this.errorMessage = null;
      setTimeout(() => this.successMessage = null, 3000);
      console.log(`TeamDetailsComponent: Team member ${teamMemberId} removed from local array.`);
    }
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
