import {  SidebarComponent } from './../../../shared/sidebar/sidebar';
import { RouterOutlet } from '@angular/router';
import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';



@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css'
})
export class DashboardLayout {
  sidebarOpen = false;

  constructor() {
    this.sidebarOpen = !this.isMobile();
  }

  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (!this.isMobile()) {
      this.sidebarOpen = true;
    } else {
      this.sidebarOpen = false;
    }
  }
}
