import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ErrorNotificationsComponent } from './shared/error-notifications/error-notifications.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ErrorNotificationsComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'football-booking';
}
