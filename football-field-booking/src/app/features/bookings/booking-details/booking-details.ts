import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BookingService, IBooking, BookingStatus } from '../../../core/services/booking';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './booking-details.html',
  styleUrls: ['./booking-details.css']
})
export class BookingDetailsComponent implements OnInit {
  booking: IBooking | null = null;
  currentUser: any;
  
  successMessage: string | null = null;
  errorMessage: string | null = null;
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private authService: Auth
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadBookingDetails();
  }

  loadBookingDetails(): void {
    const bookingId = this.route.snapshot.paramMap.get('id');
    if (!bookingId) {
      this.errorMessage = 'Booking ID not provided.';
      return;
    }

    this.isLoading = true;
    this.bookingService.getBookingById(bookingId).subscribe({
      next: (booking) => {
        if (booking) {
          this.booking = booking;
        } else {
          this.errorMessage = 'Booking not found.';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading booking details:', error);
        this.errorMessage = 'Failed to load booking details.';
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
      month: 'long',
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

  cancelBooking(): void {
    if (!this.booking) return;

    if (confirm(`Are you sure you want to cancel this booking for ${this.booking.place_name}?`)) {
      this.bookingService.cancelBooking(this.booking.id).subscribe({
        next: () => {
          this.successMessage = 'Booking cancelled successfully!';
          this.loadBookingDetails(); // Reload booking details
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

  canCancelBooking(): boolean {
    if (!this.booking || !this.currentUser) return false;
    return this.booking.user_id === this.currentUser.id && this.booking.status !== 'CANCELLED';
  }

  goBack(): void {
    // Check if user is admin and navigate accordingly
    if (this.currentUser && this.currentUser.role === 'ADMIN') {
      this.router.navigate(['/dashboard/admin/bookings']);
    } else {
      this.router.navigate(['/dashboard/bookings']);
    }
  }

  isUpcoming(): boolean {
    if (!this.booking) return false;
    return new Date(this.booking.start_time) > new Date();
  }

  isPast(): boolean {
    if (!this.booking) return false;
    return new Date(this.booking.start_time) < new Date();
  }
}
