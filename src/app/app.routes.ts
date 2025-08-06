import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home-page/home-page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard-layout/dashboard-layout').then(
        (m) => m.DashboardLayout
      ),
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full',
      },
      {
  path: 'overview',
  loadComponent: () =>
    import('./features/dashboard/overview-page/overview-page').then((c) => c.OverviewComponent),
}
,
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/user-list/user-list').then(
            (m) => m.UserList
          ),
      },
      {
        path: 'teams',
        loadComponent: () =>
          import('./features/teams/team-list/team-list').then(
            (m) => m.TeamList
          ),
      },
      {
        path: 'teams/create',
        loadComponent: () =>
          import('./features/teams/create-team/create-team').then(
            (m) => m.CreateTeam
          ),
      },
      {
        path: 'teams/requests',
        loadComponent: () =>
          import('./features/teams/team-requests/team-requests').then(
            (m) => m.TeamRequests
          ),
      },
      {
        path: 'teams/:id',
        loadComponent: () =>
          import('./features/teams/team-details/team-details').then(
            (m) => m.TeamDetails
          ),
      },
      {
        path: 'teams/:id/invite',
        loadComponent: () =>
          import('./features/teams/invite-player/invite-player').then(
            (m) => m.InvitePlayer
          ),
      },
      {
        path: 'places',
        loadComponent: () =>
          import('./features/places/place-list/place-list').then(
            (m) => m.PlaceList
          ),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./features/bookings/booking-list/booking-list').then(
            (m) => m.BookingListComponent
          ),
      },
      {
        path: 'bookings/create',
        loadComponent: () =>
          import('./features/bookings/booking-form/booking-form').then(
            (m) => m.BookingFormComponent
          ),
      },
      {
        path: 'bookings/details/:id',
        loadComponent: () =>
          import('./features/bookings/booking-details/booking-details').then(
            (m) => m.BookingDetailsComponent
          ),
      },
      {
        path: 'admin/bookings',
        loadComponent: () =>
          import('./features/bookings/admin-booking-management/admin-booking-management').then(
            (m) => m.AdminBookingManagementComponent
          ),
      },
      {
        path: 'matches',
        loadComponent: () =>
          import('./features/matches/match-list/match-list').then(
            (m) => m.MatchList
          ),
      },
      {
        path: 'matches/:id',
        loadComponent: () =>
          import('./features/matches/match-details/match-details').then(
            (m) => m.MatchDetails
          ),
      },
      {
        path: 'bookings/:bookingId/invite',
        loadComponent: () =>
          import('./features/bookings/invite-participants/invite-participants').then(
            (m) => m.InviteParticipantsComponent
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import(
            './features/notifications/notification-list/notification-list'
          ).then((m) => m.NotificationList),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/users/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/dashboard/calendar-view/calendar-view').then(
            (m) => m.CalendarViewComponent
          ),
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./features/dashboard/admin-dashboard/admin-dashboard').then(
            (m) => m.AdminDashboardComponent
          ),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/not-found/not-found').then((m) => m.NotFound),
  },
];
