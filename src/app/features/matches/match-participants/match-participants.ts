import { Component, OnInit ,OnDestroy} from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest, map, switchMap, of, catchError,tap, takeUntil,Subject } from 'rxjs';

import { Match, IMatchParticipant, IBookingMatch } from '../../../core/services/match';
import { Team, ITeamMember } from '../../../core/services/team';

@Component({
  selector: 'app-match-participants',
  imports: [CommonModule], 
  templateUrl: './match-participants.html',
  styleUrls: ['./match-participants.css'] 
})
export class MatchParticipants implements OnInit,OnDestroy { 
  matchId!: string;
  teamId!: string;
  match$!: Observable<IBookingMatch>;
  players$!: Observable<ITeamMember[]>;
  matchParticipants$!: Observable<IMatchParticipant[]>;
  // Corrected: Allow 'match' to be null in the combined data type
  combinedData$!: Observable<{ match: IBookingMatch | null, players: ITeamMember[], participants: IMatchParticipant[], teamId: string }>;

  errorMessage: string | null = null;
  private destroy$ = new Subject<void>(); // For managing subscriptions

  constructor(
    private route: ActivatedRoute,
    private matchService: Match,
    private teamService: Team
  ) { }

  ngOnInit(): void {
    console.log('MatchParticipantsComponent: ngOnInit started.');

    this.combinedData$ = this.route.paramMap.pipe(
      map(params => {
        this.matchId = params.get('id') || '';
        this.teamId = params.get('teamId') || '';
        console.log(`MatchParticipantsComponent: Route Params - matchId: ${this.matchId}, teamId: ${this.teamId}`);

        if (!this.matchId || !this.teamId) {
          this.errorMessage = 'Match ID or Team ID is missing in the route.';
          console.error('MatchParticipantsComponent:', this.errorMessage);
          throw new Error(this.errorMessage);
        }
        return { matchId: this.matchId, teamId: this.teamId };
      }),
      switchMap(({ matchId, teamId }) => {
        console.log(`MatchParticipantsComponent: Initiating service calls for matchId: ${matchId}, teamId: ${teamId}`);
        return combineLatest([
          this.matchService.getBookingMatchById(matchId),
          this.teamService.getTeamMembers(teamId),
          this.matchService.getMatchParticipants(matchId)
        ]).pipe(
          // Explicitly type the tuple elements here to help TypeScript
          tap(([match, players, participants]: [IBookingMatch | null, ITeamMember[], IMatchParticipant[]]) => {
            console.log('MatchParticipantsComponent: Service Data Received - Match:', match);
            console.log('MatchParticipantsComponent: Service Data Received - Players:', players);
            console.log('MatchParticipantsComponent: Service Data Received - Participants:', participants);
          }),
          // Explicitly type the tuple elements here as well
          map(([match, players, participants]: [IBookingMatch | null, ITeamMember[], IMatchParticipant[]]) => ({ match, players, participants, teamId })),
          catchError((err: any) => { // Explicitly type err
            this.errorMessage = `Error loading data from services: ${err.message}`;
            console.error('MatchParticipantsComponent: Service data fetch error caught:', err);
            // Corrected: Ensure the returned object strictly matches the Observable type
            return of({ match: null, players: [] as ITeamMember[], participants: [] as IMatchParticipant[], teamId: teamId });
          })
        );
      }),
      tap(data => {
        console.log('MatchParticipantsComponent: Final combinedData$ stream emitted:', data);
        if (!data.match) {
          console.warn('MatchParticipantsComponent: Final data has no match object. Check mock data or service logic.');
        }
        // Corrected: Add null checks for players and participants before accessing length
        if (data.players && data.players.length === 0) {
          console.warn('MatchParticipantsComponent: Final data has no players. Check mock data or service logic.');
        }
        if (data.participants && data.participants.length === 0) {
          console.warn('MatchParticipantsComponent: Final data has no participants. Check mock data or service logic.');
        }
      }),
      catchError((err: any) => { // Explicitly type err
        this.errorMessage = `Error in overall combinedData$ stream: ${err.message}`;
        console.error('MatchParticipantsComponent: Overall stream error caught:', err);
        // Corrected: Ensure the returned object strictly matches the Observable type
        return of({ match: null, players: [] as ITeamMember[], participants: [] as IMatchParticipant[], teamId: '' });
      }),
      takeUntil(this.destroy$) // Unsubscribe on component destroy
    );

    // Subscribe to the combinedData$ to trigger the observable chain
    // and log the final state for debugging
    this.combinedData$.subscribe({
      next: (data: { match: IBookingMatch | null, players: ITeamMember[], participants: IMatchParticipant[], teamId: string }) => { // Explicitly type data
        console.log('MatchParticipantsComponent: combinedData$ subscription received data:', data);
        if (data.match) {
          console.log('MatchParticipantsComponent: Match data is available for rendering.');
        } else {
          console.warn('MatchParticipantsComponent: Match data is NULL in subscription. Template will show "No match data available."');
        }
      },
      error: (err: any) => { // Explicitly type err
        console.error('MatchParticipantsComponent: combinedData$ subscription error:', err);
      },
      complete: () => {
        console.log('MatchParticipantsComponent: combinedData$ subscription completed.');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isPlayerInvited(userId: string, participants: IMatchParticipant[]): boolean {
    return participants.some(p => p.userId.toString() === userId && (p.status === 'INVITED' || p.status === 'ACCEPTED'));
  }

  getPlayerInvitationStatus(userId: string, participants: IMatchParticipant[]): string {
    const participant = participants.find(p => p.userId.toString() === userId);
    return participant ? participant.status.charAt(0).toUpperCase() + participant.status.slice(1) : 'Not Invited';
  }

  invitePlayer(userId: string): void {
    if (!this.matchId) {
      this.errorMessage = 'Match ID is not available.';
      return;
    }

    this.matchService.addMatchParticipant(this.matchId, parseInt(userId)).subscribe({
      next: (participant: IMatchParticipant) => { // Explicitly type participant
        console.log('User invited successfully:', participant);
        this.refreshParticipants();
      },
      error: (err: any) => { // Explicitly type err
        this.errorMessage = `Failed to invite user: ${err.message}`;
        console.error(err);
      }
    });
  }

  private refreshParticipants(): void {
    if (this.matchId) {
      this.matchService.getMatchParticipants(this.matchId).pipe(
        catchError((err: any) => { // Explicitly type err
          this.errorMessage = `Error refreshing participants: ${err.message}`;
          console.error(err);
          return of([]);
        }),
        takeUntil(this.destroy$)
      ).subscribe((newParticipants: IMatchParticipant[]) => { // Explicitly type newParticipants
        // This is a simple way to update the observable, for more complex state management
        // consider using a BehaviorSubject in the service.
        this.combinedData$ = this.combinedData$.pipe(
          map(data => ({ ...data, participants: newParticipants })),
          takeUntil(this.destroy$)
        );
      });
    }
  }
}
