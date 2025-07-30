import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, NgIf, NgFor, DatePipe } from '@angular/common'; 
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { ITeam, Team, ITeamMember } from '../../../core/services/team';
import { User, Auth } from '../../../core/services/auth'; 

@Component({
  selector: 'app-team-details',
  imports: [CommonModule, ReactiveFormsModule, DatePipe], 
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
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    console.log('TeamDetailsComponent: Initialized.');

    this.isOrganizer = this.authService.isOrganizer();
    console.log('TeamDetailsComponent: Is current user an organizer?', this.isOrganizer);

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

  loadTeamMembers(teamId: string): void {
    console.log(`TeamDetailsComponent: Attempting to load team members for team ID: "${teamId}"`);
    this.teamService.getTeamMembers(teamId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (members) => {
        this.teamMembers = members;
        console.log('TeamDetailsComponent: Team members loaded:', this.teamMembers);
        // For now, we'll use mock user data since getPlayersByTeamId doesn't exist
        this.usersInTeam = [
          { id: 1, username: 'admin', email: 'admin@admin.com', password: 'admin1', role: 'ADMIN' },
          { id: 2, username: 'organizer', email: 'org@org.com', password: 'organizer', role: 'ORGANIZER' },
          { id: 3, username: 'player', email: 'player@player.com', password: 'player', role: 'PLAYER' }
        ];
        console.log('TeamDetailsComponent: Mock user details for members loaded:', this.usersInTeam);
      },
      error: (err: any) => {
        console.error('TeamDetailsComponent: Error loading team members:', err);
        this.errorMessage = `Failed to load team members: ${err.message || 'Unknown error'}`;
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
    console.log(`TeamDetailsComponent: Navigating to invite player page for team ID: ${teamId}`);
    this.router.navigate(['/dashboard/teams', teamId, 'invite']);
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
