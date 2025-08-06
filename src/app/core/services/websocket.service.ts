import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client: Client;
  private bookingUpdates$ = new Subject<{ placeId: string; date: string }>();

  constructor() {
    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        this.client.subscribe('/topic/bookings', (msg: IMessage) => {
          if (msg.body) {
            this.bookingUpdates$.next(JSON.parse(msg.body));
          }
        });
      }
    });

    this.client.activate();
  }

  onBookingUpdate(): Observable<{ placeId: string; date: string }> {
    return this.bookingUpdates$.asObservable();
  }
}
