import { Injectable } from '@angular/core';
import { Team } from './team';

export type UserRole = 'USER' | 'ORGANIZER' | 'ADMIN';
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private users: User[] = [
    { id: 1, username: 'admin', email: 'admin@admin.com', password: 'admin1', role: 'ADMIN', status: 'ACTIVE' },
    { id: 2, username: 'organizer', email: 'org@org.com', password: 'organizer', role: 'ORGANIZER', status: 'ACTIVE' },
    { id: 3, username: 'player', email: 'player@player.com', password: 'player', role: 'USER', status: 'ACTIVE' }
  ];
  private currentUserKey = 'currentUser';
  private usersKey = 'users';
  private nextId = 4;

  constructor(private teamService: Team) {
    this.initializeUsers();
  }

  private initializeUsers(): void {
    const storedUsers = localStorage.getItem(this.usersKey);
    if (!storedUsers) {
      // Initialize with default users if no users exist in localStorage
      localStorage.setItem(this.usersKey, JSON.stringify(this.users));
    } else {
      // Load users from localStorage
      this.users = JSON.parse(storedUsers);
      // Update nextId based on existing users
      if (this.users.length > 0) {
        this.nextId = Math.max(...this.users.map(u => u.id)) + 1;
      }
    }
  }

  private getUsers(): User[] {
    const storedUsers = localStorage.getItem(this.usersKey);
    return storedUsers ? JSON.parse(storedUsers) : [];
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  register(user: { username: string; email: string; password: string }): boolean {
    const users = this.getUsers();
    if (
      users.find(
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
      role: 'USER',
      status: 'ACTIVE'
    };
    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser);
    return true;
  }

  login(identifier: string, password: string): boolean {
    const users = this.getUsers();
    const user = users.find(
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

  isOrganizer(): boolean {
    const currentUser = this.getCurrentUser();
    return currentUser?.role === 'ORGANIZER' || currentUser?.role === 'ADMIN';
  }

  // Get effective role based on user's base role and team ownership
  getEffectiveRole(): string {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return 'USER';

    if (currentUser.role === 'ADMIN') return 'ADMIN';
    if (currentUser.role === 'ORGANIZER') return 'ORGANIZER';

    // For players, check if they are organizers in any team
    // This is a simplified check - in a real app, you'd want to cache this
    return 'USER'; // Default to USER, will be updated by components that need it
  }
}
