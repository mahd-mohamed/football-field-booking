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
import { CalendarOptions, EventClickArg, EventApi } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { BookingService } from '../../../core/services/booking';
import { Match, IBookingMatch } from '../../../core/services/match';
import { Team, ITeam } from '../../../core/services/team';
import { Place, PlaceModel } from '../../../core/services/place';
import { Auth } from '../../../core/services/auth';

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
  private matchService = inject(Match);
  private teamService = inject(Team);
  private placeService = inject(Place);
  private authService = inject(Auth);
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
    eventColor: '#1976d2',
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
      // Get current user
      const currentUser = this.authService.getCurrentUser();
      
      // Get real data from services
      let bookingsObservable;
      if (currentUser) {
        console.log('Getting bookings for user ID:', currentUser.id);
        // Use the same method as booking-list component
        bookingsObservable = this.bookingService.getUpcomingBookings(currentUser.id);
      } else {
        console.log('No user logged in, getting all bookings');
        bookingsObservable = this.bookingService.getBookings();
      }
      
      const [bookings, matches, places] = await Promise.all([
        bookingsObservable.toPromise(),
        this.matchService.getBookingMatches().toPromise(),
        Promise.resolve(this.placeService.getAllPlaces())
      ]);

      console.log('Calendar loading real data:');
      console.log('Current User ID:', currentUser?.id);
      console.log('Bookings found:', bookings?.length || 0);
      console.log('Matches found:', matches?.length || 0);
      console.log('Places found:', places?.length || 0);

      const events: any[] = [];

      // 1. Booked Pitches (from BookingService)
      console.log('Loading bookings:', bookings);
      if (bookings && Array.isArray(bookings)) {
        bookings.forEach((booking: any) => {
          const place = places.find(p => p.id.toString() === booking.place_id?.toString());
          console.log('Processing booking:', booking, 'Place:', place);
          events.push({
            id: `booking-${booking.id}`,
            title: `Booking: ${place?.name || 'Pitch'}`,
            start: booking.start_time,
            end: booking.end_time,
            backgroundColor: '#4caf50',
            borderColor: '#4caf50',
            textColor: '#ffffff',
            extendedProps: {
              type: 'booking',
              data: {
                ...booking,
                placeName: place?.name || 'Pitch',
                location: place?.location || 'Unknown Location'
              }
            }
          });
        });
      }

      // 2. Upcoming Matches (from BookingMatch)
      console.log('Loading matches:', matches);
      if (matches && Array.isArray(matches)) {
        matches.forEach((match: IBookingMatch) => {
          const place = places.find(p => p.id.toString() === match.placeId?.toString());
          const team = this.getTeamById(match.teamId);
          console.log('Processing match:', match, 'Place:', place, 'Team:', team);
          
          events.push({
            id: `match-${match.id}`,
            title: `Match: ${team?.name || 'Team'} vs ${match.description || 'Opponent'}`,
            start: `${match.matchDate}T${match.startTime}`,
            end: `${match.matchDate}T${match.endTime}`,
            backgroundColor: '#ff9800',
            borderColor: '#ff9800',
            textColor: '#ffffff',
            extendedProps: {
              type: 'match',
              data: {
                ...match,
                placeName: place?.name || 'Pitch',
                location: place?.location || 'Unknown Location',
                teamName: team?.name || 'Team',
                description: match.description || 'Match'
              }
            }
          });
        });
      }

      this.calendarOptions.events = events;
      
      // Update statistics in real-time
      this.updateStatistics(events);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    }
  }

  private updateStatistics(events: any[]) {
    const bookingCount = events.filter(e => e.extendedProps.type === 'booking').length;
    const matchCount = events.filter(e => e.extendedProps.type === 'match').length;
    
    // Update DOM elements
    setTimeout(() => {
      const bookingElement = document.getElementById('booking-count');
      const matchElement = document.getElementById('match-count');
      
      if (bookingElement) bookingElement.textContent = bookingCount.toString();
      if (matchElement) matchElement.textContent = matchCount.toString();
    }, 100);
  }

  private getTeamById(teamId: string): any {
    try {
      const teamsString = localStorage.getItem('teams');
      if (teamsString) {
        const teams = JSON.parse(teamsString);
        return teams.find((team: any) => team.id === teamId) || null;
      }
      return null;
    } catch (error) {
      console.error('Error loading team by ID:', error);
      return null;
    }
  }

  private handleEventClick(info: EventClickArg) {
    const event = info.event;
    const eventData = event.extendedProps as any;
    
    if (eventData['type'] === 'booking') {
      this.showBookingDetails(eventData['data']);
    } else if (eventData['type'] === 'match') {
      this.showMatchDetails(eventData['data']);
    }
  }

  private showBookingDetails(booking: any) {
    const dialogRef = this.dialog.open(EventDetailsDialogComponent, {
      width: '600px',
      data: { type: 'booking', data: booking } as EventDetailsData
    });
  }

  private showMatchDetails(match: any) {
    const dialogRef = this.dialog.open(EventDetailsDialogComponent, {
      width: '600px',
      data: { type: 'match', data: match } as EventDetailsData
    });
  }






} 