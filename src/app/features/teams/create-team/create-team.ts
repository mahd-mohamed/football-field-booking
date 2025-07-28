import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf ,NgFor } from '@angular/common'; // Import CommonModule for ngIf
import { Router } from '@angular/router'; // Import Router for navigation
import { Team } from '../../../core/services/team';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-create-team',
  standalone: true,
  imports: [ReactiveFormsModule,NgIf], // Add CommonModule here
  templateUrl: './create-team.html',
  styleUrls: ['./create-team.css']
})
export class CreateTeam implements OnInit {
  createTeamForm!: FormGroup;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private teamService: Team,
    private authService: Auth
  ) { }

  ngOnInit(): void {
    // Initialize the form with validators
    this.createTeamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(500)]]
    });
    console.log('CreateTeamComponent initialized.');
  }

  // Handle form submission
  async onSubmit(): Promise<void> {
    this.successMessage = null; // Clear previous messages
    this.errorMessage = null;

    if (this.createTeamForm.valid) {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.errorMessage = 'User not authenticated. Please login again.';
        return;
      }

      const teamData = {
        name: this.createTeamForm.value.name,
        description: this.createTeamForm.value.description
      };

      try {
        // Use the team service to create team and automatically assign creator as organizer
        this.teamService.createTeam(
          teamData,
          currentUser.id,
          currentUser.username,
          currentUser.email
        ).subscribe({
          next: (newTeam) => {
            console.log('Team created successfully:', newTeam);
            this.successMessage = `Team "${newTeam.name}" created successfully! You are now the organizer of this team.`;
            this.createTeamForm.reset(); // Clear the form after successful submission
            
            // Navigate to the team list page after a short delay
            setTimeout(() => {
              console.log('Navigating to team list page...');
              this.router.navigate(['/dashboard/teams']);
            }, 1500);
          },
          error: (error) => {
            console.error('Error creating team:', error);
            this.errorMessage = `Failed to create team: ${error.message}`;
          }
        });

      } catch (error: any) {
        console.error("Error creating team:", error);
        this.errorMessage = `Failed to create team: ${error.message}`;
      }
    } else {
      this.errorMessage = 'Please fix the errors in the form.';
      this.createTeamForm.markAllAsTouched();
      console.warn('Form is invalid. Please check fields.');
    }
  }

  // Helper to get form controls for easier access in the template
  get f() { return this.createTeamForm.controls; }
}
