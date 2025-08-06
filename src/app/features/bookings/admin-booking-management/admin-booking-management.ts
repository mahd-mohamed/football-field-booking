import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { BookingStatus } from '../../../core/services/match-participant.service';
import { BookingService, IBooking } from '../../../core/services/booking.service';

@Component({
  selector: 'app-admin-booking-management',
  standalone: true,
  imports: [
    CommonModule,
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
  templateUrl: './admin-booking-management.html',
  styleUrls: ['./admin-booking-management.css']
})
export class AdminBookingManagementComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  allBookings: IBooking[] = [];
  pendingBookings: IBooking[] = [];
  confirmedBookings: IBooking[] = [];
  cancelledBookings: IBooking[] = [];
  currentUser: any;

  constructor(
    private bookingService: BookingService,
    private authService: AuthService,
    private router: Router
  ) {}

  displayedColumns: string[] = [];

ngOnInit(): void {
  this.currentUser = this.authService.getCurrentUser();
  this.displayedColumns = this.currentUser?.role === 'ADMIN'
    ? ['id', 'user', 'place', 'team', 'date', 'time', 'status', 'actions']
  : ['id', 'place', 'date', 'time', 'status', 'actions'];


  // Admin has all columns
  if (this.currentUser?.role === 'ADMIN') {
    this.displayedColumns = ['id', 'user', 'place', 'team', 'date', 'time', 'status', 'actions'];
  } else {
    // Fallback for non-admin users if same table reused
    this.displayedColumns = ['id', 'place', 'date', 'time', 'status', 'actions'];
  }

  this.loadAllBookings();
}


  loadAllBookings(): void {
    this.bookingService.getBookings().subscribe({
      next: (bookings) => {
        this.allBookings = bookings;
        this.categorizeBookings();
        console.log('All bookings loaded:', this.allBookings);
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
      }
    });
  }

  categorizeBookings(): void {
    this.pendingBookings = this.allBookings.filter(b => b.status === 'PENDING_PAYMENT');
    this.confirmedBookings = this.allBookings.filter(b => b.status === 'CONFIRMED');
    this.cancelledBookings = this.allBookings.filter(b => b.status === 'CANCELLED');
  }

  approveBooking(booking: IBooking): void {
    if (!this.canApprove(booking)) return;

    this.bookingService.confirmBooking(booking.id).subscribe({
      next: () => this.loadAllBookings(),
      error: (error) => console.error('Error confirming booking:', error)
    });
  }

  cancelBooking(booking: IBooking): void {
    if (!this.canCancel(booking)) return;

    this.bookingService.cancelBooking(booking.id).subscribe({
      next: () => this.loadAllBookings(),
      error: (error) => console.error('Error cancelling booking:', error)
    });
  }

  viewBookingDetails(booking: IBooking): void {
    this.router.navigate(['/dashboard/bookings', booking.id]);
  }

  getStatusColor(status: BookingStatus): string {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'PENDING_PLAYERS':
        return 'warning';
      case 'PENDING_PAYMENT':
        return 'info';
      default:
        return 'default';
    }
  }

  getStatusText(status: BookingStatus): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'PENDING_PAYMENT':
        return 'Pending Payment';
      case 'PENDING_PLAYERS':
        return 'Pending Players';
      default:
        return status;
    }
  }

  getStatusIcon(status: BookingStatus): string {
    switch (status) {
      case 'CONFIRMED':
        return 'check_circle';
      case 'CANCELLED':
        return 'cancel';
      case 'PENDING_PAYMENT':
        return 'hourglass_empty';
      case 'PENDING_PLAYERS':
        return 'schedule';
      default:
        return 'help';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  /** Admin can only approve/cancel if booking status is PENDING_PAYMENT */
  canApprove(booking: IBooking): boolean {
    return booking.status === 'PENDING_PAYMENT';
  }

  canCancel(booking: IBooking): boolean {
    return booking.status === 'PENDING_PAYMENT';
  }
}
