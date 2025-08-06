import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'PENDING_PLAYERS' | 'PENDING_PAYMENT';
export type InvitationStatus = 'INVITED' | 'ACCEPTED' | 'DECLINED';

/**
 * Participant entity for a specific match
 */
export interface IMatchParticipant {
  id: string;
  bookingMatchId: string;
  userId: string;
  username: string;
  userEmail: string;
  status: InvitationStatus;
  respondedAt?: string;
}

/**
 * Request body for inviting a participant
 */
export interface IInvitationRequest {
  email: string;
}

/**
 * Combined Match + Invitation DTO from backend
 */
export interface IUserMatch {
  matchId: string;
  participantId: string;
  teamId: string;
  teamName: string;
  placeId: string;
  placeName: string;
  startTime: string;
  endTime: string;
  bookingStatus: BookingStatus;
  invitationStatus: InvitationStatus;
}

@Injectable({
  providedIn: 'root',
})
export class MatchParticipantService {
  private readonly API_URL = 'http://localhost:8080/api/match-participants';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Invite a participant to a match
   */
  inviteParticipant(bookingMatchId: string, dto: IInvitationRequest): Observable<IMatchParticipant> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.post<IMatchParticipant>(`${this.API_URL}/invite/${bookingMatchId}`, dto).pipe(
      tap(() => console.log(`📩 Invitation sent for match ${bookingMatchId}`)),
      catchError(error => {
        console.error('Error inviting participant:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to invite participant'));
      })
    );
  }

  /**
   * Respond to a match invitation by participant ID
   */
  respondToMatchInvitation(matchParticipantId: string, status: 'ACCEPTED' | 'DECLINED'): Observable<void> {
    if (!matchParticipantId || !status) {
      return throwError(() => new Error('Participant ID and status are required'));
    }

    return this.http.get<void>(`${this.API_URL}/respond/${matchParticipantId}`, {
      params: { status }
    }).pipe(
      tap(() => console.log(`✅ Invitation ${status} for participant ${matchParticipantId}`)),
      catchError(error => {
        console.error('Error responding to match invitation:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to respond to invitation'));
      })
    );
  }

  /**
   * Join match as organizer
   */
  joinMatchAsOrganizer(matchId: string): Observable<IMatchParticipant> {
  const currentUser = this.authService.getCurrentUser();
  if (!currentUser) {
    return throwError(() => new Error('User not authenticated'));
  }

  return this.http.post<IMatchParticipant>(`${this.API_URL}/join-as-organizer/${matchId}`, {}).pipe(
    tap(() => console.log(`✅ Organizer joined match ${matchId}`)),
    catchError(error => {
      // Preserve full backend error message
      const backendMsg = error.error?.msg || error.error?.message || 'Failed to join match as organizer';
      console.error('❌ Backend Error:', error);
      return throwError(() => new Error(backendMsg));
    })
  );
}


  /**
   * Get all participants for a specific match
   */
  getParticipantsByMatch(matchId: string): Observable<IMatchParticipant[]> {
    if (!matchId) {
      return throwError(() => new Error('Match ID is required'));
    }

    return this.http.get<IMatchParticipant[]>(`${this.API_URL}/match/${matchId}`).pipe(
      map(res => res || []),
      catchError(error => {
        console.error('Error fetching participants:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to fetch participants'));
      })
    );
  }

  /**
   * Get all matches where the current user is a participant
   */
  getUserParticipatedMatches(): Observable<IUserMatch[]> {
    return this.http.get<IUserMatch[]>(`${this.API_URL}/user/matches`).pipe(
      map(res => res || []),
      catchError(error => {
        console.error('Error fetching participated matches:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to fetch matches'));
      })
    );
  }
}
