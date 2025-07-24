import { Injectable } from '@angular/core';

export type UserRole = 'PLAYER' | 'ORGANIZER' | 'ADMIN';
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private users: User[] = [
    { id: 1, username: 'admin', email: 'admin@admin.com', password: 'admin1', role: 'ADMIN' },
    { id: 2, username: 'organizer', email: 'org@org.com', password: 'organizer', role: 'ORGANIZER' },
    { id: 3, username: 'player', email: 'player@player.com', password: 'player', role: 'PLAYER' }
  ];
  private currentUserKey = 'currentUser';
  private nextId = 4;

  register(user: { username: string; email: string; password: string }): boolean {
    if (
      this.users.find(
        u => u.username === user.username || u.email === user.email
      )
    ) {
      return false; // Username or email already exists
    }
    const newUser: User = {
      id: this.nextId++,
      username: user.username,
      email: user.email,
      password: user.password,
      role: 'PLAYER'
    };
    this.users.push(newUser);
    this.setCurrentUser(newUser);
    return true;
  }

  login(identifier: string, password: string): boolean {
    const user = this.users.find(
      u => (u.username === identifier || u.email === identifier) && u.password === password
    );
    if (user) {
      this.setCurrentUser(user);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem(this.currentUserKey);
  }

  getCurrentUser(): User | null {
    const userJson = localStorage.getItem(this.currentUserKey);
    return userJson ? JSON.parse(userJson) : null;
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
  }
}
