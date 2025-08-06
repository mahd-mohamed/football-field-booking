import { Injectable } from '@angular/core';
import { Observable, of, catchError, map, throwError, tap } from 'rxjs';
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
  createdAt: string;
  updatedAt?: string;
  members?: any[]; // Add members property to handle team members from backend
}

export interface IResponseToJoinRequest {
  id: string;
    userId: string;
    userName: string;
    email: string;
    role: TeamMemberRole;
    status: TeamMemberStatus;
    teamId: string;
}

export interface ITeamMemberUpdateRequest {
  id: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
}


@Injectable({
  providedIn: 'root'
})
export class TeamMemberService {
  private apiUrl = 'http://localhost:8080/api/team-members'; // Update with your Spring backend URL

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}


  /**
   * Invite a user to a team by email
   * @param teamId The ID of the team to invite the user to
   * @param email The email of the user to invite
   * @param role The role to assign to the user in the team
   * @returns Observable with the invitation result
   */
  inviteUserByEmail(teamId: string, email: string): Observable<ITeamMember> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    const inviteData = {
      email,
      invitedBy: currentUser.id
    };

    console.log(`Sending invitation to ${email} for team ${teamId}`);

    return this.http.post<ITeamMember>(`${this.apiUrl}/invite/${teamId}`, inviteData).pipe(
      catchError(error => {
        console.error('Error inviting user by email:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to send invitation'));
      })
    );
  }

  removeTeamMember(teamMemberId: string): Observable<void> {
    if (!teamMemberId) {
      return throwError(() => new Error('Team member ID is required'));
    }
    console.log(`TeamService: Removing team member with ID: ${teamMemberId}`);

    return this.http.delete<void>(`${this.apiUrl}/${teamMemberId}`).pipe(
      catchError(error => {
        console.error('Error removing team member:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to remove team member'));
      })
    );
  }

  // Team Member Management
  // askToJoinTeam(teamId: string): Observable<ITeamMember> {
  //   return this.requestToJoinTeam(teamId);
  // }

  /**
   * Request to join a team
   * @param teamId The ID of the team to join
   * @returns Observable with the join request response
   */
  requestToJoinTeam(teamId: string): Observable<ITeamMember> {
    if (!teamId) {
      return throwError(() => new Error('Team ID is required'));
    }

    console.log(`Sending join request for team ${teamId}`);

    return this.http.post<ITeamMember>(
      `${this.apiUrl}/join-request/${teamId}`,
      {}
    ).pipe(
      catchError(error => {
        console.error('Error sending join request:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to send join request'));
      })
    );
  }

  /**
   * Get pending join requests for a team
   * @param teamId The ID of the team
   * @returns Observable with the list of pending join requests
   */
  getPendingJoinRequests(teamId: string): Observable<ITeamMember[]> {
    if (!teamId) {
      return throwError(() => new Error('Team ID is required'));
    }

    console.log(`Fetching pending join requests for team ${teamId}`);

    return this.http.get<ITeamMember[]>(`${this.apiUrl}/join-requests/${teamId}`).pipe(
      catchError(error => {
        console.error('Error fetching pending join requests:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to fetch join requests'));
      })
    );
  }

  /**
   * Respond to a join request
   * @param teamMemberId The ID of the team member request
   * @param status The new status (APPROVED/REJECTED)
   * @param organizerId The ID of the organizer responding to the request
   * @returns Observable with void (no content response)
   */
  respondToJoinRequest(teamMemberId: string, status: TeamMemberStatus, organizerId: string): Observable<void> {
    if (!teamMemberId || !status || !organizerId) {
      return throwError(() => new Error('Team member ID, status, and organizer ID are required'));
    }

    console.log(`Updating join request ${teamMemberId} to status ${status} by organizer ${organizerId}`);

    return this.http.get<void>(
      `${this.apiUrl}/join-request/respond/${teamMemberId}/${organizerId}?status=${status}`
    ).pipe(
      tap(() => {
        console.log(`✅ Successfully responded to join request ${teamMemberId} with status ${status}`);
      }),
      catchError(error => {
        console.error('Error responding to join request:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to respond to join request'));
      })
    );
  }

  /**
   * Check if a user is an organizer of a team
   * @param userId The ID of the user to check
   * @param teamId The ID of the team
   * @returns Observable with boolean indicating if the user is an organizer
   */
  // isOrganizer(userId: string, teamId: string): Observable<boolean> {
  //   if (!userId || !teamId) {
  //     return throwError(() => new Error('User ID and Team ID are required'));
  //   }

  //   return this.http.get<{ isOrganizer: boolean }>(
  //     `${this.apiUrl}/is-organizer?userId=${userId}&teamId=${teamId}`
  //   ).pipe(
  //     map(response => response.isOrganizer),
  //     catchError(error => {
  //       console.error('Error checking organizer status:', error);
  //       return throwError(() => new Error(error.error?.message || 'Failed to check organizer status'));
  //     })
  //   );
  // }



  /**
   * Respond to a join request (alternative endpoint)
   * @param teamMemberId The ID of the team member request
   * @param status The status to set for the join request (APPROVED/REJECTED)
  //  * @returns Observable with void (no content response)
  //  */
  // respondToJoinRequestByPath(teamMemberId: string, status: TeamMemberStatus): Observable<void> {
  //   if (!teamMemberId || !status) {
  //     return throwError(() => new Error('Team member ID and status are required'));
  //   }

  //   console.log(`Responding to join request ${teamMemberId} with status ${status}`);

  //   return this.http.get<void>(
  //     `${this.apiUrl}/join-request/respond/${teamMemberId}?status=${status}`,
  //     {}
  //   ).pipe(
  //     tap(() => {
  //       console.log(`✅ Successfully responded to join request ${teamMemberId} with status ${status}`);
  //     }),
  //     catchError(error => {
  //       console.error('Error responding to join request:', error);
  //       return throwError(() => new Error(error.error?.message || 'Failed to respond to join request'));
  //     })
  //   );
  // }

  /**
   * Respond to a team member invitation
   * @param teamMemberId The ID of the team member invitation
   * @param status The status to set for the invitation (APPROVED/REJECTED)
   * @returns Observable with the invitation response
   */
  respondToInvitation(teamMemberId: string, status: TeamMemberStatus): Observable<void> {
    if (!teamMemberId || !status) {
      return throwError(() => new Error('Team member ID and status are required'));
    }

    console.log(`Responding to team invitation ${teamMemberId} with status ${status}`);

    return this.http.get<any>(
      `${this.apiUrl}/respond/${teamMemberId}?status=${status}`,
      {}
    ).pipe(
      tap((response) => {
        console.log('✅ Team invitation response finished successfully:', response);
      }),
      catchError(error => {
        console.error('Error responding to team invitation:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to respond to team invitation'));
      })
    );
  }

  /**
   * Update a team member (role and status)
   * @param updateRequest The team member update request containing id, role, and status
   * @returns Observable with the updated team member response
   */
  updateTeamMember(updateRequest: ITeamMemberUpdateRequest): Observable<ITeamMember> {
    if (!updateRequest.id || !updateRequest.role || !updateRequest.status) {
      return throwError(() => new Error('Team member ID, role, and status are required'));
    }

    console.log(`Updating team member ${updateRequest.id} with role ${updateRequest.role} and status ${updateRequest.status}`);

    return this.http.put<ITeamMember>(this.apiUrl, updateRequest).pipe(
      tap((response) => {
        console.log('✅ Team member updated successfully:', response);
      }),
      catchError(error => {
        console.error('Error updating team member:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to update team member'));
      })
    );
  }


}
