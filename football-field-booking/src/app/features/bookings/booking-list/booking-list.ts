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
import { BookingService, IBooking, BookingStatus } from '../../../core/services/booking';
import { Match, IBookingMatch, IMatchParticipant } from '../../../core/services/match';
import { Team, ITeamMember } from '../../../core/services/team';
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
    private matchService: Match,
    private teamService: Team,
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

  viewMatchParticipants(booking: IBooking): void {
    // Find related matches for this booking
    this.matchService.getBookingMatches().subscribe({
      next: (matches) => {
        console.log('All matches:', matches);
        console.log('Current booking:', booking);
        
        // Find matches that match the booking criteria (same place, team, and similar date/time)
        const relatedMatches = matches.filter(match => {
          const bookingDate = new Date(booking.start_time);
          const matchDate = new Date(match.matchDate);
          
          console.log('Comparing booking vs match:', {
            bookingPlaceId: booking.place_id,
            matchPlaceId: match.placeId,
            bookingTeamId: booking.team_id,
            matchTeamId: match.teamId,
            bookingDate: bookingDate.toDateString(),
            matchDate: matchDate.toDateString(),
            bookingStartTime: booking.start_time,
            matchStartTime: match.startTime,
            bookingEndTime: booking.end_time,
            matchEndTime: match.endTime
          });
          
          // Check if place, team, and date match
          const placeMatch = match.placeId.toString() === booking.place_id.toString();
          const teamMatch = match.teamId.toString() === booking.team_id.toString();
          const dateMatch = bookingDate.toDateString() === matchDate.toDateString();
          
          // Also check if times are similar (within 1 hour)
          const bookingStartHour = bookingDate.getHours();
          const matchStartHour = new Date(`2000-01-01T${match.startTime}`).getHours();
          const timeMatch = Math.abs(bookingStartHour - matchStartHour) <= 1;
          
          console.log('Match criteria:', { placeMatch, teamMatch, dateMatch, timeMatch });
          
          return placeMatch && teamMatch && dateMatch && timeMatch;
        });

        console.log('Related matches found:', relatedMatches);

        if (relatedMatches.length > 0) {
          // Use the first related match
          const match = relatedMatches[0];
          console.log('Showing participants for match:', match.id, 'team:', match.teamId);
          
          // Navigate to match participants page (same as matches page)
          this.router.navigate(['/dashboard/matches', match.id, 'participants', match.teamId]);
        } else {
          // If no related match found, show a message with more details
          console.log('No matches found. Available matches:', matches);
          console.log('Booking details for debugging:', {
            place_id: booking.place_id,
            team_id: booking.team_id,
            start_time: booking.start_time,
            end_time: booking.end_time,
            place_name: booking.place_name,
            team_name: booking.team_name
          });
          this.errorMessage = `No related match found for this booking. Found ${matches.length} total matches in system.`;
          setTimeout(() => {
            this.errorMessage = null;
          }, 5000);
        }
      },
      error: (error) => {
        console.error('Error finding related matches:', error);
        this.errorMessage = 'Failed to find related matches.';
        setTimeout(() => {
          this.errorMessage = null;
        }, 3000);
      }
    });
  }

  private showParticipantsModal(match: IBookingMatch): void {
    // Get participants and team members for this match
    this.matchService.getMatchParticipants(match.id).subscribe({
      next: (participants) => {
        // Get team members
        this.teamService.getTeamMembers(match.teamId).subscribe({
          next: (players) => {
            // Create detailed participant information
            let message = `Match Participants\n\n`;
            message += `Match Details:\n`;
            message += `- Date: ${match.matchDate}\n`;
            message += `- Time: ${match.startTime} - ${match.endTime}\n`;
            message += `- Place ID: ${match.placeId}\n`;
            message += `- Team ID: ${match.teamId}\n`;
            message += `- Status: ${match.status}\n\n`;
            
            message += `Team Players (${players.length}):\n`;
            if (players.length > 0) {
              players.forEach(player => {
                const isInvited = participants.some(p => p.userId.toString() === player.userId.toString());
                const participant = participants.find(p => p.userId.toString() === player.userId.toString());
                const status = participant ? participant.status : 'NOT_INVITED';
                
                message += `- ${player.username} (${player.email})\n`;
                message += `  Role: ${player.role}\n`;
                message += `  Status: ${status}\n\n`;
              });
            } else {
              message += `No players found for this team.\n\n`;
            }
            
            message += `Participants Summary:\n`;
            message += `- Total Invited: ${participants.length}\n`;
            message += `- Accepted: ${participants.filter(p => p.status === 'ACCEPTED').length}\n`;
            message += `- Declined: ${participants.filter(p => p.status === 'DECLINED').length}\n`;
            message += `- Pending: ${participants.filter(p => p.status === 'INVITED').length}\n`;
            
            alert(message);
          },
          error: (error) => {
            console.error('Error loading team members:', error);
            this.errorMessage = 'Failed to load team members.';
            setTimeout(() => {
              this.errorMessage = null;
            }, 3000);
          }
        });
      },
      error: (error) => {
        console.error('Error loading participants:', error);
        this.errorMessage = 'Failed to load match participants.';
        setTimeout(() => {
          this.errorMessage = null;
        }, 3000);
      }
    });
  }
} 