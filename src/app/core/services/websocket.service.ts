import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { IUser } from '../models/iuser.model';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client: Client;
  private bookingUpdates$ = new Subject<{ placeId: string; date: string }>();
  private notificationPing$ = new Subject<void>();

  constructor(private authService: AuthService) {

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        this.client.subscribe('/topic/bookings', (msg: IMessage) => {
          if (msg.body) {
            this.bookingUpdates$.next(JSON.parse(msg.body));
          }
        });

        let receiverId = null;
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
          console.log("No current user")
        }
        else {
          receiverId = currentUser.id;
        }
        this.client.subscribe(`/topic/notification/${receiverId}`, (msg: IMessage) => {
          this.notificationPing$.next();
        });
      }
    });

    this.client.activate();
  }

  onBookingUpdate(): Observable<{ placeId: string; date: string }> {
    return this.bookingUpdates$.asObservable();
  }

  onNotification(): Observable<void> {
    return this.notificationPing$.asObservable();
  }
}
