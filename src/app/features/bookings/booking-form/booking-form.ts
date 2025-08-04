import { Component, OnInit } from '@angular/core';
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
import { BookingService, IBooking, ITimeSlot } from '../../../core/services/booking';
import { Team } from '../../../core/services/team';
import { Place, PlaceModel } from '../../../core/services/place';
import { Auth } from '../../../core/services/auth';

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
export class BookingFormComponent implements OnInit {
  bookingForm!: FormGroup;
  places: PlaceModel[] = [];
  userTeams: any[] = [];
  selectedPlace: PlaceModel | null = null;
  selectedDate: Date = new Date();
  availableTimeSlots: ITimeSlot[] = [];
  selectedTimeSlots: ITimeSlot[] = [];
  bookingGroups: IBookingGroup[] = [];
  currentUser: any;
  
  successMessage: string | null = null;
  errorMessage: string | null = null;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private teamService: Team,
    private placeService: Place,
    private authService: Auth
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initForm();
    this.loadPlaces();
    this.loadUserTeams();
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
    this.places = this.placeService.getAllPlaces();
  }

  private loadUserTeams(): void {
    if (this.currentUser) {
      this.teamService.getTeamsByCreator(this.currentUser.id).subscribe({
        next: (teams) => {
          this.userTeams = teams;
        },
        error: (error: any) => {
          console.error('Error loading user teams:', error);
          this.errorMessage = 'Failed to load your teams.';
        }
      });
    }
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
    const date = this.bookingForm.get('date')?.value;
    
    if (placeId && date) {
      this.isLoading = true;
      this.bookingService.getAvailableTimeSlots(placeId, date.toISOString()).subscribe({
        next: (slots) => {
          this.availableTimeSlots = slots;
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
          place_id: formValue.place_id,
          user_id: this.currentUser.id,
          team_id: formValue.team_id,
          start_time: group.start_time,
          end_time: group.end_time,
          status: 'PENDING_PAYMENT' as const,
          place_name: this.selectedPlace?.name,
          team_name: this.userTeams.find(t => t.id === formValue.team_id)?.name,
          user_name: this.currentUser.username
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
          
          setTimeout(() => {
            this.router.navigate(['/dashboard/bookings']);
          }, 2000);
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
}
