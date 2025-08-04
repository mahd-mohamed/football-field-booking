import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-features-section',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './features-section.html',
  styleUrl: './features-section.css',
})
export class FeaturesSection {
  features = [
    {
      title: 'Book Fields',
      description: 'Browse and reserve football fields instantly near you.',
      icon: '/field icon.png',
    },
    {
      title: 'Manage Teams',
      description: 'Create your team, add members, and manage roles easily.',
      icon: '/team management.jpg',
    },
    {
      title: 'Schedule Matches',
      description: 'Challenge other teams and agree on match times smoothly.',
      icon: '/match-schedule.webp',
    },
    {
      title: 'Real-Time Alerts',
      description: 'Stay updated with notifications on match status and invites.',
      icon: '/notification bell icon.png',
    },
  ];
}
