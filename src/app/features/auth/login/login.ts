import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, MatIconModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  identifier = '';
  password = '';
  errorMessage = '';
  showPassword = false;

  constructor(private auth: Auth, private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (!this.identifier || !this.password) {
      this.errorMessage = 'All fields are required.';
      return;
    }
    const success = this.auth.login(this.identifier, this.password);
    if (!success) {
      this.errorMessage = 'Invalid username/email or password.';
    } else {
      this.errorMessage = '';
      this.router.navigate(['/dashboard']);
    }
  }
}
