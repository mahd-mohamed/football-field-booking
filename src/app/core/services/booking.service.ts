import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BookingStatus } from './match-participant.service';

export interface IBooking {
  id: string;
  placeId: string;
  userId: string;
  teamId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt?: string;
  placeName?: string;
  placeType?: string;
  teamName?: string;
  userName?: string;
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
  private apiUrl = 'http://localhost:8080/api/booking-matches';

  constructor(private http: HttpClient) {}

  // Get all bookings (Admin or Organizer)
getBookings(): Observable<IBooking[]> {
    return this.http.get<IBooking[]>(`${this.apiUrl}/all`).pipe(
      catchError(err => {
        console.error('Error fetching all bookings:', err);
        return of([]);
      })
    );
}

  // Get bookings for a specific user
  getUserBookings(userId: string): Observable<IBooking[]> {
    return this.http.get<{ content: IBooking[] }>(`${this.apiUrl}/user/${userId}`).pipe(
      map(res => res.content || []),
      catchError(err => {
        console.error('Error fetching user bookings:', err);
        return of([]);
      })
    );
  }

  // Get bookings where current user is an organizer in any team
getMyMatchesAsOrganizer(): Observable<IBooking[]> {
  return this.http.get<IBooking[]>(`${this.apiUrl}/my/organizer`).pipe(
    catchError(err => {
      console.error('Error fetching organizer bookings:', err);
      return of([]);
    })
  );
}

// New method
getBookingDetailsById(bookingId: string): Observable<IBooking | null> {
  return this.http.get<IBooking>(`${this.apiUrl}/details/${bookingId}`).pipe(
    catchError(err => {
      console.error(`Error fetching booking details for ID: ${bookingId}`, err);
      return of(null);
    })
  );
}



  // Get bookings for a specific team
  getTeamBookings(teamId: string): Observable<IBooking[]> {
    return this.http.get<{ content: IBooking[] }>(`${this.apiUrl}/team/${teamId}`).pipe(
      map(res => res.content || []),
      catchError(err => {
        console.error('Error fetching team bookings:', err);
        return of([]);
      })
    );
  }

  // Get bookings for a specific place
getPlaceBookings(placeId: string): Observable<IBooking[]> {
  return this.http.get<IBooking[]>(`${this.apiUrl}/place/${placeId}`).pipe(
    map(res => {
      console.log("Raw response from backend:", res);
      // Backend returns an array directly, no 'content' wrapper
      return Array.isArray(res) ? res : [];
    }),
    catchError(err => {
      console.error('Error fetching place bookings:', err);
      return of([]);
    })
  );
}


  // Get a booking by its ID
  getBookingById(id: string): Observable<IBooking | null> {
    return this.http.get<IBooking>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => {
        console.error('Error fetching booking by ID:', err);
        return of(null);
      })
    );
  }

  // Create a new booking
  createBooking(booking: Omit<IBooking, 'id' | 'created_at'>): Observable<IBooking> {
    return this.http.post<IBooking>(`${this.apiUrl}`, booking).pipe(
      catchError(err => {
        console.error('Error creating booking:', err);
        throw err;
      })
    );
  }

  // Update a booking
  updateBooking(booking: IBooking): Observable<IBooking> {
    return this.http.put<IBooking>(`${this.apiUrl}/${booking.id}`, booking).pipe(
      catchError(err => {
        console.error('Error updating booking:', err);
        throw err;
      })
    );
  }

  // Cancel a booking
  confirmBooking(id: string): Observable<IBooking> {
    return this.http.patch<IBooking>(`${this.apiUrl}/confirm/${id}`, {}).pipe(
      catchError(err => {
        console.error('Error confirming booking:', err);
        throw err;
      })
    );
  }

  // Cancel a booking
  cancelBooking(id: string): Observable<IBooking> {
    return this.http.patch<IBooking>(`${this.apiUrl}/cancel/${id}`, {}).pipe(
      catchError(err => {
        console.error('Error cancelling booking:', err);
        throw err;
      })
    );
  }

  // Get all bookings with PENDING_PAYMENT status
  getPendingPaymentBookings(): Observable<IBooking[]> {
    return this.http.get<{ content: IBooking[] }>(`${this.apiUrl}/pending`).pipe(
      map(res => res.content || []),
      catchError(err => {
        console.error('Error fetching pending payment bookings:', err);
        return of([]);
      })
    );
  }

  // Get available time slots for a place & date
getAvailableTimeSlots(placeId: string, date: string): Observable<ITimeSlot[]> {
  return this.getPlaceBookings(placeId).pipe(
    map(bookings => {
      console.log("Raw bookings from backend:", bookings);

      const selectedDate = new Date(date);
      const today = new Date();

      const startHour = 8;
      const endHour = 24;
      const timeSlots: ITimeSlot[] = [];

      const sameDayBookings = bookings.filter(b => {
        const bookingDate = this.parseLocalDateTime(b.startTime);
        return (
          bookingDate.getFullYear() === selectedDate.getFullYear() &&
          bookingDate.getMonth() === selectedDate.getMonth() &&
          bookingDate.getDate() === selectedDate.getDate() &&
          b.status !== 'CANCELLED'
        );
      });

      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = new Date(selectedDate);
        startTime.setHours(hour, 0, 0, 0);

        const endTime = new Date(selectedDate);
        endTime.setHours(hour + 1, 0, 0, 0);

        if (
          selectedDate.toDateString() === today.toDateString() &&
          startTime.getTime() <= today.getTime()
        ) {
          continue;
        }

        let isAvailable = true;
        let bookingId: string | undefined;

        sameDayBookings.forEach(booking => {
          const bookingStart = this.parseLocalDateTime(booking.startTime);
          const bookingEnd = this.parseLocalDateTime(booking.endTime);

          const overlap =
            startTime.getTime() < bookingEnd.getTime() &&
            endTime.getTime() > bookingStart.getTime();

          if (overlap) {
            isAvailable = false;
            bookingId = booking.id;
          }
        });

        timeSlots.push({
          id: `${placeId}-${hour}`,
          place_id: placeId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          is_available: isAvailable,
          booking_id: bookingId
        });
      }

      console.log("Final generated slots:", timeSlots);
      return timeSlots;
    }),
    catchError(err => {
      console.error('Error calculating available time slots:', err);
      return of([]);
    })
  );
}


//Helper function to parse the date and time
private parseLocalDateTime(dateTime: string): Date {
  const [datePart, timePart] = dateTime.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, second || 0);
}

  // Get upcoming bookings for a user
  getUpcomingBookings(userId: string): Observable<IBooking[]> {
    return this.http.get<{ content: IBooking[] }>(`${this.apiUrl}/user/${userId}/upcoming`).pipe(
      map(res => res.content || []),
      catchError(err => {
        console.error('Error fetching upcoming bookings:', err);
        return of([]);
      })
    );
  }

  // Get past bookings for a user
  getPastBookings(userId: string): Observable<IBooking[]> {
    return this.http.get<{ content: IBooking[] }>(`${this.apiUrl}/user/${userId}/past`).pipe(
      map(res => res.content || []),
      catchError(err => {
        console.error('Error fetching past bookings:', err);
        return of([]);
      })
    );
  }
}
