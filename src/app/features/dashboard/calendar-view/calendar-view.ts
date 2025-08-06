import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { EventDetailsDialogComponent, EventDetailsData } from './event-details-dialog/event-details-dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { BookingService, IBooking } from '../../../core/services/booking.service';
import { MatchParticipantService, IUserMatch } from '../../../core/services/match-participant.service';
import { PlaceService } from '../../../core/services/place.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule,
    FullCalendarModule
  ],
  templateUrl: './calendar-view.html',
  styleUrls: ['./calendar-view.css']
})
export class CalendarViewComponent implements OnInit {
  private bookingService = inject(BookingService);
  private matchService = inject(MatchParticipantService);
  private placeService = inject(PlaceService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    locale: 'en',
    direction: 'ltr',
    height: 'auto',
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    events: [],
    eventClick: this.handleEventClick.bind(this),
    eventTextColor: '#ffffff',
    eventDisplay: 'block',
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
  };

  ngOnInit() {
    this.loadCalendarEvents();
  }

private async loadCalendarEvents() {
  try {
    const currentUser = this.authService.getCurrentUser();

    const [allBookings, participantMatches, myMatchesAsOrganizer, places] = await Promise.all([
      this.bookingService.getBookings().toPromise(),
      this.matchService.getUserParticipatedMatches().toPromise(),
      this.bookingService.getMyMatchesAsOrganizer().toPromise(),
      this.placeService.getAllPlaces().toPromise()
    ]);

    const safePlaces = Array.isArray(places) ? places : [];
    const events: any[] = [];

    // ✅ 1. My Organizer Bookings (Green) - skipping CANCELLED
    const myOrganizerBookingIds = new Set<string>();
    if (Array.isArray(myMatchesAsOrganizer)) {
      for (const booking of myMatchesAsOrganizer) {
        if (booking.status === 'CANCELLED') continue;

        const place = safePlaces.find(p => p.id.toString() === booking.placeId?.toString());

        let teamName = booking.teamName;
        if (!teamName) {
          const fallback = allBookings?.find(b => b.id === booking.id);
          teamName = fallback?.teamName || 'Team';
        }

        const bookerName = booking.userName && booking.userName !== 'User'
          ? booking.userName
          : (currentUser?.username || 'Unknown User');

        myOrganizerBookingIds.add(booking.id);

        events.push({
          id: `booking-${booking.id}`,
          title: `Booking: ${teamName}`,
          start: booking.startTime,
          end: booking.endTime,
          backgroundColor: '#4caf50',
          borderColor: '#4caf50',
          textColor: '#ffffff',
          extendedProps: {
            type: 'booking',
            data: {
              ...booking,
              teamName,
              userName: bookerName,
              status: booking.status || 'CONFIRMED',
              placeName: place?.name || 'Pitch',
              location: place?.location || 'Unknown Location'
            }
          }
        });
      }
    }

    // ✅ 2. All Other Bookings (Gray) - skipping CANCELLED
    if (Array.isArray(allBookings)) {
      for (const booking of allBookings) {
        if (myOrganizerBookingIds.has(booking.id)) continue;
        if (booking.status === 'CANCELLED') continue;

        const place = safePlaces.find(p => p.id.toString() === booking.placeId?.toString());

        events.push({
          id: `booking-${booking.id}`,
          title: `Booking: ${booking.teamName || 'Team'}`,
          start: booking.startTime,
          end: booking.endTime,
          backgroundColor: '#96ac1dff',
          borderColor: '#9e9e9e',
          textColor: '#ffffff',
          extendedProps: {
            type: 'booking',
            data: {
              ...booking,
              status: booking.status || 'CONFIRMED',
              placeName: place?.name || 'Pitch',
              location: place?.location || 'Unknown Location'
            }
          }
        });
      }
    }

    // // ✅ 3. Matches as Participant (Orange) - skipping CANCELLED
    // if (Array.isArray(participantMatches)) {
    //   const detailedMatches = await Promise.all(
    //     participantMatches.map(async (match: IUserMatch) => {
    //       if (match.bookingStatus === 'CANCELLED') return undefined;

    //       try {
    //         const detailedBooking = await this.bookingService.getBookingDetailsById(match.matchId).toPromise();
    //         if (detailedBooking?.status === 'CANCELLED') return undefined;

    //         const place = safePlaces.find(
    //           p => p.id.toString() === (match.placeId?.toString() || detailedBooking?.placeId?.toString())
    //         );

    //         return {
    //           ...match,
    //           placeName: place?.name || detailedBooking?.placeName || 'Pitch',
    //           location: place?.location || detailedBooking?.placeName || 'Unknown Location',
    //           startTime: detailedBooking?.startTime || match.startTime,
    //           endTime: detailedBooking?.endTime || match.endTime,
    //           bookingStatus: detailedBooking?.status || match.bookingStatus || 'PENDING_PLAYERS',
    //           teamName: match.teamName || detailedBooking?.teamName || 'Team'
    //         } as IUserMatch & { location: string };
    //       } catch {
    //         return {
    //           ...match,
    //           placeName: 'Pitch',
    //           location: 'Unknown Location',
    //           bookingStatus: 'PENDING_PLAYERS'
    //         } as IUserMatch & { location: string };
    //       }
    //     })
    //   );

    //   (detailedMatches.filter((m): m is IUserMatch & { location: string } => m !== undefined))
    //     .forEach(enrichedMatch => {
    //       events.push({
    //         id: `match-${enrichedMatch.matchId}`,
    //         title: `Match: ${enrichedMatch.teamName}`,
    //         start: enrichedMatch.startTime,
    //         end: enrichedMatch.endTime,
    //         backgroundColor: '#ff9800',
    //         borderColor: '#ff9800',
    //         textColor: '#ffffff',
    //         extendedProps: {
    //           type: 'match',
    //           data: enrichedMatch
    //         }
    //       });
    //     });
    // }

    this.calendarOptions.events = events;

  } catch (error) {
    console.error('Error loading calendar events:', error);
    this.calendarOptions.events = [];
  }
}

  private handleEventClick(info: EventClickArg) {
    const eventData = info.event.extendedProps as any;

    this.dialog.open(EventDetailsDialogComponent, {
      width: '600px',
      data: {
        type: eventData['type'],
        data: eventData['data']
      } as EventDetailsData
    });
  }
}
