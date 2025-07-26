import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface ITeam {
  id: string;
  name: string;
  description?: string;
  organizerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Team {
  
  getTeams(): Observable<ITeam[]> {
    try {
      const teamsString = localStorage.getItem('teams');
      const teams = teamsString ? JSON.parse(teamsString) : [];
      return of(teams);
    } catch (error) {
      console.error('Error loading teams from localStorage:', error);
      return of([]);
    }
  }

  getTeamById(id: string): Observable<ITeam | null> {
    try {
      const teamsString = localStorage.getItem('teams');
      if (teamsString) {
        const teams: ITeam[] = JSON.parse(teamsString);
        const team = teams.find(t => t.id === id);
        return of(team || null);
      }
      return of(null);
    } catch (error) {
      console.error('Error loading team by ID from localStorage:', error);
      return of(null);
    }
  }

  createTeam(team: Omit<ITeam, 'id'>): Observable<ITeam> {
    try {
      const newTeam: ITeam = {
        ...team,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const teamsString = localStorage.getItem('teams');
      const teams: ITeam[] = teamsString ? JSON.parse(teamsString) : [];
      teams.push(newTeam);
      localStorage.setItem('teams', JSON.stringify(teams));

      return of(newTeam);
    } catch (error) {
      console.error('Error creating team:', error);
      throw new Error('Failed to create team');
    }
  }

  updateTeam(team: ITeam): Observable<ITeam> {
    try {
      const teamsString = localStorage.getItem('teams');
      if (teamsString) {
        const teams: ITeam[] = JSON.parse(teamsString);
        const index = teams.findIndex(t => t.id === team.id);
        if (index !== -1) {
          const updatedTeam: ITeam = {
            ...team,
            updatedAt: new Date().toISOString()
          };
          teams[index] = updatedTeam;
          localStorage.setItem('teams', JSON.stringify(teams));
          return of(updatedTeam);
        }
      }
      throw new Error('Team not found');
    } catch (error) {
      console.error('Error updating team:', error);
      throw new Error('Failed to update team');
    }
  }

  deleteTeam(id: string): Observable<void> {
    try {
      const teamsString = localStorage.getItem('teams');
      if (teamsString) {
        const teams: ITeam[] = JSON.parse(teamsString);
        const filteredTeams = teams.filter(t => t.id !== id);
        localStorage.setItem('teams', JSON.stringify(filteredTeams));
      }
      return of(void 0);
    } catch (error) {
      console.error('Error deleting team:', error);
      throw new Error('Failed to delete team');
    }
  }
}
