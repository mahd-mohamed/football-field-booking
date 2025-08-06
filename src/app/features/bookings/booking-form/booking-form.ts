import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BookingService, ITimeSlot } from '../../../core/services/booking.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { TeamService } from '../../../core/services/team.service';
import { PlaceService } from '../../../core/services/place.service';
import { IPlace } from '../../../core/models/iplace.model';
import { AuthService } from '../../../core/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface IBookingGroup {
  start_time: string;
  end_time: string;
  slots: ITimeSlot[];
  duration: number; // in hours
}

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './booking-form.html',
  styleUrls: ['./booking-form.css']
})
export class BookingFormComponent implements OnInit, OnDestroy {
  bookingForm!: FormGroup;
  places: IPlace[] = [];
  userTeams: any[] = [];
  selectedPlace: IPlace | null = null;
  selectedDate: Date = new Date();
  availableTimeSlots: ITimeSlot[] = [];
  selectedTimeSlots: ITimeSlot[] = [];
  bookingGroups: IBookingGroup[] = [];
  currentUser: any;
  private destroy$ = new Subject<void>();

  successMessage: string | null = null;
  errorMessage: string | null = null;
  isLoading: boolean = false;
  minDate: Date = new Date();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private teamService: TeamService,
    private placeService: PlaceService,
    private authService: AuthService,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initForm();
    this.loadPlaces();
    this.loadUserTeams();
    this.webSocketService.onBookingUpdate().pipe(
      takeUntil(this.destroy$)
    ).subscribe((msg) => {
      const placeId = this.bookingForm.get('place_id')?.value;
      const selectedDate = this.bookingForm.get('date')?.value;
      const localDateString = selectedDate.toLocaleDateString('en-CA');

      // Only reload if the place and date match current view
      if (placeId === msg.placeId && msg.date === localDateString) {
        this.loadAvailableTimeSlots();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.bookingForm = this.fb.group({
      place_id: ['', Validators.required],
      team_id: ['', Validators.required],
      date: [new Date(), Validators.required],
      time_slots: [[], Validators.required]
    });
  }

  private loadPlaces(): void {
    this.placeService.getAllPlaces().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (places) => {
        this.places = places;
      },
      error: (error) => {
        console.error('Failed to load places:', error);
        this.errorMessage = 'Failed to load places. Please try again.';
      }
    });
  }
private loadUserTeams(): void {
  this.teamService.getTeamsByCreator().subscribe({
    next: (response: any) => {
      const teams = response?.content || [];
      this.userTeams = teams.filter((team: any) =>
        team.members?.some((m: any) => m.role === 'ORGANIZER')
      );
      console.log('Organizer teams:', this.userTeams);
    },
    error: (error: any) => {
      console.error('Error loading user teams:', error);
      this.errorMessage = 'Failed to load your teams.';
    }
  });
}


  onPlaceChange(): void {
    const placeId = this.bookingForm.get('place_id')?.value;
    if (placeId) {
      this.selectedPlace = this.places.find(p => p.id.toString() === placeId) || null;
      this.loadAvailableTimeSlots();
    }
  }

  onDateChange(): void {
    this.loadAvailableTimeSlots();
  }

  private loadAvailableTimeSlots(): void {
  const placeId = this.bookingForm.get('place_id')?.value;
  const date: Date = this.bookingForm.get('date')?.value;

  if (placeId && date) {
    this.isLoading = true;

    // Format date as YYYY-MM-DD (no timezone shift)
    const localDateString = date.toLocaleDateString('en-CA'); // e.g., "2025-08-02"

    this.bookingService.getAvailableTimeSlots(placeId, localDateString).subscribe({
      next: (slots) => {
        console.log("🔹 Slots received from service:", slots);

        const now = new Date();
        const selectedDate = new Date(date);

        this.availableTimeSlots = slots.filter(slot => {
          const slotStart = new Date(slot.start_time);
          if (selectedDate.toDateString() === now.toDateString()) {
            return slotStart.getTime() >= now.getTime() + 60 * 60 * 1000;
          }
          return true;
        });

        console.log("Filtered availableTimeSlots for UI:", this.availableTimeSlots);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading time slots:', error);
        this.errorMessage = 'Failed to load available time slots.';
        this.isLoading = false;
      }
    });
  }
}




  toggleTimeSlot(slot: ITimeSlot): void {
    if (!slot.is_available) return;

    const selectedSlots = this.bookingForm.get('time_slots')?.value || [];
    const index = selectedSlots.findIndex((s: ITimeSlot) => s.id === slot.id);

    if (index > -1) {
      selectedSlots.splice(index, 1);
    } else {
      selectedSlots.push(slot);
    }

    this.bookingForm.patchValue({ time_slots: selectedSlots });
    this.selectedTimeSlots = selectedSlots;
    this.groupConsecutiveSlots();
  }

  private groupConsecutiveSlots(): void {
    if (this.selectedTimeSlots.length === 0) {
      this.bookingGroups = [];
      return;
    }

    // Sort slots by start time
    const sortedSlots = [...this.selectedTimeSlots].sort((a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    const groups: IBookingGroup[] = [];
    let currentGroup: ITimeSlot[] = [sortedSlots[0]];

    for (let i = 1; i < sortedSlots.length; i++) {
      const currentSlot = sortedSlots[i];
      const previousSlot = sortedSlots[i - 1];

      const currentStart = new Date(currentSlot.start_time);
      const previousEnd = new Date(previousSlot.end_time);

      // Check if slots are consecutive (end time of previous = start time of current)
      if (currentStart.getTime() === previousEnd.getTime()) {
        currentGroup.push(currentSlot);
      } else {
        // End current group and start new one
        groups.push(this.createBookingGroup(currentGroup));
        currentGroup = [currentSlot];
      }
    }

    // Add the last group
    if (currentGroup.length > 0) {
      groups.push(this.createBookingGroup(currentGroup));
    }

    this.bookingGroups = groups;
  }

  private createBookingGroup(slots: ITimeSlot[]): IBookingGroup {
    const startTime = new Date(slots[0].start_time);
    const endTime = new Date(slots[slots.length - 1].end_time);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours

    return {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      slots: slots,
      duration: duration
    };
  }

  isSlotSelected(slot: ITimeSlot): boolean {
    return this.selectedTimeSlots.some(s => s.id === slot.id);
  }

  formatTime(time: string): string {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  formatDuration(hours: number): string {
    if (hours === 1) {
      return '1 hour';
    } else if (hours === Math.floor(hours)) {
      return `${hours} hours`;
    } else {
      const wholeHours = Math.floor(hours);
      const minutes = Math.round((hours - wholeHours) * 60);
      return `${wholeHours}h ${minutes}m`;
    }
  }

  getTotalDuration(): number {
    return this.bookingGroups.reduce((sum, group) => sum + group.duration, 0);
  }

  onSubmit(): void {
  if (this.bookingForm.valid && this.currentUser && this.bookingGroups.length > 0) {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValue = this.bookingForm.value;

    // Create one booking for each group of consecutive slots
    const bookingPromises = this.bookingGroups.map((group) => {
      const bookingData = {
        placeId: formValue.place_id, //
        userId: this.currentUser.id,
        teamId: formValue.team_id,   //
        startTime: this.formatLocalDateTime(new Date(group.start_time)),
        endTime: this.formatLocalDateTime(new Date(group.end_time)),
        status: 'PENDING_PAYMENT' as const,
        placeName: this.selectedPlace?.name,
        teamName: this.userTeams.find(t => t.id === formValue.team_id)?.name,
        userName: this.currentUser.username
      };

      return this.bookingService.createBooking(bookingData).toPromise();
    });

    Promise.all(bookingPromises)
      .then(() => {
        const totalDuration = this.bookingGroups.reduce((sum, group) => sum + group.duration, 0);
        this.successMessage = `Successfully created ${this.bookingGroups.length} booking(s) for a total of ${this.formatDuration(totalDuration)}!`;
        this.bookingForm.reset();
        this.selectedTimeSlots = [];
        this.bookingGroups = [];
        this.availableTimeSlots = [];

        this.router.navigate(['/dashboard/bookings']);
      })
      .catch((error) => {
        console.error('Error creating bookings:', error);
        this.errorMessage = 'Failed to create bookings. Please try again.';
      })
      .finally(() => {
        this.isLoading = false;
      });
  } else {
    this.errorMessage = 'Please fill in all required fields and select at least one time slot.';
    this.bookingForm.markAllAsTouched();
  }
}


  onCancel(): void {
    this.router.navigate(['/dashboard/bookings']);
  }

  private formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

}
