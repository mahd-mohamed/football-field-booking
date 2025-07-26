import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf ,NgFor } from '@angular/common'; // Import CommonModule for ngIf
import { Router } from '@angular/router'; // Import Router for navigation

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

  constructor(private fb: FormBuilder, private router: Router) { }

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
      const teamData = {
        id: Date.now().toString(), // Simple unique ID for localStorage
        ...this.createTeamForm.value
      };

      try {
        // Retrieve existing teams from localStorage
        const existingTeamsString = localStorage.getItem('teams');
        let teams: any[] = [];
        if (existingTeamsString) {
          teams = JSON.parse(existingTeamsString);
          console.log('Existing teams loaded from localStorage:', teams);
        } else {
          console.log('No existing teams found in localStorage. Starting with an empty array.');
        }

        // Add the new team
        teams.push(teamData);

        // Save the updated teams array back to localStorage
        localStorage.setItem('teams', JSON.stringify(teams));
        console.log('Team created successfully and saved to localStorage:', teamData);
        console.log('All teams in localStorage now:', teams);


        this.successMessage = `Team "${teamData.name}" created successfully with ID: ${teamData.id}!`;
        this.createTeamForm.reset(); // Clear the form after successful submission
        
        // Navigate to the team list page after a short delay
        setTimeout(() => {
          console.log('Navigating to team list page...');
          this.router.navigate(['/dashboard/teams']); // Changed to '/dashboard/teams' as per new routing
        }, 1500);

      } catch (error: any) {
        console.error("Error saving team to local storage:", error);
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
