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

interface UserProfile extends User {
  status?: 'ACTIVE' | 'INACTIVE'; // Extended to include status
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

  // Form data for editing
  editForm = {
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    private authService: Auth,
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
    }
    
    this.isLoading = false;
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
    }

    this.isSaving = true;

    // Simulate API call to update profile
    setTimeout(() => {
      if (this.currentUser) {
        // Update user data
        this.currentUser.username = this.editForm.username;
        
        // Update in localStorage (simulating database update)
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex((u: any) => u.id === this.currentUser?.id);
        if (userIndex !== -1) {
          users[userIndex].username = this.editForm.username;
          localStorage.setItem('users', JSON.stringify(users));
        }

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
      case 'PLAYER': return 'Player';
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
      case 'ORGANIZER': return 'primary';
      case 'PLAYER': return 'success';
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
