import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { Router } from '@angular/router';

import { IUser } from '../../../core/models/iuser.model';

// interface User {
//   id: string;
//   username: string;
//   email: string;
//   role: 'ADMIN' | 'USER' | 'ORGANIZER';
//   status: 'ACTIVE' | 'INACTIVE';
//   // createdAt: string;
// }

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
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css']
})
export class UserList implements OnInit, AfterViewInit {

  dataSource = new MatTableDataSource<IUser>([]);

  allUsers: IUser[] = [];
  currentUser: any;
  isLoading = false;
  error: string | null = null;


  // Pagination properties
  totalUsers = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50];

  // Sorting properties
  sortBy = 'createdAt';
  sortDirection = 'asc';

  // Filter properties (optional)
  emailFilter = '';
  usernameFilter = '';
  roleFilter = '';
  statusFilter = '';

  // ViewChild decorators to access Material components
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;


  // // Filter properties
  // @ViewChild(MatSort) sort!: MatSort;
  // searchTerm = '';
  // roleFilter = '';
  // statusFilter = '';

  displayedColumns: string[] = ['id', 'username', 'email', 'role', 'status', 'actions'];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    // Configure paginator for server-side pagination
    if (this.paginator) {
      this.paginator.length = this.totalUsers;
      this.paginator.pageSize = this.pageSize;
      this.paginator.pageIndex = this.currentPage;
    }

    // Configure sorting for server-side sorting
    if (this.sort) {
      // Connect the data source to the sort (for visual indication)
      this.dataSource.sort = this.sort;

      // Set initial sort state
      this.sort.active = this.sortBy;
      this.sort.direction = this.sortDirection as 'asc' | 'desc';
    }
  }


  onPageChange(event: PageEvent): void {
    console.log('Page change event:', event);
    console.log(`Requesting page ${event.pageIndex} with size ${event.pageSize}`);

    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;

    // Call API with pagination parameters
    this.loadUsers();
  }

  onSortChange(sortEvent?: Sort): void {
    console.log('Sort change triggered:', sortEvent);

    // Use the event parameter if provided, otherwise use the sort ViewChild
    const sort = sortEvent || this.sort;

    if (sort && sort.active && sort.direction) {
      this.sortBy = sort.active;
      this.sortDirection = sort.direction;

      // Reset to first page when sorting changes
      this.currentPage = 0;
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }

      // Update the MatSort visual state
      if (this.sort && sortEvent) {
        this.sort.active = sort.active;
        this.sort.direction = sort.direction as 'asc' | 'desc';
      }

      console.log(`🔄 Sorting by ${this.sortBy} in ${this.sortDirection} direction`);
      this.loadUsers();
    } else if (sort && sort.active && !sort.direction) {
      // Handle the case when sort is cleared (no direction)
      this.sortBy = 'createdAt'; // Reset to default sort
      this.sortDirection = 'asc'; // Reset to default direction

      // Reset to first page when sorting changes
      this.currentPage = 0;
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }

      // Update the MatSort visual state
      if (this.sort) {
        this.sort.active = this.sortBy;
        this.sort.direction = this.sortDirection as 'asc' | 'desc';
      }

      console.log(`🔄 Sort cleared, resetting to default: ${this.sortBy} ${this.sortDirection}`);
      this.loadUsers();
    } else {
      console.log('❌ Sort event is invalid:', { sort, active: sort?.active, direction: sort?.direction });
    }
  }

  /**
   * Apply filters and reload users
   */
  applyFilters(): void {
    // Reset to first page when applying filters
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadUsers();
  }

  /**
   * Clear all filters and reload users
   */
  clearFilters(): void {
    this.emailFilter = '';
    this.usernameFilter = '';
    this.roleFilter = '';
    this.statusFilter = '';
    this.applyFilters();
  }


  loadUsers(): void {
    console.log('Loading users with pagination and sorting:', {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
      filters: {
        email: this.emailFilter,
        username: this.usernameFilter,
        role: this.roleFilter,
        status: this.statusFilter
      }
    });
    this.isLoading = true;
    this.error = null;

    this.userService.getAllUsers(
      this.currentPage,
      this.pageSize,
      this.sortBy,
      this.sortDirection,
      this.emailFilter || undefined,
      this.roleFilter || undefined,
      this.statusFilter || undefined,
      this.usernameFilter || undefined
    ).subscribe({
      next: (response) => {
        console.log('Received users from API:', response);
        let users: IUser[] = [];

        // Handle both paginated and non-paginated responses
        if (response.content) {
          // Paginated response from backend
          users = response.content;
          this.totalUsers = response.totalElements;
        } else {
          // Non-paginated response
          users = response;
          this.totalUsers = response.length;
        }

        // Update the data source
        this.dataSource.data = users;
        this.isLoading = false;

        // Update paginator after data is loaded
        if (this.paginator) {
          this.paginator.length = this.totalUsers;
        }

        // Ensure sort state is preserved visually
        if (this.sort && this.sortBy && this.sortDirection) {
          this.sort.active = this.sortBy;
          this.sort.direction = this.sortDirection as 'asc' | 'desc';
        }
      },
      error: (err) => {
        this.error = 'Failed to load users';
        this.isLoading = false;
        console.error('Error loading Users:', err);
      }
    });
  }


  changeUserRole(userId: string, newRole: 'ADMIN' | 'USER'): void {
    // Prevent user from changing their own role
    if (this.currentUser && this.currentUser.id === userId) {
      console.warn('Cannot change your own role');
      this.snackBar.open('You cannot change your own role!', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    this.userService.updateUser(userId, { role: newRole }).subscribe({
      next: () => {
        console.log(`User role updated successfully: ${userId} to ${newRole}`);
        this.snackBar.open(`User role updated to ${newRole} successfully!`, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.loadUsers(); // Reload users to reflect changes
      },
      error: (err) => {
        console.error('Error updating user role:', err);
        this.snackBar.open('Failed to update user role. Please try again.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  changeUserStatus(userId: string, newStatus: 'ACTIVE' | 'INACTIVE'): void {
    // Prevent user from changing their own status
    if (this.currentUser && this.currentUser.id === userId) {
      console.warn('Cannot change your own status');
      this.snackBar.open('You cannot change your own status!', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }
    this.userService.updateUser(userId, { status: newStatus }).subscribe({
      next: () => {
        console.log(`User status updated successfully: ${userId} to ${newStatus}`);
        this.snackBar.open(`User status updated to ${newStatus} successfully!`, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.loadUsers(); // Reload users to reflect changes
      },
      error: (err) => {
        console.error('Error updating user status:', err);
        this.snackBar.open('Failed to update user status. Please try again.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }



  getRoleColor(role: string): string {
    switch (role) {
      case 'ADMIN': return 'warn';
      case 'USER': return 'accent';
      // case 'ORGANIZER': return 'primary';
      default: return 'primary';
    }
  }

  getStatusColor(status: string): string {
    return status === 'ACTIVE' ? 'primary' : 'warn';
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  // // Add a helper method to check if user can modify another user
  canModifyUser(userId: string): boolean {
    return this.currentUser && this.currentUser.id !== userId;
  }
}
