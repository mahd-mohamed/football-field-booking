import { Injectable } from '@angular/core';
import { UserService as UserService } from './user.service';

import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { Observable, throwError, of } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';

import { IUser, UserRole, UserStatus, IRegisterUser, IRegisterResponseUser } from '../models/iuser.model';
import { ErrorUtils } from '../utils/error-utils';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // private apiUrl = '/api/auth';
  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(
    private router: Router, 
    private http: HttpClient, 
    private userService: UserService,
    private errorUtils: ErrorUtils
  ) {
  }

  /**
   * Handles user registration by sending user details to the backend.
   * @param username The user's chosen username.
   * @param email The user's email.
   * @param password The user's password.
   * @returns An Observable that emits true on successful registration, or throws an error.
   */
  // Create a new user
  register(user: IRegisterUser): Observable<IRegisterResponseUser> {
    console.log('AuthService: Attempting registration for:', user.email);

    return this.http.post<IRegisterResponseUser>(`${this.apiUrl}/register`, user)
      .pipe(
        tap((response: IRegisterResponseUser) => {
          if (response && response.token && response.role) {
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('isLoggedIn', 'true');
              sessionStorage.setItem('jwt_token', response.token);
              sessionStorage.setItem('currentUserRole', response.role);
            }
            console.log('AuthService: Registration successful with backend. Role:', response.role);
            this.errorUtils.showSuccess('Registration successful! Welcome to Football Places Booking System.');
          } else {
            throw new Error('Registration failed: Invalid response from server.');
          }
        }),
        switchMap((response: IRegisterResponseUser) => {
          // Fetch complete user profile after successful registration
          if (response.id) {
            return this.userService.getUserById(response.id).pipe(
              tap((userProfile: IUser) => {
                // Store complete user object
                const userObject: IUser = {
                  id: userProfile.id,
                  username: userProfile.username,
                  email: userProfile.email,
                  role: userProfile.role as UserRole,
                  status: userProfile.status as UserStatus,
                  createdAt: userProfile.createdAt
                };

                if (typeof sessionStorage !== 'undefined') {
                  sessionStorage.setItem('currentUser', JSON.stringify(userObject));
                }

                console.log('AuthService: IUser stored successfully');
              }),
              map(() => response) // Return the original response
            );
          } else {

            console.log('AuthService: No user ID found in registration response. Unable to fetch user profile.');
            return of(response); // Return the response without fetching user profile
          }
        }),
        catchError(this.errorUtils.handleError<IRegisterResponseUser>())
      );
  }

  /**
//    * Handles user login by sending credentials to the backend.
//    * On success, stores login state, JWT token, and user role in sessionStorage.
//    * @param email The user's email.
//    * @param password The user's password.
//    * @returns An Observable that emits true on successful login, or throws an error.
//    */
  // login(user: ILoginUser): Observable<IRegisterResponseUser> {
  login(email: string, password: string): Observable<IRegisterResponseUser> {
    console.log('AuthService: Attempting login for:', email);

    return this.http.post<IRegisterResponseUser>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response: IRegisterResponseUser) => {
        if (response && response.token && response.role) {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('jwt_token', response.token);
            sessionStorage.setItem('currentUserRole', response.role);
          }
          console.log('AuthService: Login successful with backend. Role:', response.role);
          this.errorUtils.showSuccess('Login successful! Welcome back.');
        } else {
          throw new Error('Login failed: Invalid response from server.');
        }
      }),
      switchMap((response: IRegisterResponseUser) => {
        // Fetch complete user profile after successful login
        if (response.id) {
          return this.userService.getUserById(response.id).pipe(
            tap((userProfile: IUser) => {
              // Store complete user object
              const userObject: IUser = {
                id: userProfile.id,
                username: userProfile.username,
                email: userProfile.email,
                role: userProfile.role as UserRole,
                status: userProfile.status as UserStatus,
                createdAt: userProfile.createdAt
              };

              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('currentUser', JSON.stringify(userObject));
              }

              console.log('AuthService: User profile stored successfully');
            }),
            map(() => response) // Return the original response
          );
        } else {
          console.log('AuthService: No user ID found in login response. Unable to fetch user profile.');
          return of(response);
        }
      }),
      catchError(this.errorUtils.handleError<IRegisterResponseUser>())
    );
  }

  /**
   * Logs out the user by clearing local storage and redirecting to the login page.
   */
  logout(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('jwt_token'); // Clear the JWT token
      sessionStorage.removeItem('currentUserRole'); // Clear the user's role
      sessionStorage.removeItem('currentUser'); // Clear the current user
    }
    console.log('AuthService: Logged out. Redirecting to login.');
    this.errorUtils.showInfo('You have been logged out successfully.');
    this.router.navigate(['/login']); // Redirect to the login page
  }

  getCurrentUser(): IUser | null {
    const userString = sessionStorage.getItem('currentUser');
    if (userString) {
      return JSON.parse(userString);
    }
    return null;
  }

  setCurrentUser(user: IUser | null): void {
    if (user != null && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('currentUser', JSON.stringify(user));
    }
  }

  /**
   * Checks if the user is currently logged in.
   * @returns True if logged in, false otherwise.
   */
  isLoggedIn(): boolean {
    return sessionStorage.getItem('isLoggedIn') === 'true';
  }

  /**
   * Gets the current user's role.
   * @returns The user's role string, or null if not logged in.
   */
  getUserRole(): string | null {
    return sessionStorage.getItem('currentUserRole');
  }

  /**
   * Checks if the current user has the 'organizer' role.
   * @returns True if the user is logged in and has the 'organizer' role, false otherwise.
   */
  isOrganizer(): boolean {
    return sessionStorage.getItem('currentUserRole') === 'organizer';
  }

  /**
   * Redirects to the stored return URL after successful login, or to dashboard if no return URL.
   */
  redirectAfterLogin(): void {
    const returnUrl = sessionStorage.getItem('returnUrl');
    if (returnUrl) {
      console.log('AuthService: Redirecting to stored return URL:', returnUrl);
      sessionStorage.removeItem('returnUrl'); // Clean up
      this.router.navigateByUrl(returnUrl);
    } else {
      console.log('AuthService: No return URL found, redirecting to dashboard');
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Gets the stored return URL without removing it.
   * @returns The stored return URL or null if none exists.
   */
  getReturnUrl(): string | null {
    return sessionStorage.getItem('returnUrl');
  }
}
