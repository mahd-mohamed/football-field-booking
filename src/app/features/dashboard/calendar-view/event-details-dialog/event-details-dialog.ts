import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';

export interface EventDetailsData {
  type: 'booking' | 'match';
  data: any;
}

@Component({
  selector: 'app-event-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule
  ],
  templateUrl: './event-details-dialog.html',
  styleUrls: ['./event-details-dialog.css']
})
export class EventDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EventDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EventDetailsData
  ) {}

  getEventIcon(): string {
    switch (this.data.type) {
      case 'booking':
        return 'event';
      case 'match':
        return 'sports_soccer';
      default:
        return 'event';
    }
  }

  getEventColor(): string {
    switch (this.data.type) {
      case 'booking':
        return '#4caf50';
      case 'match':
        return '#ff9800';
      default:
        return '#2196f3';
    }
  }

  getEventTitle(): string {
    switch (this.data.type) {
      case 'booking':
        return 'Booking Details';
      case 'match':
        return 'Match Details';
      default:
        return 'Event Details';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDuration(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    let end: Date;
    
    if (endTime) {
      end = new Date(endTime);
    } else {
      // Default to 2 hours if no end time provided
      end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    }
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  }

  getStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  getMatchStatusColor(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'primary';
      case 'SCHEDULED':
        return 'accent';
      case 'PENDING_PAYMENT':
        return 'warn';
      case 'CANCELLED':
        return 'warn';
      default:
        return 'primary';
    }
  }

  getMatchStatusText(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmed';
      case 'SCHEDULED':
        return 'Scheduled';
      case 'PENDING_PAYMENT':
        return 'Pending Payment';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
} 