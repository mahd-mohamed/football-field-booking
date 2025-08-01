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
import { Auth, User } from '../../../core/services/auth';
import { Team } from '../../../core/services/team';

interface UserProfile extends User {
  createdAt?: string;
}

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
  currentUser: UserProfile | null = null;
  isEditing = false;
  isLoading = false;
  isSaving = false;
  effectiveRole: string = 'PLAYER';
  userTeams: any[] = [];

  // Form data for editing
  editForm = {
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    private authService: Auth,
    private teamService: Team,
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
      // Convert User to UserProfile
      this.currentUser = {
        ...user,
        status: user.status || 'ACTIVE' // Use existing status or default to ACTIVE
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
    this.teamService.getTeamsByCreator(this.currentUser.id).subscribe({
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
      this.teamService.isUserTeamOrganizer(this.currentUser!.id, team.id).toPromise()
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
    } else if (this.currentUser?.role === 'ORGANIZER' || isOrganizerInAnyTeam) {
      this.effectiveRole = 'ORGANIZER';
    } else {
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
      if (this.editForm.currentPassword !== this.currentUser.password) {
        this.snackBar.open('Current password is incorrect', 'Close', { duration: 3000 });
        return;
      }
    }

    this.isSaving = true;

    // Simulate API call to update profile
    setTimeout(() => {
      if (this.currentUser) {
        // Update user data
        this.currentUser.username = this.editForm.username;
        
        // Update password if provided
        if (this.editForm.newPassword) {
          this.currentUser.password = this.editForm.newPassword;
        }
        
        // Update in localStorage (simulating database update)
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex((u: any) => u.id === this.currentUser?.id);
        if (userIndex !== -1) {
          users[userIndex].username = this.editForm.username;
          if (this.editForm.newPassword) {
            users[userIndex].password = this.editForm.newPassword;
          }
          localStorage.setItem('users', JSON.stringify(users));
        }

        // Update current user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        this.isEditing = false;
        this.isSaving = false;
        this.snackBar.open('Profile updated successfully', 'Close', { duration: 2000 });
      }
    }, 1000);
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'ADMIN': return 'Administrator';
      case 'ORGANIZER': return 'Organizer';
      case 'USER': return 'User';
      default: return role;
    }
  }

  getStatusDisplayName(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'INACTIVE':
        return 'Inactive';
      default:
        return 'Unknown';
    }
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'ADMIN': return 'danger';
      case 'ORGANIZER': return 'primary';
      case 'USER': return 'success';
      default: return 'secondary';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
