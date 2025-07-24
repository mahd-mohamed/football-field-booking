import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core/services/auth';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard';
import { OrganizerDashboardComponent } from '../organizer-dashboard/organizer-dashboard';
import { PlayerDashboardComponent } from '../player-dashboard/player-dashboard';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    FontAwesomeModule,
    AdminDashboardComponent,
    OrganizerDashboardComponent,
    PlayerDashboardComponent
  ],
  templateUrl: './overview-page.html',
  styleUrls: ['./overview-page.css'],
})
export class OverviewComponent {
  role: string | undefined;

  constructor(private auth: Auth) {
    this.role = this.auth.getCurrentUser()?.role;
  }
}


