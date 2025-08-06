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
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BookingService, IBooking } from '../../../core/services/booking.service';
import { MatchParticipantService, IMatchParticipant, BookingStatus } from '../../../core/services/match-participant.service';
import { TeamService } from '../../../core/services/team.service';
import { AuthService } from '../../../core/services/auth.service';

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
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './booking-list.html',
  styleUrls: ['./booking-list.css']
})
export class BookingListComponent implements OnInit {
  upcomingBookings: IBooking[] = [];
  oldBookings: IBooking[] = [];
  cancelledBookings: IBooking[] = [];
  currentUser: any;

  successMessage: string | null = null;
  errorMessage: string | null = null;
  isLoading: boolean = false;
  expandedBookingId: string | null = null;
  selectedParticipants: IMatchParticipant[] = [];

  displayedColumns: string[] = ['place', 'team', 'date', 'time', 'status', 'actions'];

  constructor(
    private bookingService: BookingService,
    private matchParticipantService: MatchParticipantService,
    private teamService: TeamService,
    private authService: AuthService,
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

    // ✅ Load bookings where user is organizer
    this.bookingService.getMyMatchesAsOrganizer().subscribe({
      next: (bookings) => {
        const now = new Date();

        // Split into upcoming and old bookings
        this.upcomingBookings = bookings.filter(b => new Date(b.startTime) > now);
        this.oldBookings = bookings.filter(b => new Date(b.startTime) <= now);


        this.cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');
        this.upcomingBookings = bookings.filter(b => b.status !== 'CANCELLED' && new Date(b.startTime) > new Date());
        this.oldBookings = bookings.filter(b => b.status !== 'CANCELLED' && new Date(b.startTime) <= new Date());


        // Sort each list by date
        this.upcomingBookings.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        this.oldBookings.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading organizer bookings:', error);
        this.errorMessage = 'Failed to load bookings where you are organizer.';
        this.isLoading = false;
      }
    });
  }

  getStatusColor(status: BookingStatus): string {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'PENDING_PAYMENT': return 'warning';
      case 'PENDING_PLAYERS': return 'info';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  }

  getStatusText(status: BookingStatus): string {
    switch (status) {
      case 'CONFIRMED': return 'Confirmed';
      case 'PENDING_PAYMENT': return 'Pending Payment';
      case 'PENDING_PLAYERS': return 'Pending Players';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  formatDateTime(startTime: string, endTime: string): string {
    return `${this.formatTime(startTime)} - ${this.formatTime(endTime)}`;
  }

  cancelBooking(booking: IBooking): void {
    if (confirm(`Are you sure you want to cancel this booking for ${booking.placeName}?`)) {
      this.bookingService.cancelBooking(booking.id).subscribe({
        next: () => {
          this.successMessage = 'Booking cancelled successfully!';
          this.loadBookings(); 
          // Success message will be cleared by user interaction or page navigation
        },
        error: (error) => {
          console.error('Error cancelling booking:', error);
          this.errorMessage = 'Failed to cancel booking. Please try again.';
          // Error message will be cleared by user interaction or page navigation
        }
      });
    }
  }

  createNewBooking(): void {
    this.router.navigate(['/dashboard/bookings/create']);
  }

  viewBookingDetails(booking: IBooking): void {
    this.router.navigate(['/dashboard/bookings/details', booking.id]);
  }

  canCancelBooking(booking: IBooking): boolean {
    return this.currentUser && booking.userId === this.currentUser.id && booking.status !== 'CANCELLED';
  }

  isUpcoming(booking: IBooking): boolean {
    return new Date(booking.startTime) > new Date();
  }

  getBookingCardClass(booking: IBooking): string {
    if (booking.status === 'CANCELLED') return 'cancelled-booking';
    return this.isUpcoming(booking) ? 'upcoming-booking' : 'past-booking';
  }

  inviteParticipants(booking: IBooking): void {
    this.router.navigate(
      ['/dashboard/bookings', booking.id, 'invite'],
      { state: { booking } }
    );
  }

  /**
   * Show participants of a past booking in the same page (old logic)
   */
  viewMatchParticipants(booking: IBooking): void {
  this.bookingService.getMyMatchesAsOrganizer().subscribe({
    next: (matches) => {
      const relatedMatch = matches.find(
        m => m.placeId === booking.placeId &&
             m.teamId === booking.teamId
      );

      if (relatedMatch) {
        this.matchParticipantService.getParticipantsByMatch(relatedMatch.id)
          .subscribe({
            next: (participants) => {
              this.selectedParticipants = participants;
              this.expandedBookingId = booking.id; // show modal under this booking
            },
            error: (err) => {
              console.error('Error loading participants', err);
              this.errorMessage = 'Failed to load participants.';
            }
          });
      } else {
        this.errorMessage = 'No related match found for this booking.';
      }
    },
    error: (err) => {
      console.error('Error fetching matches', err);
      this.errorMessage = 'Failed to retrieve matches.';
    }
  });
}

closeParticipants(): void {
  this.selectedParticipants = [];
  this.expandedBookingId = null;
}
}
