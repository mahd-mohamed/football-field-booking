import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest, map, switchMap, of, catchError, tap, takeUntil, Subject } from 'rxjs';

import { MatchParticipantService, IMatchParticipant, IInvitationRequest } from '../../../core/services/match-participant.service';
import { TeamService, ITeamMember } from '../../../core/services/team.service';
import { BookingService, IBooking } from '../../../core/services/booking.service';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-match-participants',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './invite-participants.html',
  styleUrls: ['./invite-participants.css']
})
export class InviteParticipantsComponent implements OnInit, OnDestroy {
  matchId!: string;
  teamId!: string;

  match$!: Observable<IBooking | null>;
  players$!: Observable<ITeamMember[]>;
  matchParticipants$!: Observable<IMatchParticipant[]>;

  combinedData$!: Observable<{ 
    match: IBooking | null, 
    players: ITeamMember[], 
    participants: IMatchParticipant[], 
    teamId: string 
  }>;

  errorMessage: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private matchParticipantService: MatchParticipantService,
    private teamService: TeamService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
  console.log('InviteParticipantsComponent: ngOnInit started.');

  // Get passed booking details
  const navigation = history.state;
  const passedBooking: IBooking | undefined = navigation.booking;

  this.combinedData$ = this.route.paramMap.pipe(
    map(params => {
      this.matchId = params.get('bookingId') || '';
      this.teamId = passedBooking?.teamId || '';
      console.log(`Route Params - matchId: ${this.matchId}, teamId: ${this.teamId}`);
      if (!this.matchId || !this.teamId) {
        this.errorMessage = 'Booking ID or Team ID is missing in the route.';
        throw new Error(this.errorMessage);
      }
      return { matchId: this.matchId, teamId: this.teamId };
    }),
    switchMap(({ matchId, teamId }) => {
      console.log(`Service calls for matchId: ${matchId}, teamId: ${teamId}`);

      // Fetch from backend if booking is missing OR missing placeType
      const needsFetch = !passedBooking || !passedBooking.placeType;

      return combineLatest([
        needsFetch
          ? this.bookingService.getBookingDetailsById(matchId).pipe(
              tap(res => console.log("✅ BookingMatchDetails API Response:", res)),
              catchError(() => of(null))
            )
          : of(passedBooking),
        this.teamService.getTeamMembers(teamId).pipe(catchError(() => of([]))),
        this.matchParticipantService.getParticipantsByMatch(matchId).pipe(catchError(() => of([])))
      ]).pipe(
        tap(([match, players, participants]) => {
          console.log('Match data (final):', match);
          console.log('Players:', players);
          console.log('Participants:', participants);
        }),
        map(([match, players, participants]) => ({ match, players, participants, teamId })),
        catchError((err) => {
          this.errorMessage = `Error loading data: ${err.message}`;
          return of({ match: null, players: [], participants: [], teamId });
        })
      );
    }),
    takeUntil(this.destroy$)
  );

  this.combinedData$.subscribe({
    next: (data) => {
      console.log('Combined data received:', data);
    },
    error: (err) => {
      console.error('Error in combinedData$ subscription:', err);
    }
  });
}


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check if a player is invited or accepted in the match participants list
   */
  isPlayerInvited(userId: string, participants: IMatchParticipant[]): boolean {
    return participants.some(p => p.userId === userId && (p.status === 'INVITED' || p.status === 'ACCEPTED'));
  }

  /**
   * Get invitation status for a specific player
   */
  getPlayerInvitationStatus(userId: string, participants: IMatchParticipant[]): string {
    const participant = participants.find(p => p.userId === userId);
    return participant ? participant.status.charAt(0).toUpperCase() + participant.status.slice(1).toLowerCase() : 'Not Invited';
  }

  isOrganizer(playerId: string, organizerId: string): boolean {
  return playerId === organizerId;
}

isOrganizerAlreadyParticipant(organizerId: string, participants: IMatchParticipant[]): boolean {
  return participants.some(
    p => p.userId === organizerId && p.status === 'ACCEPTED'
  );
}


  /**
   * Invite a player by userId (this assumes you can get their email from team members)
   */
  // Add this mapping at the top of your component
private readonly MAX_CAPACITY_MAP: Record<string, number> = {
  FIVE: 10,
  SEVEN: 14,
  ELEVEN: 22
};

getMaxCapacity(placeType: string): number {
  return this.MAX_CAPACITY_MAP[placeType] || 0;
}

getCurrentAcceptedCount(participants: IMatchParticipant[]): number {
  return participants.filter(p => p.status === 'ACCEPTED').length;
}

isCapacityFull(placeType: string, participants: IMatchParticipant[]): boolean {
  return this.getCurrentAcceptedCount(participants) >= this.getMaxCapacity(placeType);
}

// Modified invitePlayer
invitePlayer(email: string, match: IBooking, participants: IMatchParticipant[]): void {
  if (!this.matchId) {
    this.snackBar.open('Match ID is not available.', 'Close', { duration: 3000 });
    return;
  }

  const maxCapacity = this.getMaxCapacity(match.placeType || '');
  const acceptedCount = this.getCurrentAcceptedCount(participants);

  if (acceptedCount >= maxCapacity) {
    this.snackBar.open(`Max capacity of ${maxCapacity} reached. Cannot invite more players.`, 'Close', {
      duration: 4000,
      panelClass: 'snackbar-error'
    });
    return;
  }

  const alreadyInvited = participants.some(p => p.userEmail === email);
  if (alreadyInvited) {
    this.snackBar.open(`User with email ${email} is already invited or participating.`, 'Close', { duration: 3000 });
    return;
  }

  const dto: IInvitationRequest = { email };
  this.matchParticipantService.inviteParticipant(this.matchId, dto).subscribe({
    next: () => {
      this.snackBar.open('Invitation sent successfully!', 'Close', { duration: 2000 });
      this.refreshParticipants();
    },
    error: (err) => {
      this.snackBar.open(`Failed to invite user: ${err.message}`, 'Close', { duration: 3000 });
    }
  });
}



  joinMatchAsOrganizer(): void {
  if (!this.matchId) {
    this.errorMessage = 'Match ID is missing.';
    return;
  }

  this.matchParticipantService.joinMatchAsOrganizer(this.matchId).subscribe({
    next: (participant) => {
      console.log('Organizer joined the match successfully:', participant);
      this.refreshParticipants();
    },
    error: (err) => {
      this.errorMessage = 'Failed to join match as organizer.';
    }
  });
}


  /**
   * Refresh participants list after an invitation
   */
  private refreshParticipants(): void {
    if (this.matchId) {
      this.matchParticipantService.getParticipantsByMatch(this.matchId).pipe(
        catchError((err) => {
          this.errorMessage = `Error refreshing participants: ${err.message}`;
          return of([]);
        }),
        takeUntil(this.destroy$)
      ).subscribe((newParticipants) => {
        this.combinedData$ = this.combinedData$.pipe(
          map(data => ({ ...data, participants: newParticipants })),
          takeUntil(this.destroy$)
        );
      });
    }
  }
}
