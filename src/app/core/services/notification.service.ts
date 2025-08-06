import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';

// Type to match Java RequestType enum
export type RequestType = 'JOIN_TEAM_REQUEST' | 'JOIN_TEAM_INVITATION' | 'MATCH_INVITATION';

export type StatusType = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export interface INotification {
  id: string;
  requestType: RequestType;
  sendTime : string; // ISO date string
  status: StatusType;
  requestMessage: string;
  senderId : string;
  receiverId : string;
  jokerId: string;
  senderEmail: string
  };

@Injectable({
  providedIn: 'root'
})
export class NotificationService 
{
  private apiUrl = 'http://localhost:8080/api/requests'; 

  notificationCount = 0;

  constructor(private http: HttpClient) {}

  // Get notifications for a user using the new API
  getUserNotifications(): Observable<INotification[]> {
    console.log('NotificationService: Fetching user notifications from API');

    return this.http.get<INotification[]>(`${this.apiUrl}/received`).pipe(
      catchError(error => {
        console.error('NotificationService: Error fetching notifications from API:', error);
        return of([]);
      })
    );
  }

  // Get notifications count
  getNotificationCount(userId: string): Observable<number> {
    return this.getUserNotifications().pipe(
      map(notifications => notifications.filter(n => n.status === 'PENDING').length),
      catchError(error => {
        console.error('Error getting notification count:', error);
        return of(0);
      })
    );
  }



}
