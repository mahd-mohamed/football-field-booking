import { Component, OnInit, ViewChild } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Auth } from '../../../core/services/auth';
import { Router } from '@angular/router';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'ORGANIZER';
  status: 'ACTIVE' | 'INACTIVE';
  // createdAt: string;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css']
})
export class UserList implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  allUsers: User[] = [];
  filteredUsers: User[] = [];
  currentUser: any;
  isLoading = false;

  // // Filter properties
  // searchTerm = '';
  // roleFilter = '';
  // statusFilter = '';

  displayedColumns: string[] = ['id', 'username', 'email', 'role', 'status',  'actions'];

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    
    // Simulate loading users from localStorage
    const usersString = localStorage.getItem('users');
    if (usersString) {
      this.allUsers = JSON.parse(usersString);
      // Ensure all users have status field
      this.allUsers = this.allUsers.map(user => ({
        ...user,
        status: user.status || 'ACTIVE' // Default to ACTIVE if status is missing
      }));
    } else {
      // Initialize with default users
      this.allUsers = [
        { id: 1, username: 'admin', email: 'admin@admin.com', role: 'ADMIN', status: 'ACTIVE' },
        { id: 2, username: 'organizer', email: 'org@org.com', role: 'ORGANIZER', status: 'ACTIVE'},
        { id: 3, username: 'player', email: 'player@player.com', role: 'USER', status: 'ACTIVE'}
      ];
      localStorage.setItem('users', JSON.stringify(this.allUsers));
    }
    
    this.filteredUsers = [...this.allUsers];
    this.isLoading = false;
  }

  // applyFilters(): void {
  //   this.filteredUsers = this.allUsers.filter(user => {
  //     const matchesSearch = user.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
  //                          user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
  //     const matchesRole = !this.roleFilter || user.role === this.roleFilter;
  //     const matchesStatus = !this.statusFilter || user.status === this.statusFilter;
      
  //     return matchesSearch && matchesRole && matchesStatus;
  //   });
  // }

  changeUserRole(userId: number, newRole: 'ADMIN' | 'USER' | 'ORGANIZER'): void {
    const user = this.allUsers.find(u => u.id === userId);
    if (user) {
      user.role = newRole;
      // Update localStorage
      localStorage.setItem('users', JSON.stringify(this.allUsers));
      this.filteredUsers = [...this.allUsers];
    }
  }

  changeUserStatus(userId: number, newStatus: 'ACTIVE' | 'INACTIVE'): void {
    const user = this.allUsers.find(u => u.id === userId);
    if (user) {
      user.status = newStatus;
      // Update localStorage
      localStorage.setItem('users', JSON.stringify(this.allUsers));
      this.filteredUsers = [...this.allUsers];
    }
  }

 

  getRoleColor(role: string): string {
    switch (role) {
      case 'ADMIN': return 'warn';
      case 'ORGANIZER': return 'primary';
      case 'USER': return 'accent';
      default: return 'primary';
    }
  }

  getStatusColor(status: string): string {
    return status === 'ACTIVE' ? 'primary' : 'warn';
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }
}
