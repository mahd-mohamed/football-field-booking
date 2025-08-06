import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { TeamService, ITeam } from '../../../core/services/team.service';
import { takeUntil ,Subject} from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-create-team',
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './create-team.html',
  styleUrls: ['./create-team.css']
})
export class CreateTeam implements OnInit {
  createTeamForm!: FormGroup;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  private destroy$ = new Subject<void>();


  constructor(private fb: FormBuilder, private router: Router, private teamService: TeamService, private authService: AuthService) { }

  ngOnInit(): void {
    // Initialize the form with validators
    this.createTeamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(500)]]
    });
    console.log('CreateTeamComponent initialized.');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Handle form submission
  onSubmit(): void {
    this.successMessage = null; // Clear previous messages
    this.errorMessage = null;

    if (this.createTeamForm.valid) {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.errorMessage = 'User not authenticated. Please login again.';
        return;
      }
      // Build team data to send to the service
      const teamData: Omit<ITeam, 'id' | 'createdAt' | 'createdBy' | 'createdByUsername' | 'members'> = {
        name: this.createTeamForm.value.name,
        description: this.createTeamForm.value.description
      };

      // Call the createTeam method from the service
      this.teamService.createTeam(teamData)
        .pipe(takeUntil(this.destroy$)) // Ensure subscription is cleaned up
        .subscribe({
          next: (newTeam) => {
            console.log('Team created successfully via service:', newTeam);
            this.successMessage = `Team "${newTeam.name}" created successfully!`;
            this.createTeamForm.reset(); // Clear the form after successful submission

            // Trigger sidebar refresh by dispatching a custom event
            window.dispatchEvent(new CustomEvent('teamCreated', {
              detail: { teamId: newTeam.id, userId: currentUser.id }
            }));

            // Navigate to the team list page immediately
            console.log('Navigating to team list page...');
            this.router.navigate(['/dashboard/teams']);
          },
          error: (err) => {
            console.error("Error creating team via service:", err);
            this.errorMessage = `Failed to create team: ${err.message || 'An unknown error occurred'}`;
          }
        });
    } else {
      this.errorMessage = 'Please fix the errors in the form.';
      this.createTeamForm.markAllAsTouched();
      console.warn('Form is invalid. Please check fields.');
    }
  }

  // Helper to get form controls for easier access in the template
  get f() { return this.createTeamForm.controls; }
}
