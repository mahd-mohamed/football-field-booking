import { Routes } from '@angular/router';

// AUTH
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';

// HOME
import { HomePage } from './home/home-page/home-page';

// DASHBOARD
import { UserDashboard } from './features/dashboard/user-dashboard/user-dashboard';

// USERS
import { Profile } from './features/users/profile/profile';
import { UserList } from './features/users/user-list/user-list';
import { UserCard } from './features/users/user-card/user-card';

// TEAMS
import { TeamList } from './features/teams/team-list/team-list';
import { CreateTeam } from './features/teams/create-team/create-team';
import { TeamDetails } from './features/teams/team-details/team-details';
import { InvitePlayer } from './features/teams/invite-player/invite-player';
import { TeamRequests } from './features/teams/team-requests/team-requests';

// PLACES
import { PlaceList } from './features/places/place-list/place-list';
import { PlaceDetails } from './features/places/place-details/place-details';

// BOOKINGS
import { BookingForm } from './features/bookings/booking-form/booking-form';
import { BookingHistory } from './features/bookings/booking-history/booking-history';
import { BookingDetails } from './features//bookings/booking-details/booking-details';

// MATCHES
import { ScheduleMatch } from './features//matches/schedule-match/schedule-match';
import { MatchList } from './features//matches/match-list/match-list';
import { MatchDetails } from './features//matches/match-details/match-details';
import { MatchParticipants } from './features//matches/match-participants/match-participants';

// NOTIFICATIONS
import { NotificationList } from './features//notifications/notification-list/notification-list';
import { RequestHandler } from './features//notifications/request-handler/request-handler';

export const routes: Routes = [
  // Home
  { path: '', component: HomePage },

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
