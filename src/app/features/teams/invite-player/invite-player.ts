import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf,NgFor } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-invite-player',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './invite-player.html',
  styleUrls: ['./invite-player.css']
})
export class InvitePlayer implements OnInit {
  invitePlayerForm!: FormGroup;
  teamId: string | null = null;
  teamName: string = '';
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    console.log('InvitePlayerComponent: Initialized.');
    // Get teamId from route parameters
    this.route.paramMap.subscribe(params => {
      // !!! IMPORTANT CHANGE HERE: Use 'id' to match the route definition 'teams/:id/invite'
      this.teamId = params.get('id');
      console.log('InvitePlayerComponent: Team ID from route params for invite:', this.teamId);
      if (this.teamId) {
        this.loadTeamName(this.teamId); // Load team name for display
      } else {
        this.errorMessage = 'Team ID is missing. Cannot invite player.';
        console.error('InvitePlayerComponent: Team ID is missing for invitation. Redirecting to team list.');
        setTimeout(() => this.router.navigate(['/dashboard/teams']), 2000);
      }
    });

    // Initialize the form with validators
    this.invitePlayerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // Load team name from localStorage for display purposes
  loadTeamName(id: string): void {
    try {
      const storedTeams = localStorage.getItem('teams');
      if (storedTeams) {
        const teams: any[] = JSON.parse(storedTeams);
        const team = teams.find(t => t.id === id);
        if (team) {
          this.teamName = team.name;
          console.log(`InvitePlayerComponent: Team name "${this.teamName}" loaded for invitation.`);
        } else {
          this.errorMessage = 'Team not found.';
          console.warn(`InvitePlayerComponent: Team with ID "${id}" not found when loading name for invitation. Redirecting to team list.`);
          setTimeout(() => this.router.navigate(['/dashboard/teams']), 2000);
        }
      } else {
        this.errorMessage = 'No teams found in local storage.';
        console.warn('InvitePlayerComponent: No teams found in localStorage when loading name for invitation. Redirecting to team list.');
        setTimeout(() => this.router.navigate(['/dashboard/teams']), 2000);
      }
    } catch (error: any) {
      console.error("InvitePlayerComponent: Error loading team name:", error);
      this.errorMessage = `Error loading team name: ${error.message}`;
    }
  }

  // Handle form submission
  async onSubmit(): Promise<void> {
    this.successMessage = null;
    this.errorMessage = null;

    if (this.invitePlayerForm.valid && this.teamId) {
      const inviteData = {
        id: Date.now().toString(), // Unique ID for the invitation
        teamId: this.teamId,
        teamName: this.teamName, // Store team name for easier display later
        playerEmail: this.invitePlayerForm.value.email,
        status: 'pending', // Initial status
        timestamp: new Date().toISOString()
      };

      try {
        const existingInvitesString = localStorage.getItem('teamInvites');
        let invites: any[] = [];
        if (existingInvitesString) {
          invites = JSON.parse(existingInvitesString);
          console.log('InvitePlayerComponent: Existing invites loaded from localStorage:', invites);
        } else {
          console.log('InvitePlayerComponent: No existing invites found in localStorage. Starting with an empty array.');
        }

        invites.push(inviteData);
        localStorage.setItem('teamInvites', JSON.stringify(invites));
        console.log('InvitePlayerComponent: Invitation sent and saved to localStorage:', inviteData);
        console.log('InvitePlayerComponent: All invitations in localStorage now:', invites);

        this.successMessage = `Invitation sent to ${inviteData.playerEmail} for team "${this.teamName}"!`;
        this.invitePlayerForm.reset(); // Clear the form
        // Optionally navigate back to team details or team list
        setTimeout(() => {
          console.log('InvitePlayerComponent: Navigating back to team details page...');
          this.router.navigate(['/dashboard/teams', this.teamId]); // Go back to team details
        }, 2000);

      } catch (error: any) {
        console.error("InvitePlayerComponent: Error saving invitation to local storage:", error);
        this.errorMessage = `Failed to send invitation: ${error.message}`;
      }
    } else {
      this.errorMessage = 'Please enter a valid email address.';
      this.invitePlayerForm.markAllAsTouched();
      console.warn('InvitePlayerComponent: Form is invalid. Please check email field.');
    }
  }

  // Helper to get form controls for easier access in the template
  get f() { return this.invitePlayerForm.controls; }

  // Navigate back to the team details page
  goBackToTeamDetails(): void {
    console.log('InvitePlayerComponent: Attempting to navigate back to team details.');
    if (this.teamId) {
      this.router.navigate(['/dashboard/teams', this.teamId]);
    } else {
      console.warn('InvitePlayerComponent: Team ID not available for navigation. Redirecting to team list.');
      this.router.navigate(['/dashboard/teams']); // Fallback
    }
  }
}
