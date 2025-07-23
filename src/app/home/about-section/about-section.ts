import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-about-section',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './about-section.html',
  styleUrl: './about-section.css',
})
export class AboutSection {}
