import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { IUser } from '../../../core/models/iuser.model';

import { TeamService } from '../../../core/services/team.service';
import { UserService } from '../../../core/services/user.service';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  currentUser: IUser | null = null;
  isEditing = false;
  isLoading = false;
  isSaving = false;
  effectiveRole: string = 'USER';
  userTeams: any[] = [];

  // Form data for editing
  editForm = {
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    private authService: AuthService,
    private teamService: TeamService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;

    // Get current user from auth service
    const user = this.authService.getCurrentUser();

    if (user) {
      // Convert User to UserProfile and add default status
      this.currentUser = {
        ...user,
        status: 'ACTIVE' // Default to ACTIVE since User type doesn't have status
      };
      this.editForm.username = this.currentUser.username;

      // Load user teams and determine effective role
      this.loadUserTeams();
    }

    this.isLoading = false;
  }

  private loadUserTeams(): void {
    if (!this.currentUser) return;

    // Load teams created by the current user
    this.teamService.getTeamsByCreator().subscribe({
      next: (teams) => {
        this.userTeams = teams;
        this.checkIfUserIsOrganizer();
      },
      error: (error) => {
        console.error('Error loading user teams:', error);
        this.setEffectiveRole();
      }
    });
  }

  private checkIfUserIsOrganizer(): void {
    if (!this.currentUser) return;

    // Check if user is organizer in any team
    const checkPromises = this.userTeams.map(team =>
      this.teamService.isUserTeamOrganizer(team.id).toPromise()
    );

    Promise.all(checkPromises).then(results => {
      const isOrganizerInAnyTeam = results.some(isOrganizer => isOrganizer);
      this.setEffectiveRole(isOrganizerInAnyTeam);
    }).catch(error => {
      console.error('Error checking organizer status:', error);
      this.setEffectiveRole();
    });
  }

  private setEffectiveRole(isOrganizerInAnyTeam: boolean = false): void {
    if (this.currentUser?.role === 'ADMIN') {
      this.effectiveRole = 'ADMIN';
    }  else {
      this.effectiveRole = 'USER';
    }
  }

  startEditing(): void {
    this.isEditing = true;
    this.editForm.username = this.currentUser?.username || '';
    this.editForm.currentPassword = '';
    this.editForm.newPassword = '';
    this.editForm.confirmPassword = '';
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.editForm.username = this.currentUser?.username || '';
    this.editForm.currentPassword = '';
    this.editForm.newPassword = '';
    this.editForm.confirmPassword = '';
  }

  saveProfile(): void {
    if (!this.currentUser) {
      this.snackBar.open('User not found', 'Close', { duration: 3000 });
      return;
    }

    // Validate form
    if (!this.editForm.username.trim()) {
      this.snackBar.open('Username is required', 'Close', { duration: 3000 });
      return;
    }

    // If password is being changed, validate password fields
    if (this.editForm.newPassword || this.editForm.currentPassword) {
      if (!this.editForm.currentPassword) {
        this.snackBar.open('Current password is required', 'Close', { duration: 3000 });
        return;
      }
      if (!this.editForm.newPassword) {
        this.snackBar.open('New password is required', 'Close', { duration: 3000 });
        return;
      }
      if (this.editForm.newPassword !== this.editForm.confirmPassword) {
        this.snackBar.open('New passwords do not match', 'Close', { duration: 3000 });
        return;
      }
      if (this.editForm.newPassword.length < 6) {
        this.snackBar.open('New password must be at least 6 characters', 'Close', { duration: 3000 });
        return;
      }

      // Validate current password
      const isValidPassword = this.userService.checkPassword(this.editForm.currentPassword);
      isValidPassword.subscribe({
        next: (isValid) => {
          if (!isValid) {
            this.snackBar.open('Current password is incorrect', 'Close', { duration: 3000 });
            return;
          }
        },
        error: (error) => {
          console.error('Error checking password:', error);
          this.snackBar.open('Error checking current password', 'Close', { duration: 3000 });
        }
      });
    }

    this.isSaving = true;

    if (this.currentUser) {
      const updates: Record<string, any> = {};

      // Only include username if it changed
      if (this.editForm.username && this.editForm.username !== this.currentUser.username) {
        updates['username'] = this.editForm.username;
      }

      // Only include password if a new password is provided
      if (this.editForm.newPassword) {
        updates['password'] = this.editForm.newPassword;
      }

      // Only make the API call if there’s something to update
      if (Object.keys(updates).length > 0) {
        this.userService.updateUser(this.currentUser.id, updates).subscribe(() => {
          // Update current user in sessionStorage with new username if changed
          if (updates['username']) {
            if (this.currentUser) {
              this.currentUser.username = updates['username'];
              this.authService.setCurrentUser(this.currentUser);
            }
          }
          this.snackBar.open('Profile updated successfully', 'Close', { duration: 2000 });
        });
      } else {
        this.snackBar.open('No changes to update', 'Close', { duration: 2000 });
        this.isSaving = false;
        return;
      }

      this.isEditing = false;
      this.isSaving = false;
    }
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'ADMIN': return 'ADMIN';
      // case 'ORGANIZER': return 'Organizer';
      // case 'PLAYER': return 'Player';
      case 'USER':return 'USER';
      default: return role;
    }
  }

  getStatusDisplayName(status: string | undefined): string {
    if (!status) return 'Active'; // Default to Active if status is undefined
    switch (status) {
      case 'ACTIVE': return 'Active';
      case 'INACTIVE': return 'Inactive';
      default: return status;
    }
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'ADMIN': return 'danger';
      // case 'ORGANIZER': return 'primary';
      case 'USER': return 'primary';
      default: return 'secondary';
    }
  }

  getStatusColor(status: string | undefined): string {
    if (!status) return 'success'; // Default to success if status is undefined
    return status === 'ACTIVE' ? 'success' : 'secondary';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
