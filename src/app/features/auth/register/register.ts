import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, MatIconModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  username = '';
  email = '';
  password = '';
  errorMessage = '';
  showPassword = false;

  constructor(private auth: Auth, private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (!this.username || !this.email || !this.password) {
      this.errorMessage = 'All fields are required.';
      return;
    }
    if (!this.validateEmail(this.email)) {
      this.errorMessage = 'Invalid email format.';
      return;
    }
    const success = this.auth.register({
      username: this.username,
      email: this.email,
      password: this.password
    });
    if (!success) {
      this.errorMessage = 'Username or email already exists.';
    } else {
      this.errorMessage = '';
      this.router.navigate(['/login']);
    }
  }

  validateEmail(email: string): boolean {
    // Simple email regex
    return /^\S+@\S+\.\S+$/.test(email);
  }
}
