import { Injectable } from '@angular/core';
import { Observable, of, catchError, map, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

export type TeamMemberRole = 'MEMBER' | 'ORGANIZER';
export type TeamMemberStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ITeamMember {
  id: string;
  teamId: string;
  userId: string;
  username: string;
  email: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  invitedBy?: string; // FK to User(id)
  createdAt: string;
  respondedAt?: string;
}

export interface ITeam {
  id: string;
  name: string;
  description?: string;
  createdBy: string; // FK to User(id)
  createdByUsername: string;
  createdAt: string;
  updatedAt?: string;
  members?: any[]; // Add members property to handle team members from backend
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private apiUrl = 'http://localhost:8080/api/teams'; // Update with your Spring backend URL

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Fetches all teams without pagination
   */
  getAllTeams(): Observable<ITeam[]> {
    const url = `${this.apiUrl}/all`;
    console.log('TeamService: Fetching all teams from:', url);
    
    return this.http.get<ITeam[]>(url).pipe(
      tap(teams => {
        console.log('TeamService: Received teams from server:', teams);
        console.log('TeamService: Number of teams received:', teams?.length || 0);
      }),
      catchError(error => {
        console.error('TeamService: Error loading all teams:', error);
        return of([]);
      })
    );
  }


  getPaginatedTeams(page: number = 0, size: number = 10): Observable<ITeam[]> {
    const url = `${this.apiUrl}/all-filtered?page=${page}&size=${size}`;
    console.log('TeamService: Making request to:', url);

    interface PaginatedResponse {
      content: ITeam[];
      totalElements: number;
      totalPages: number;
      // Add other pagination properties if needed
    }

    return this.http.get<PaginatedResponse>(url).pipe(
      tap(response => {
        console.log('TeamService: Raw response from server:', response);
        console.log('TeamService: Response content type:', typeof response.content);
        console.log('TeamService: Response content is array?', Array.isArray(response.content));
        console.log('TeamService: Response content length:', response.content?.length);
      }),
      map(response => {
        if (!response || !response.content) {
          console.warn('TeamService: No content in response');
          return [];
        }

        // Ensure we're returning a proper array
        const teams = Array.isArray(response.content) ? response.content : [];
        console.log('TeamService: Returning teams:', teams);
        return teams;
      }),
      catchError(error => {
        console.error('TeamService: Error loading teams:', error);
        return of([]);
      })
    );
  }

  // Done
  getTeamsByCreator(): Observable<ITeam[]> {
    return this.http.get<ITeam[]>(`${this.apiUrl}/my-teams`).pipe(
      map(response => {
        console.log('Teams fetched from backend:', response);
        return response || [];
      }),
      catchError(error => {
        console.error('Error fetching teams from backend:', error);
        return of([]);
      })
    );
  }

  // Done
  getTeamById(id: string): Observable<ITeam | null> {
    const url = `${this.apiUrl}/${id}`;
    console.log('TeamService: Fetching team by ID from:', url);

    return this.http.get<ITeam>(url).pipe(
      map(team => {
        console.log('TeamService: Successfully fetched team:', team);
        return team;
      }),
      catchError(error => {
        console.error('TeamService: Error fetching team by ID:', error);
        return of(null);
      })
    );
  }


  // Done
  createTeam(teamData: { name: string; description?: string }): Observable<ITeam> {
    const teamRequest = {
      name: teamData.name,
      description: teamData.description || ''
    };

    return this.http.post<ITeam>(this.apiUrl, teamRequest).pipe(
      catchError(error => {
        console.error('Error creating team:', error);
        throw new Error(error.error?.message || 'Failed to create team. Please try again.');
      })
    );
  }

  updateTeam(teamId: string, teamData: { name: string; description?: string }): Observable<ITeam> {
    if (!teamId) {
      return throwError(() => new Error('Team ID is required'));
    }

    const teamRequest = {
      name: teamData.name,
      description: teamData.description || ''
    };

    const url = `${this.apiUrl}/${teamId}`;
    console.log('TeamService: Updating team at:', url, 'with data:', teamRequest);

    return this.http.patch<ITeam>(url, teamRequest).pipe(
      tap(response => {
        console.log('TeamService: Successfully updated team:', response);
      }),
      catchError(error => {
        console.error('TeamService: Error updating team:', error);
        throw new Error(error.error?.message || 'Failed to update team. Please try again.');
      })
    );
  }

  deleteTeam(teamId: string): Observable<void> {
    const url = `${this.apiUrl}/${teamId}`;
    return this.http.delete<void>(url).pipe(
      catchError(error => {
        console.error('Error deleting team:', error);
        throw new Error(error.error?.message || 'Failed to delete team. Please try again.');
      })
    );
  }

  // Done (Need Optimization)
  getTeamMembers(teamId: string): Observable<ITeamMember[]> {
    console.log('TeamService: Fetching team members for teamId:', teamId);

    return this.getTeamById(teamId).pipe(
      map(team => {
        if (!team) {
          console.warn('TeamService: Team not found for ID:', teamId);
          return [];
        }

        console.log('TeamService: Team found, extracting members:', team);

        // Extract members array from team object
        const members = team.members || [];
        console.log('TeamService: Raw members from team:', members);

        // Map the members to match ITeamMember interface structure
        const teamMembers: ITeamMember[] = members.map((member: any) => ({
          id: member.id || `${member.userId}-${teamId}`, // Generate ID if not present
          teamId: member.teamId || teamId,
          userId: member.userId,
          username: member.userName || member.username, // Handle both possible field names
          email: member.email || '', // Default empty if not present
          role: member.role as TeamMemberRole,
          status: member.status as TeamMemberStatus,
          invitedBy: member.invitedBy,
          createdAt: member.createdAt || new Date().toISOString(),
          respondedAt: member.respondedAt
        }));

        console.log('TeamService: Mapped team members:', teamMembers);
        return teamMembers;
      }),
      catchError(error => {
        console.error('TeamService: Error fetching team members via getTeamById:', error);
        return of([]);
      })
    );
  }

  // Done
  getUserTeams(): Observable<ITeam[]> {
    const url = `${this.apiUrl}/my-teams`;
    console.log('TeamService: Making request to:', url);

    return this.http.get<{content: ITeam[]}>(url).pipe(
      map(response => {
        console.log('TeamService: Received response:', response);
        // Extract the teams array from the content property
        if (response) {
          console.log('TeamService: No content in response');
          return response.content;
        }
        else {
          console.log('TeamService: Response is null or undefined');
          return [];
        }
      }),
      catchError(error => {
        console.error('TeamService: Error loading user teams from backend:', error);
        console.error('TeamService: Request URL was:', url);
        console.error('TeamService: Error status:', error.status);
        console.error('TeamService: Error message:', error.message);
        return of([]);
      })
    );
  }

  getOtherTeams(): Observable<ITeam[]> {
    return this.http.get<{content: ITeam[]}>(`${this.apiUrl}/other-teams`).pipe(
      map(response => {
        if (response) {
          console.log('TeamService: No content in response');
          return response.content;
        }
        else {
          console.log('TeamService: Response is null or undefined');
          return [];
        }
      }),
      catchError(error => {
        console.error('Error fetching other teams from backend:', error);
        return of([]);
      })
    );
  }

  isUserTeamOrganizer(teamId: string): Observable<boolean> {
    console.log('TeamService: Checking if user is team organizer for team:', teamId);
    const url = `${this.apiUrl}/isOrganizer/${teamId}`;
    return this.http.get<boolean>(url).pipe(
      catchError(error => {
        console.error('TeamService: Error checking if user is team organizer:', error);
        return of(false);
      })
    );
  }


}
