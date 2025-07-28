import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BookingService, IBooking, BookingStatus } from '../../../core/services/booking';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './booking-list.html',
  styleUrls: ['./booking-list.css']
})
export class BookingListComponent implements OnInit {
  upcomingBookings: IBooking[] = [];
  currentUser: any;
  
  successMessage: string | null = null;
  errorMessage: string | null = null;
  isLoading: boolean = false;

  // Table data
  displayedColumns: string[] = ['place', 'team', 'date', 'time', 'status', 'actions'];

  constructor(
    private bookingService: BookingService,
    private authService: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadBookings();
  }

  loadBookings(): void {
    if (!this.currentUser) {
      this.errorMessage = 'User not authenticated.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    // Load upcoming bookings only
    this.bookingService.getUpcomingBookings(this.currentUser.id).subscribe({
      next: (bookings) => {
        this.upcomingBookings = bookings;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading upcoming bookings:', error);
        this.errorMessage = 'Failed to load upcoming bookings.';
        this.isLoading = false;
      }
    });
  }

  getStatusColor(status: BookingStatus): string {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'PENDING_PAYMENT':
        return 'warning';
      case 'PENDING':
        return 'info';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  }

  getStatusText(status: BookingStatus): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmed';
      case 'PENDING_PAYMENT':
        return 'Pending Payment';
      case 'PENDING':
        return 'Pending';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  formatDateTime(startTime: string, endTime: string): string {
    const start = this.formatTime(startTime);
    const end = this.formatTime(endTime);
    return `${start} - ${end}`;
  }

  cancelBooking(booking: IBooking): void {
    if (confirm(`Are you sure you want to cancel this booking for ${booking.place_name}?`)) {
      this.bookingService.cancelBooking(booking.id).subscribe({
        next: () => {
          this.successMessage = 'Booking cancelled successfully!';
          this.loadBookings(); // Reload bookings
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (error) => {
          console.error('Error cancelling booking:', error);
          this.errorMessage = 'Failed to cancel booking. Please try again.';
          setTimeout(() => {
            this.errorMessage = null;
          }, 3000);
        }
      });
    }
  }

  createNewBooking(): void {
    this.router.navigate(['/dashboard/bookings/create']);
  }

  viewBookingDetails(booking: IBooking): void {
    this.router.navigate(['/dashboard/bookings', booking.id]);
  }

  canCancelBooking(booking: IBooking): boolean {
    if (!this.currentUser) return false;
    return booking.user_id === this.currentUser.id && booking.status !== 'CANCELLED';
  }

  isUpcoming(booking: IBooking): boolean {
    return new Date(booking.start_time) > new Date();
  }

  getBookingCardClass(booking: IBooking): string {
    if (booking.status === 'CANCELLED') {
      return 'cancelled-booking';
    }
    if (this.isUpcoming(booking)) {
      return 'upcoming-booking';
    }
    return 'past-booking';
  }
} 