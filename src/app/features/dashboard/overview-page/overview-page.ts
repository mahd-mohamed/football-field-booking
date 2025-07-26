import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core/services/auth';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard';
import { UnifiedDashboardComponent } from '../unified-dashboard/unified-dashboard';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    FontAwesomeModule,
    AdminDashboardComponent,
    UnifiedDashboardComponent
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


