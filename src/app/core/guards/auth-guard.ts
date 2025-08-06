import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  console.log('authGuard called for URL:', state.url);

  if (auth.getCurrentUser()) {
    return true;
  } else {
    // Store the attempted URL for redirecting after login
    console.log('User not authenticated, storing return URL:', state.url);
    sessionStorage.setItem('returnUrl', state.url);
    return router.createUrlTree(['/login']);
  }
};
