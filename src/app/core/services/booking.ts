import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'PENDING' | 'PENDING_PAYMENT';

export interface IBooking {
  id: string;
  place_id: string;
  user_id: number;
  team_id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  created_at: string;
  place_name?: string;
  team_name?: string;
  user_name?: string;
}

export interface ITimeSlot {
  id: string;
  place_id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  booking_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  
  // Get all bookings
  getBookings(): Observable<IBooking[]> {
    try {
      const bookingsString = localStorage.getItem('bookings');
      const bookings = bookingsString ? JSON.parse(bookingsString) : [];
      return of(bookings);
    } catch (error) {
      console.error('Error loading bookings from localStorage:', error);
      return of([]);
    }
  }

  // Get bookings by user
  getUserBookings(userId: number): Observable<IBooking[]> {
    try {
      const bookingsString = localStorage.getItem('bookings');
      if (bookingsString) {
        const bookings: IBooking[] = JSON.parse(bookingsString);
        const userBookings = bookings.filter(booking => booking.user_id === userId);
        return of(userBookings);
      }
      return of([]);
    } catch (error) {
      console.error('Error loading user bookings from localStorage:', error);
      return of([]);
    }
  }

  // Get bookings by team
  getTeamBookings(teamId: string): Observable<IBooking[]> {
    try {
      const bookingsString = localStorage.getItem('bookings');
      if (bookingsString) {
        const bookings: IBooking[] = JSON.parse(bookingsString);
        const teamBookings = bookings.filter(booking => booking.team_id === teamId);
        return of(teamBookings);
      }
      return of([]);
    } catch (error) {
      console.error('Error loading team bookings from localStorage:', error);
      return of([]);
    }
  }

  // Get bookings by place
  getPlaceBookings(placeId: string): Observable<IBooking[]> {
    try {
      const bookingsString = localStorage.getItem('bookings');
      if (bookingsString) {
        const bookings: IBooking[] = JSON.parse(bookingsString);
        const placeBookings = bookings.filter(booking => booking.place_id === placeId);
        return of(placeBookings);
      }
      return of([]);
    } catch (error) {
      console.error('Error loading place bookings from localStorage:', error);
      return of([]);
    }
  }

  // Get booking by ID
  getBookingById(id: string): Observable<IBooking | null> {
    try {
      const bookingsString = localStorage.getItem('bookings');
      if (bookingsString) {
        const bookings: IBooking[] = JSON.parse(bookingsString);
        const booking = bookings.find(b => b.id === id);
        return of(booking || null);
      }
      return of(null);
    } catch (error) {
      console.error('Error loading booking by ID from localStorage:', error);
      return of(null);
    }
  }

  // Create new booking
  createBooking(booking: Omit<IBooking, 'id' | 'created_at'>): Observable<IBooking> {
    try {
      const newBooking: IBooking = {
        ...booking,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        status: 'PENDING_PAYMENT' // Set initial status to PENDING_PAYMENT
      };

      const bookingsString = localStorage.getItem('bookings');
      const bookings: IBooking[] = bookingsString ? JSON.parse(bookingsString) : [];
      bookings.push(newBooking);
      localStorage.setItem('bookings', JSON.stringify(bookings));

      return of(newBooking);
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new Error('Failed to create booking');
    }
  }

  // Update booking
  updateBooking(booking: IBooking): Observable<IBooking> {
    try {
      const bookingsString = localStorage.getItem('bookings');
      if (bookingsString) {
        const bookings: IBooking[] = JSON.parse(bookingsString);
        const index = bookings.findIndex(b => b.id === booking.id);
        if (index !== -1) {
          bookings[index] = booking;
          localStorage.setItem('bookings', JSON.stringify(bookings));
          return of(booking);
        }
      }
      throw new Error('Booking not found');
    } catch (error) {
      console.error('Error updating booking:', error);
      throw new Error('Failed to update booking');
    }
  }

  // Cancel booking
  cancelBooking(id: string): Observable<IBooking> {
    try {
      const bookingsString = localStorage.getItem('bookings');
      if (bookingsString) {
        const bookings: IBooking[] = JSON.parse(bookingsString);
        const index = bookings.findIndex(b => b.id === id);
        if (index !== -1) {
          bookings[index].status = 'CANCELLED';
          localStorage.setItem('bookings', JSON.stringify(bookings));
          return of(bookings[index]);
        }
      }
      throw new Error('Booking not found');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw new Error('Failed to cancel booking');
    }
  }

  // Approve booking (Admin only) - Change from PENDING_PAYMENT to CONFIRMED
  approveBooking(id: string): Observable<IBooking> {
    try {
      const bookingsString = localStorage.getItem('bookings');
      if (bookingsString) {
        const bookings: IBooking[] = JSON.parse(bookingsString);
        const index = bookings.findIndex(b => b.id === id);
        if (index !== -1) {
          bookings[index].status = 'CONFIRMED';
          localStorage.setItem('bookings', JSON.stringify(bookings));
          return of(bookings[index]);
        }
      }
      throw new Error('Booking not found');
    } catch (error) {
      console.error('Error approving booking:', error);
      throw new Error('Failed to approve booking');
    }
  }

  // Get bookings with PENDING_PAYMENT status (for admin)
  getPendingPaymentBookings(): Observable<IBooking[]> {
    try {
      const bookingsString = localStorage.getItem('bookings');
      if (bookingsString) {
        const bookings: IBooking[] = JSON.parse(bookingsString);
        const pendingBookings = bookings.filter(booking => booking.status === 'PENDING_PAYMENT');
        return of(pendingBookings);
      }
      return of([]);
    } catch (error) {
      console.error('Error loading pending payment bookings:', error);
      return of([]);
    }
  }

  // Get available time slots for a place
  getAvailableTimeSlots(placeId: string, date: string): Observable<ITimeSlot[]> {
    try {
      // Generate time slots for the given date
      const timeSlots: ITimeSlot[] = [];
      const startHour = 8; // 8 AM
      const endHour = 22; // 10 PM
      
      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(date);
        endTime.setHours(hour + 1, 0, 0, 0);
        
        timeSlots.push({
          id: `${placeId}-${date}-${hour}`,
          place_id: placeId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          is_available: true
        });
      }

      // Check existing bookings for this place and date
      const bookingsString = localStorage.getItem('bookings');
      if (bookingsString) {
        const bookings: IBooking[] = JSON.parse(bookingsString);
        const placeBookings = bookings.filter(b => 
          b.place_id === placeId && 
          b.status !== 'CANCELLED' &&
          new Date(b.start_time).toDateString() === new Date(date).toDateString()
        );

        // Mark booked slots as unavailable
        placeBookings.forEach(booking => {
          const bookingStart = new Date(booking.start_time);
          const bookingEnd = new Date(booking.end_time);
          
          timeSlots.forEach(slot => {
            const slotStart = new Date(slot.start_time);
            const slotEnd = new Date(slot.end_time);
            
            if (slotStart < bookingEnd && slotEnd > bookingStart) {
              slot.is_available = false;
              slot.booking_id = booking.id;
            }
          });
        });
      }

      return of(timeSlots);
    } catch (error) {
      console.error('Error loading available time slots:', error);
      return of([]);
    }
  }

  // Delete booking
  deleteBooking(id: string): Observable<void> {
    try {
      const bookingsString = localStorage.getItem('bookings');
      if (bookingsString) {
        const bookings: IBooking[] = JSON.parse(bookingsString);
        const filteredBookings = bookings.filter(b => b.id !== id);
        localStorage.setItem('bookings', JSON.stringify(filteredBookings));
      }
      return of(void 0);
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw new Error('Failed to delete booking');
    }
  }

  // Get upcoming bookings for user
  getUpcomingBookings(userId: number): Observable<IBooking[]> {
    try {
      const bookingsString = localStorage.getItem('bookings');
      if (bookingsString) {
        const bookings: IBooking[] = JSON.parse(bookingsString);
        const now = new Date();
        const upcomingBookings = bookings.filter(booking => 
          booking.user_id === userId && 
          new Date(booking.start_time) > now &&
          booking.status !== 'CANCELLED'
        );
        return of(upcomingBookings);
      }
      return of([]);
    } catch (error) {
      console.error('Error loading upcoming bookings:', error);
      return of([]);
    }
  }

  // Get past bookings for user
  getPastBookings(userId: number): Observable<IBooking[]> {
    try {
      const bookingsString = localStorage.getItem('bookings');
      if (bookingsString) {
        const bookings: IBooking[] = JSON.parse(bookingsString);
        const now = new Date();
        const pastBookings = bookings.filter(booking => 
          booking.user_id === userId && 
          new Date(booking.start_time) < now
        );
        return of(pastBookings);
      }
      return of([]);
    } catch (error) {
      console.error('Error loading past bookings:', error);
      return of([]);
    }
  }
}
