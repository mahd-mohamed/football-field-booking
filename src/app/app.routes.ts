import { Routes } from '@angular/router';

// AUTH
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';

// HOME
import { LandingPage } from './home/landing-page/landing-page';

// DASHBOARD
import { UserDashboard } from './dashboard/user-dashboard/user-dashboard';

// USERS
import { Profile } from './users/profile/profile';
import { UserList } from './users/user-list/user-list';
import { UserCard } from './users/user-card/user-card';

// TEAMS
import { TeamList } from './teams/team-list/team-list';
import { CreateTeam } from './teams/create-team/create-team';
import { TeamDetails } from './teams/team-details/team-details';
import { InvitePlayer } from './teams/invite-player/invite-player';
import { TeamRequests } from './teams/team-requests/team-requests';

// PLACES
import { PlaceList } from './places/place-list/place-list';
import { PlaceDetails } from './places/place-details/place-details';

// BOOKINGS
import { BookingForm } from './bookings/booking-form/booking-form';
import { BookingHistory } from './bookings/booking-history/booking-history';
import { BookingDetails } from './bookings/booking-details/booking-details';

// MATCHES
import { ScheduleMatch } from './matches/schedule-match/schedule-match';
import { MatchList } from './matches/match-list/match-list';
import { MatchDetails } from './matches/match-details/match-details';
import { MatchParticipants } from './matches/match-participants/match-participants';

// NOTIFICATIONS
import { NotificationList } from './notifications/notification-list/notification-list';
import { RequestHandler } from './notifications/request-handler/request-handler';

export const routes: Routes = [
  // Home
  { path: '', component: LandingPage },

  // Auth
  { path: 'login', component: Login },
  { path: 'register', component: Register },

  // Dashboard
  { path: 'dashboard', component: UserDashboard },

  // Users
  { path: 'profile', component: Profile },
  { path: 'users', component: UserList },
  { path: 'users/:id', component: UserCard },

  // Teams
  { path: 'teams', component: TeamList },
  { path: 'teams/create', component: CreateTeam },
  { path: 'teams/:id', component: TeamDetails },
  { path: 'teams/:id/invite', component: InvitePlayer },
  { path: 'teams/:id/requests', component: TeamRequests },

  // Places
  { path: 'places', component: PlaceList },
  { path: 'places/:id', component: PlaceDetails },

  // Bookings
  { path: 'book', component: BookingForm },
  { path: 'bookings/history', component: BookingHistory },
  { path: 'bookings/:id', component: BookingDetails },

  // Matches
  { path: 'matches', component: MatchList },
  { path: 'matches/schedule', component: ScheduleMatch },
  { path: 'matches/:id', component: MatchDetails },
  { path: 'matches/:id/participants', component: MatchParticipants },

  // Notifications
  { path: 'notifications', component: NotificationList },
  { path: 'notifications/requests', component: RequestHandler },

  // Fallback
  { path: '**', redirectTo: '' }
];
