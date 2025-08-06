import { Component, OnInit,OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { TeamService, TeamMemberRole } from '../../../core/services/team.service';
import { TeamMemberService } from '../../../core/services/team-member.service';



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
    private teamService: TeamService,
    private teamMemberService: TeamMemberService,
    private authService: AuthService
  ) {
    // Initialize the form with email validation
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
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

      console.log(`InvitePlayerComponent: Attempting to invite user with email: ${email} to team ${this.teamId} as ${role}`);

      // Show loading state
      this.inviteForm.disable();

      // Call the new inviteUserByEmail method
      this.teamMemberService.inviteUserByEmail(this.teamId, email)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (member) => {
            this.successMessage = `Invitation sent successfully to ${email}!`;
            console.log('InvitePlayerComponent: Invitation successful:', member);

            // Reset form and navigate back immediately
            this.inviteForm.reset();
            this.router.navigate(['/dashboard/teams', this.teamId]);
          },
          error: (err) => {
            this.errorMessage = `Failed to send invitation: ${err.message || 'Unknown error'}`;
            console.error('InvitePlayerComponent: Invitation failed:', err);
            this.inviteForm.enable();
          },
          complete: () => {
            this.inviteForm.enable();
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
