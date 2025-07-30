import { Component, OnInit,OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Auth, User } from '../../../core/services/auth';
import { Team, TeamMemberRole } from '../../../core/services/team';

@Component({
  selector: 'app-invite-player',
    imports: [ReactiveFormsModule, NgIf],
  templateUrl: './invite-player.html',
  styleUrls: ['./invite-player.css']
})
export class InvitePlayer implements OnInit, OnDestroy {
  inviteForm!: FormGroup;
  teamId!: string;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private teamService: Team,
    private authService: Auth
  ) { }

  ngOnInit(): void {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]] // Changed to email input
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.teamId = id;
        console.log('InvitePlayerComponent: Team ID from route:', this.teamId);
      } else {
        this.errorMessage = 'Team ID is missing. Cannot invite players.';
        console.error('InvitePlayerComponent: Team ID missing in route.');
        this.router.navigate(['/dashboard/teams']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.inviteForm.valid && this.teamId) {
      const { email } = this.inviteForm.value; 
      const role: TeamMemberRole = 'MEMBER'; 
      const currentUser = this.authService.getCurrentUser();
      
      if (!currentUser) {
        this.errorMessage = 'User not authenticated. Please login again.';
        return;
      }

      console.log(`InvitePlayerComponent: Attempting to invite user with email: ${email} to team ${this.teamId} as ${role} by ${currentUser.id}`);

      // For now, we'll use a mock user since getUserByEmail doesn't exist
      // In a real app, you would implement this method in the team service
      const mockUser = {
        id: 999, // Mock user ID
        username: email.split('@')[0], // Use email prefix as username
        email: email
      };

      // Add team member with the required parameters
      this.teamService.addTeamMember(
        this.teamId, 
        mockUser.id, 
        mockUser.username, 
        mockUser.email, 
        role, 
        'PENDING', 
        currentUser.id
      ).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (member) => {
            this.successMessage = `Player ${mockUser.username} (${mockUser.email}) invited successfully! Status: ${member.status}`;
            console.log('InvitePlayerComponent: Invitation successful:', member);
            setTimeout(() => {
              this.router.navigate(['/dashboard/teams', this.teamId]);
            }, 1500);
          },
          error: (err) => {
            this.errorMessage = `Failed to invite player: ${err.message || 'Unknown error'}`;
            console.error('InvitePlayerComponent: Invitation failed:', err);
          }
        });

    } else {
      this.errorMessage = 'Please enter a valid email address.';
      this.inviteForm.markAllAsTouched();
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/teams', this.teamId]);
  }
}
