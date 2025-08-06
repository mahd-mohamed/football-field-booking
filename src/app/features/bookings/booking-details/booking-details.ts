import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BookingService, IBooking } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { TeamService } from '../../../core/services/team.service';
import { BookingStatus } from '../../../core/services/match-participant.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ConfirmationDialogComponent
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
  isOrganizer: boolean = false;
  
  // Confirmation dialog properties
  showConfirmationDialog: boolean = false;
  confirmationDialogData: ConfirmationDialogData = {
    title: '',
    message: '',
    type: 'warning'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private authService: AuthService,
    private teamService: TeamService,
    private errorHandler: ErrorHandlerService
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
    this.bookingService.getBookingDetailsById(bookingId).subscribe({
      next: (booking) => {
        if (booking) {
          this.booking = booking;

          // Check if current user is an organizer in this team
          this.teamService.getTeamMembers(booking.teamId).subscribe({
            next: (members) => {
              this.isOrganizer = members.some(
                m => m.userId === this.currentUser.id && m.role === 'ORGANIZER'
              );
            },
            error: () => {
              this.isOrganizer = false;
            }
          });

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
      case 'PENDING_PLAYERS':
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
      case 'PENDING_PLAYERS':
        return 'Pending Players';
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

    this.confirmationDialogData = {
      title: 'Cancel Booking',
      message: `Are you sure you want to cancel this booking for ${this.booking.placeName}? This action cannot be undone.`,
      confirmText: 'Cancel Booking',
      cancelText: 'Keep Booking',
      type: 'danger'
    };
    this.showConfirmationDialog = true;
  }

  private executeCancelBooking(): void {
    if (!this.booking) return;

    this.bookingService.cancelBooking(this.booking.id).subscribe({
      next: () => {
        // Show success snack bar notification
        this.errorHandler.showSuccessNotification('Booking cancelled successfully!');
        
        this.successMessage = 'Booking cancelled successfully!';
        this.loadBookingDetails(); // Reload booking details
        this.closeConfirmationDialog();
        // Success message will be cleared by user interaction or page navigation
      },
      error: (error) => {
        console.error('Error cancelling booking:', error);
        this.errorMessage = 'Failed to cancel booking. Please try again.';
        this.closeConfirmationDialog();
        // Error message will be cleared by user interaction or page navigation
      }
    });
  }

  closeConfirmationDialog(): void {
    this.showConfirmationDialog = false;
  }

  onConfirmationConfirmed(): void {
    this.executeCancelBooking();
  }

  onConfirmationCancelled(): void {
    this.closeConfirmationDialog();
  }

  get isCancelableByTime(): boolean {
  if (!this.booking) return false;

  const now = new Date().getTime();
  const matchStart = new Date(this.booking.startTime).getTime();
  const threeHoursInMs = 3 * 60 * 60 * 1000;

  return matchStart - now > threeHoursInMs;
}

canCancelBooking(): boolean {
  if (!this.booking || !this.currentUser) return false;

  return (
    this.isOrganizer &&
    this.booking.status !== 'CANCELLED' &&
    this.isCancelableByTime
  );
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
    return new Date(this.booking.startTime) > new Date();
  }

  isPast(): boolean {
    if (!this.booking) return false;
    return new Date(this.booking.startTime) < new Date();
  }
}
