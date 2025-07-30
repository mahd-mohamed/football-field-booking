import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Match, IBookingMatch } from '../../../core/services/match';
import { Team, ITeam } from '../../../core/services/team';
import { Auth } from '../../../core/services/auth';
import { Place, PlaceModel } from '../../../core/services/place';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { NgIf, NgFor, DatePipe } from '@angular/common';

@Component({
  selector: 'app-schedule-match',
  standalone: true,
  templateUrl: './schedule-match.html',
  styleUrls: ['./schedule-match.css'],
  imports: [
    NgIf,
    NgFor,
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ]
})
export class ScheduleMatch implements OnInit, OnDestroy {
  scheduleForm: FormGroup;
  userTeams: ITeam[] = [];
  availablePlaces: PlaceModel[] = [];
  successMessage: string | null = null;
  errorMessage: string | null = null;
  currentUser: any;
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private matchService: Match,
    private teamService: Team,
    private placeService: Place,
    private router: Router,
    private authService: Auth,
    private fb: FormBuilder
  ) {
    this.scheduleForm = this.fb.group({
      placeId: ['', [Validators.required]],
      teamId: ['', [Validators.required]],
      matchDate: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required]],
      minParticipants: [6, [Validators.required, Validators.min(1)]],
      maxParticipants: [22, [Validators.required, Validators.min(1)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUserTeams();
    this.loadPlaces();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPlaces(): void {
    this.availablePlaces = this.placeService.getAllPlaces();
  }

  loadUserTeams(): void {
    if (!this.currentUser) {
      this.errorMessage = 'User not authenticated. Please login again.';
      return;
    }

    // Load teams where user is organizer
    this.teamService.getTeamsByCreator(this.currentUser.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (teams) => {
        this.userTeams = teams;
        this.successMessage = null;
        this.errorMessage = null;
      },
      error: (err) => {
        console.error('Failed to load user teams', err);
        this.errorMessage = 'Failed to load your teams. Please try again.';
        this.successMessage = null;
      }
    });
  }

  onSubmit(): void {
    if (this.scheduleForm.invalid || !this.currentUser) {
      return;
    }

    this.isLoading = true;
    const formValue = this.scheduleForm.value;

    // Convert date to ISO string
    const matchDate = new Date(formValue.matchDate);
    const dateString = matchDate.toISOString().split('T')[0];

    const bookingData: Omit<IBookingMatch, 'id' | 'createdAt'> = {
      placeId: formValue.placeId,
      teamId: formValue.teamId,
      organizerId: this.currentUser.id,
      matchDate: dateString,
      startTime: formValue.startTime,
      endTime: formValue.endTime,
      minParticipants: formValue.minParticipants,
      maxParticipants: formValue.maxParticipants,
      description: formValue.description || undefined,
      status: 'SCHEDULED'
    };

    this.matchService.createBookingMatch(bookingData, this.currentUser.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (booking) => {
        this.successMessage = 'Match scheduled successfully!';
        this.errorMessage = null;
        this.scheduleForm.reset({
          minParticipants: 6,
          maxParticipants: 22
        });
        this.isLoading = false;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        console.error('Failed to schedule match', err);
        this.errorMessage = 'Failed to schedule match. Please try again.';
        this.successMessage = null;
        this.isLoading = false;
      }
    });
  }

  validateTimes(): void {
    const startTime = this.scheduleForm.get('startTime')?.value;
    const endTime = this.scheduleForm.get('endTime')?.value;

    if (startTime && endTime && startTime >= endTime) {
      this.scheduleForm.get('endTime')?.setErrors({ invalidTime: true });
    } else {
      this.scheduleForm.get('endTime')?.setErrors(null);
    }
  }

  validateParticipants(): void {
    const minParticipants = this.scheduleForm.get('minParticipants')?.value;
    const maxParticipants = this.scheduleForm.get('maxParticipants')?.value;

    if (minParticipants && maxParticipants && minParticipants > maxParticipants) {
      this.scheduleForm.get('maxParticipants')?.setErrors({ invalidRange: true });
    } else {
      this.scheduleForm.get('maxParticipants')?.setErrors(null);
    }
  }

  goToMatches(): void {
    this.router.navigate(['/dashboard/matches']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
