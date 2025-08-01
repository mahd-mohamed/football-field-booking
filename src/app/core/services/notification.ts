import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export type NotificationType = 
  | 'BOOKING_CONFIRMATION' 
  | 'MATCH_INVITATION' 
  | 'TEAM_JOIN_REQUEST' 
  | 'TEAM_INVITATION' 
  | 'APPROVAL' 
  | 'REJECTION' 
  | 'MATCH_PARTICIPATION_REQUEST'
  | 'MATCH_PARTICIPATION_APPROVED'
  | 'MATCH_PARTICIPATION_REJECTED';

export type NotificationStatus = 'UNREAD' | 'READ';

export interface INotification {
  id: string;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  relatedId?: string; // ID of related booking, match, team, etc.
  createdAt: string;
  readAt?: string;
  metadata?: {
    bookingId?: string;
    matchId?: string;
    teamId?: string;
    fromUserId?: number;
    fromUsername?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class Notification {
  
  // Create notification
  createNotification(notification: Omit<INotification, 'id' | 'createdAt'>): Observable<INotification> {
    try {
      const newNotification: INotification = {
        ...notification,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      const notificationsString = localStorage.getItem('notifications');
      const notifications: INotification[] = notificationsString ? JSON.parse(notificationsString) : [];
      notifications.push(newNotification);
      localStorage.setItem('notifications', JSON.stringify(notifications));

      return of(newNotification);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  // Get notifications for a user
  getUserNotifications(userId: number): Observable<INotification[]> {
    try {
      const notificationsString = localStorage.getItem('notifications');
      if (notificationsString) {
        const notifications: INotification[] = JSON.parse(notificationsString);
        const userNotifications = notifications.filter(n => n.userId === userId);
        return of(userNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
      return of([]);
    } catch (error) {
      console.error('Error loading user notifications:', error);
      return of([]);
    }
  }

  // Get unread notifications count
  getUnreadCount(userId: number): Observable<number> {
    try {
      const notificationsString = localStorage.getItem('notifications');
      if (notificationsString) {
        const notifications: INotification[] = JSON.parse(notificationsString);
        const unreadCount = notifications.filter(n => n.userId === userId && n.status === 'UNREAD').length;
        return of(unreadCount);
      }
      return of(0);
    } catch (error) {
      console.error('Error getting unread count:', error);
      return of(0);
    }
  }

  // Mark notification as read
  markAsRead(notificationId: string): Observable<void> {
    try {
      const notificationsString = localStorage.getItem('notifications');
      if (notificationsString) {
        const notifications: INotification[] = JSON.parse(notificationsString);
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.status = 'READ';
          notification.readAt = new Date().toISOString();
          localStorage.setItem('notifications', JSON.stringify(notifications));
        }
      }
      return of(void 0);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  // Mark all notifications as read for a user
  markAllAsRead(userId: number): Observable<void> {
    try {
      const notificationsString = localStorage.getItem('notifications');
      if (notificationsString) {
        const notifications: INotification[] = JSON.parse(notificationsString);
        const updatedNotifications = notifications.map(n => {
          if (n.userId === userId && n.status === 'UNREAD') {
            return { ...n, status: 'READ' as NotificationStatus, readAt: new Date().toISOString() };
          }
          return n;
        });
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      }
      return of(void 0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  // Delete notification
  deleteNotification(notificationId: string): Observable<void> {
    try {
      const notificationsString = localStorage.getItem('notifications');
      if (notificationsString) {
        const notifications: INotification[] = JSON.parse(notificationsString);
        const filteredNotifications = notifications.filter(n => n.id !== notificationId);
        localStorage.setItem('notifications', JSON.stringify(filteredNotifications));
      }
      return of(void 0);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  // Helper methods for creating specific types of notifications
  createBookingConfirmationNotification(userId: number, bookingId: string, placeName: string): Observable<INotification> {
    return this.createNotification({
      userId,
      type: 'BOOKING_CONFIRMATION',
      title: 'Booking Confirmed',
      message: `Your booking for ${placeName} has been confirmed!`,
      status: 'UNREAD',
      relatedId: bookingId,
      metadata: { bookingId }
    });
  }

  createMatchInvitationNotification(userId: number, matchId: string, teamName: string, organizerName: string): Observable<INotification> {
    return this.createNotification({
      userId,
      type: 'MATCH_INVITATION',
      title: 'Match Invitation',
      message: `${organizerName} has invited you to join a match with ${teamName}`,
      status: 'UNREAD',
      relatedId: matchId,
      metadata: { matchId }
    });
  }

  createTeamJoinRequestNotification(userId: number, teamId: string, teamName: string, requesterName: string): Observable<INotification> {
    return this.createNotification({
      userId,
      type: 'TEAM_JOIN_REQUEST',
      title: 'Team Join Request',
      message: `${requesterName} wants to join your team ${teamName}`,
      status: 'UNREAD',
      relatedId: teamId,
      metadata: { teamId }
    });
  }

  createTeamInvitationNotification(userId: number, teamId: string, teamName: string, organizerName: string): Observable<INotification> {
    return this.createNotification({
      userId,
      type: 'TEAM_INVITATION',
      title: 'Team Invitation',
      message: `${organizerName} has invited you to join team ${teamName}`,
      status: 'UNREAD',
      relatedId: teamId,
      metadata: { teamId }
    });
  }

  createApprovalNotification(userId: number, type: string, itemName: string): Observable<INotification> {
    return this.createNotification({
      userId,
      type: 'APPROVAL',
      title: 'Request Approved',
      message: `Your ${type} request for ${itemName} has been approved!`,
      status: 'UNREAD'
    });
  }

  createRejectionNotification(userId: number, type: string, itemName: string): Observable<INotification> {
    return this.createNotification({
      userId,
      type: 'REJECTION',
      title: 'Request Rejected',
      message: `Your ${type} request for ${itemName} has been rejected.`,
      status: 'UNREAD'
    });
  }

  createMatchParticipationRequestNotification(userId: number, matchId: string, playerName: string): Observable<INotification> {
    return this.createNotification({
      userId,
      type: 'MATCH_PARTICIPATION_REQUEST',
      title: 'Match Participation Request',
      message: `${playerName} wants to participate in your match`,
      status: 'UNREAD',
      relatedId: matchId,
      metadata: { matchId }
    });
  }

  createMatchParticipationApprovedNotification(userId: number, matchId: string): Observable<INotification> {
    return this.createNotification({
      userId,
      type: 'MATCH_PARTICIPATION_APPROVED',
      title: 'Match Participation Approved',
      message: 'Your request to participate in the match has been approved!',
      status: 'UNREAD',
      relatedId: matchId,
      metadata: { matchId }
    });
  }

  createMatchParticipationRejectedNotification(userId: number, matchId: string): Observable<INotification> {
    return this.createNotification({
      userId,
      type: 'MATCH_PARTICIPATION_REJECTED',
      title: 'Match Participation Rejected',
      message: 'Your request to participate in the match has been rejected.',
      status: 'UNREAD',
      relatedId: matchId,
      metadata: { matchId }
    });
  }
}
