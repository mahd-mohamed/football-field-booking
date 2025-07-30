import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
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
import { BookingService, IBooking, BookingStatus } from '../../../core/services/booking';
import { Auth } from '../../../core/services/auth';
import { Router } from '@angular/router';

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

  displayedColumns: string[] = ['id', 'user', 'place', 'team', 'date', 'time', 'status', 'actions'];

  constructor(
    private bookingService: BookingService,
    private authService: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadAllBookings();
  }

  ngAfterViewInit(): void {
    // Set up pagination and sorting
    if (this.paginator && this.sort) {
      // Connect paginator and sort to the table
    }
  }

  loadAllBookings(): void {
    this.bookingService.getBookings().subscribe({
      next: (bookings) => {
        this.allBookings = bookings;
        this.categorizeBookings();
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
    this.bookingService.approveBooking(booking.id).subscribe({
      next: (updatedBooking) => {
        this.loadAllBookings();
      },
      error: (error) => {
        console.error('Error approving booking:', error);
      }
    });
  }

  cancelBooking(booking: IBooking): void {
    this.bookingService.cancelBooking(booking.id).subscribe({
      next: (updatedBooking) => {
        this.loadAllBookings();
      },
      error: (error) => {
        console.error('Error cancelling booking:', error);
      }
    });
  }

  deleteBooking(booking: IBooking): void {
    if (confirm('Are you sure you want to delete this booking?')) {
      this.bookingService.deleteBooking(booking.id).subscribe({
        next: () => {
          this.loadAllBookings();
        },
        error: (error) => {
          console.error('Error deleting booking:', error);
        }
      });
    }
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
      case 'PENDING_PAYMENT':
        return 'warning';
      case 'PENDING':
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
      case 'PENDING':
        return 'Pending';
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
        return 'pending';
      case 'PENDING':
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

  canApprove(booking: IBooking): boolean {
    return booking.status === 'PENDING_PAYMENT';
  }

  canCancel(booking: IBooking): boolean {
    return booking.status === 'PENDING_PAYMENT' || booking.status === 'CONFIRMED';
  }


} 