import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export type MatchParticipantStatus = 'INVITED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface IMatchParticipant {
  id: string;
  bookingMatchId: string;
  userId: number;
  status: MatchParticipantStatus;
  respondedAt?: string;
  createdAt: string;
}

export interface IBookingMatch {
  id: string;
  placeId: string;
  teamId: string;
  organizerId: number;
  matchDate: string;
  startTime: string;
  endTime: string;
  minParticipants: number;
  maxParticipants: number;
  description?: string;
  status: 'SCHEDULED' | 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Match {
  
  // Booking Match Management
  createBookingMatch(booking: Omit<IBookingMatch, 'id' | 'createdAt'>, organizerId: number): Observable<IBookingMatch> {
    try {
      const newBooking: IBookingMatch = {
        ...booking,
        id: Date.now().toString(),
        organizerId,
        status: 'SCHEDULED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const bookingsString = localStorage.getItem('bookingMatches');
      const bookings: IBookingMatch[] = bookingsString ? JSON.parse(bookingsString) : [];
      bookings.push(newBooking);
      localStorage.setItem('bookingMatches', JSON.stringify(bookings));

      return of(newBooking);
    } catch (error) {
      console.error('Error creating booking match:', error);
      throw new Error('Failed to create booking match');
    }
  }

  getBookingMatches(): Observable<IBookingMatch[]> {
    try {
      const bookingsString = localStorage.getItem('bookingMatches');
      const bookings = bookingsString ? JSON.parse(bookingsString) : [];
      return of(bookings);
    } catch (error) {
      console.error('Error loading booking matches:', error);
      return of([]);
    }
  }

  getBookingMatchById(id: string): Observable<IBookingMatch | null> {
    try {
      const bookingsString = localStorage.getItem('bookingMatches');
      if (bookingsString) {
        const bookings: IBookingMatch[] = JSON.parse(bookingsString);
        const booking = bookings.find(b => b.id === id);
        return of(booking || null);
      }
      return of(null);
    } catch (error) {
      console.error('Error loading booking match by ID:', error);
      return of(null);
    }
  }

  getBookingMatchesByOrganizer(organizerId: number): Observable<IBookingMatch[]> {
    try {
      const bookingsString = localStorage.getItem('bookingMatches');
      if (bookingsString) {
        const bookings: IBookingMatch[] = JSON.parse(bookingsString);
        const organizerBookings = bookings.filter(b => b.organizerId === organizerId);
        return of(organizerBookings);
      }
      return of([]);
    } catch (error) {
      console.error('Error loading booking matches by organizer:', error);
      return of([]);
    }
  }

  updateBookingMatch(booking: IBookingMatch): Observable<IBookingMatch> {
    try {
      const bookingsString = localStorage.getItem('bookingMatches');
      if (bookingsString) {
        const bookings: IBookingMatch[] = JSON.parse(bookingsString);
        const index = bookings.findIndex(b => b.id === booking.id);
        if (index !== -1) {
          const updatedBooking: IBookingMatch = {
            ...booking,
            updatedAt: new Date().toISOString()
          };
          bookings[index] = updatedBooking;
          localStorage.setItem('bookingMatches', JSON.stringify(bookings));
          return of(updatedBooking);
        }
      }
      throw new Error('Booking match not found');
    } catch (error) {
      console.error('Error updating booking match:', error);
      throw new Error('Failed to update booking match');
    }
  }

  deleteBookingMatch(id: string): Observable<void> {
    try {
      const bookingsString = localStorage.getItem('bookingMatches');
      if (bookingsString) {
        const bookings: IBookingMatch[] = JSON.parse(bookingsString);
        const filteredBookings = bookings.filter(b => b.id !== id);
        localStorage.setItem('bookingMatches', JSON.stringify(filteredBookings));
      }
      return of(void 0);
    } catch (error) {
      console.error('Error deleting booking match:', error);
      throw new Error('Failed to delete booking match');
    }
  }

  // Match Participant Management
  addMatchParticipant(bookingMatchId: string, userId: number): Observable<IMatchParticipant> {
    try {
      const newParticipant: IMatchParticipant = {
        id: Date.now().toString(),
        bookingMatchId,
        userId,
        status: 'INVITED',
        createdAt: new Date().toISOString()
      };

      const participantsString = localStorage.getItem('matchParticipants');
      const participants: IMatchParticipant[] = participantsString ? JSON.parse(participantsString) : [];
      participants.push(newParticipant);
      localStorage.setItem('matchParticipants', JSON.stringify(participants));

      return of(newParticipant);
    } catch (error) {
      console.error('Error adding match participant:', error);
      throw new Error('Failed to add match participant');
    }
  }

  getMatchParticipants(bookingMatchId: string): Observable<IMatchParticipant[]> {
    try {
      const participantsString = localStorage.getItem('matchParticipants');
      if (participantsString) {
        const participants: IMatchParticipant[] = JSON.parse(participantsString);
        const matchParticipants = participants.filter(p => p.bookingMatchId === bookingMatchId);
        return of(matchParticipants);
      }
      return of([]);
    } catch (error) {
      console.error('Error loading match participants:', error);
      return of([]);
    }
  }

  getUserMatchInvites(userId: number): Observable<IMatchParticipant[]> {
    try {
      const participantsString = localStorage.getItem('matchParticipants');
      if (participantsString) {
        const participants: IMatchParticipant[] = JSON.parse(participantsString);
        const userInvites = participants.filter(p => p.userId === userId && p.status === 'INVITED');
        return of(userInvites);
      }
      return of([]);
    } catch (error) {
      console.error('Error loading user match invites:', error);
      return of([]);
    }
  }

  respondToMatchInvite(participantId: string, status: 'ACCEPTED' | 'DECLINED'): Observable<void> {
    try {
      const participantsString = localStorage.getItem('matchParticipants');
      if (participantsString) {
        const participants: IMatchParticipant[] = JSON.parse(participantsString);
        const participantIndex = participants.findIndex(p => p.id === participantId);
        
        if (participantIndex !== -1) {
          participants[participantIndex].status = status;
          participants[participantIndex].respondedAt = new Date().toISOString();
          localStorage.setItem('matchParticipants', JSON.stringify(participants));

          // Check if match should be confirmed based on minimum participants
          this.checkAndConfirmMatch(participants[participantIndex].bookingMatchId);
        }
      }
      return of(void 0);
    } catch (error) {
      console.error('Error responding to match invite:', error);
      throw new Error('Failed to respond to match invite');
    }
  }

  private checkAndConfirmMatch(bookingMatchId: string): void {
    try {
      const bookingsString = localStorage.getItem('bookingMatches');
      const participantsString = localStorage.getItem('matchParticipants');
      
      if (bookingsString && participantsString) {
        const bookings: IBookingMatch[] = JSON.parse(bookingsString);
        const participants: IMatchParticipant[] = JSON.parse(participantsString);
        
        const booking = bookings.find(b => b.id === bookingMatchId);
        const acceptedParticipants = participants.filter(p => 
          p.bookingMatchId === bookingMatchId && p.status === 'ACCEPTED'
        );
        
        if (booking && acceptedParticipants.length >= booking.minParticipants) {
          // Change status to PENDING_PAYMENT when minimum participants accept
          booking.status = 'PENDING_PAYMENT';
          booking.updatedAt = new Date().toISOString();
          localStorage.setItem('bookingMatches', JSON.stringify(bookings));
          
          // Expire remaining invitations
          this.expireRemainingInvitations(bookingMatchId);
        }
      }
    } catch (error) {
      console.error('Error checking and confirming match:', error);
    }
  }

  // Admin function to confirm match (change from PENDING_PAYMENT to CONFIRMED)
  confirmMatch(bookingMatchId: string): Observable<void> {
    try {
      const bookingsString = localStorage.getItem('bookingMatches');
      if (bookingsString) {
        const bookings: IBookingMatch[] = JSON.parse(bookingsString);
        const booking = bookings.find(b => b.id === bookingMatchId);
        
        if (booking && booking.status === 'PENDING_PAYMENT') {
          booking.status = 'CONFIRMED';
          booking.updatedAt = new Date().toISOString();
          localStorage.setItem('bookingMatches', JSON.stringify(bookings));
          return of(void 0);
        } else {
          throw new Error('Match not found or not in PENDING_PAYMENT status');
        }
      }
      throw new Error('No bookings found');
    } catch (error) {
      console.error('Error confirming match:', error);
      throw new Error('Failed to confirm match');
    }
  }

  // Cancel match
  cancelMatch(bookingMatchId: string): Observable<void> {
    try {
      const bookingsString = localStorage.getItem('bookingMatches');
      if (bookingsString) {
        const bookings: IBookingMatch[] = JSON.parse(bookingsString);
        const booking = bookings.find(b => b.id === bookingMatchId);
        
        if (booking) {
          booking.status = 'CANCELLED';
          booking.updatedAt = new Date().toISOString();
          localStorage.setItem('bookingMatches', JSON.stringify(bookings));
          return of(void 0);
        } else {
          throw new Error('Match not found');
        }
      }
      throw new Error('No bookings found');
    } catch (error) {
      console.error('Error cancelling match:', error);
      throw new Error('Failed to cancel match');
    }
  }

  // Expire remaining invitations when minimum participants accept
  private expireRemainingInvitations(bookingMatchId: string): void {
    try {
      const participantsString = localStorage.getItem('matchParticipants');
      if (participantsString) {
        const participants: IMatchParticipant[] = JSON.parse(participantsString);
        const updatedParticipants = participants.map(p => {
          if (p.bookingMatchId === bookingMatchId && p.status === 'INVITED') {
            return { ...p, status: 'EXPIRED' as MatchParticipantStatus };
          }
          return p;
        });
        localStorage.setItem('matchParticipants', JSON.stringify(updatedParticipants));
      }
    } catch (error) {
      console.error('Error expiring invitations:', error);
    }
  }

  // Get matches by status for admin
  getMatchesByStatus(status: IBookingMatch['status']): Observable<IBookingMatch[]> {
    try {
      const bookingsString = localStorage.getItem('bookingMatches');
      if (bookingsString) {
        const bookings: IBookingMatch[] = JSON.parse(bookingsString);
        const filteredBookings = bookings.filter(b => b.status === status);
        return of(filteredBookings);
      }
      return of([]);
    } catch (error) {
      console.error('Error getting matches by status:', error);
      return of([]);
    }
  }

  // Utility methods
  isMatchConfirmed(bookingMatchId: string): Observable<boolean> {
    try {
      const bookingsString = localStorage.getItem('bookingMatches');
      if (bookingsString) {
        const bookings: IBookingMatch[] = JSON.parse(bookingsString);
        const booking = bookings.find(b => b.id === bookingMatchId);
        return of(booking?.status === 'CONFIRMED');
      }
      return of(false);
    } catch (error) {
      console.error('Error checking if match is confirmed:', error);
      return of(false);
    }
  }

  getAcceptedParticipantsCount(bookingMatchId: string): Observable<number> {
    try {
      const participantsString = localStorage.getItem('matchParticipants');
      if (participantsString) {
        const participants: IMatchParticipant[] = JSON.parse(participantsString);
        const acceptedCount = participants.filter(p => 
          p.bookingMatchId === bookingMatchId && p.status === 'ACCEPTED'
        ).length;
        return of(acceptedCount);
      }
      return of(0);
    } catch (error) {
      console.error('Error getting accepted participants count:', error);
      return of(0);
    }
  }
}
