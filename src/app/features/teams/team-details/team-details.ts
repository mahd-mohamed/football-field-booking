import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf,NgFor } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ITeam ,Team} from '../../../core/services/team';
import { Auth} from '../../../core/services/auth';

interface IPlayer {
  id: string;
  name: string;
  position: string;
}

@Component({
  selector: 'app-team-details',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule], // Add ReactiveFormsModule and CommonModule
  templateUrl: './team-details.html', // Corrected filename
  styleUrls: ['./team-details.css'] // Corrected filename
})
export class TeamDetails implements OnInit, OnDestroy { // Renamed class to TeamDetailsComponent for consistency
  team: ITeam | undefined; // Use ITeam interface
  players: IPlayer[] = []; // Dummy player data
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isOrganizer: boolean = false; // To control edit button visibility
  isEditing: boolean = false; // To toggle edit mode
  editTeamForm!: FormGroup; // Form for editing team details
  currentUser: any;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teamService: Team, // Inject Team
    private authService: Auth, // Inject AuthService
    private fb: FormBuilder // Inject FormBuilder
  ) { }

  ngOnInit(): void {
    console.log('TeamDetailsComponent: Initialized.');
    this.currentUser = this.authService.getCurrentUser();

    // Initialize the edit form (even if not editing yet)
    this.editTeamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', Validators.maxLength(500)]
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const teamId = params.get('id');
      console.log('TeamDetailsComponent: Team ID from route params:', teamId);
      if (teamId) {
        this.loadTeamDetails(teamId);
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
          // Populate the form when team details are loaded
          this.editTeamForm.patchValue({
            name: this.team.name,
            description: this.team.description
          });
          this.loadDummyPlayers(); // Load dummy players for the team
          this.checkIfUserIsOrganizer(id); // Check if current user is organizer of this team
        } else {
          this.errorMessage = 'Team not found.';
          console.warn(`TeamDetailsComponent: Team with ID "${id}" not found. Redirecting to team list.`);
          this.router.navigate(['/dashboard/teams']);
        }
      },
      error: (err) => {
        console.error("TeamDetailsComponent: Error loading team details:", err);
        this.errorMessage = `Failed to load team details: ${err.message || 'Unknown error'}`;
        this.router.navigate(['/dashboard/teams']); // Redirect on error
      }
    });
  }

  checkIfUserIsOrganizer(teamId: string): void {
    if (!this.currentUser) return;

    this.teamService.isUserTeamOrganizer(this.currentUser.id, teamId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (isOrganizer) => {
        this.isOrganizer = isOrganizer || this.currentUser.role === 'ORGANIZER' || this.currentUser.role === 'ADMIN';
        console.log('TeamDetailsComponent: Is current user an organizer of this team?', this.isOrganizer);
      },
      error: (error) => {
        console.error('TeamDetailsComponent: Error checking organizer status:', error);
      }
    });
  }

  // New: Load dummy player data
  loadDummyPlayers(): void {
    // Generate some dummy players for demonstration
    this.players = [
      { id: 'p1', name: 'Ahmed Salah', position: 'Forward' },
      { id: 'p2', name: 'Mohamed Ali', position: 'Midfielder' },
      { id: 'p3', name: 'Omar Hassan', position: 'Defender' },
      { id: 'p4', name: 'Khaled Mahmoud', position: 'Goalkeeper' }
    ];
    console.log('TeamDetailsComponent: Dummy players loaded:', this.players);
  }

  // New: Toggle edit mode
  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      // When entering edit mode, ensure form is populated with current team data
      this.editTeamForm.patchValue({
        name: this.team?.name,
        description: this.team?.description
      });
    }
  }

  // New: Save team changes
  saveTeamChanges(): void {
    if (this.editTeamForm.valid && this.team) {
      const updatedTeam: ITeam = {
        ...this.team, // Keep existing properties
        name: this.editTeamForm.value.name,
        description: this.editTeamForm.value.description
      };

      this.teamService.updateTeam(updatedTeam).pipe(takeUntil(this.destroy$)).subscribe({
        next: (responseTeam) => {
          this.team = responseTeam; // Update local team object with the response
          this.successMessage = 'Team updated successfully!';
          this.errorMessage = null;
          this.isEditing = false; // Exit edit mode
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (err) => {
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

  // New: Remove player
  removePlayer(playerId: string): void {
    if (confirm('Are you sure you want to remove this player from the team?')) {
      console.log(`TeamDetailsComponent: Removing player ${playerId} from team ${this.team?.name}`);
      // In a real app, this would be an API call to remove the player
      this.players = this.players.filter(player => player.id !== playerId);
      this.successMessage = 'Player removed successfully!';
      this.errorMessage = null;
      setTimeout(() => this.successMessage = null, 3000);
    }
  }

  goToInvitePlayer(teamId: string): void {
    console.log(`TeamDetailsComponent: Navigating to invite player page for team ID: ${teamId}`);
    this.router.navigate(['/dashboard/teams', teamId, 'invite']);
  }

  goBackToList(): void {
    console.log('TeamDetailsComponent: Attempting to navigate back to team list.');
    this.router.navigate(['/dashboard/teams']);
  }
}
