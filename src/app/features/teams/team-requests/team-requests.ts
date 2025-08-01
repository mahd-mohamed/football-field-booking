import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Team, ITeamMember, TeamMemberStatus } from '../../../core/services/team';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';

interface PendingInvitation {
  id: string;
  teamId: string;
  teamName: string;
  role: string;
  invitedBy: string;
  createdAt: string;
}

interface JoinRequest {
  id: string;
  teamId: string;
  teamName: string;
  userId: number;
  username: string;
  email: string;
  createdAt: string;
}

@Component({
  selector: 'app-team-requests',
  templateUrl: './team-requests.html',
  styleUrls: ['./team-requests.css'],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class TeamRequests implements OnInit, OnDestroy {
  pendingInvitations: PendingInvitation[] = [];
  joinRequests: JoinRequest[] = [];
  loading: boolean = true;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private teamService: Team,
    private authService: Auth,
    private notificationService: Notification,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRequests(): void {
    const currentUser = this.authService.getCurrentUser();
    console.log('Current user in loadRequests:', currentUser);
    
    if (!currentUser) {
      this.errorMessage = 'User not authenticated';
      this.loading = false;
      return;
    }

    console.log('Loading requests for user:', currentUser.username, 'ID:', currentUser.id);

    // Debug: Check localStorage data
    const teamsData = localStorage.getItem('teams');
    const membersData = localStorage.getItem('teamMembers');
    console.log('Teams in localStorage:', teamsData ? JSON.parse(teamsData) : 'No teams');
    console.log('Team members in localStorage:', membersData ? JSON.parse(membersData) : 'No members');

    // Load pending invitations for current user
    this.loadPendingInvitations(currentUser.id);
    
    // Load join requests for teams where user is organizer
    this.loadJoinRequests(currentUser.id);
  }

  loadPendingInvitations(userId: number): void {
    console.log('Loading pending invitations for user ID:', userId);
    
    this.teamService.getAllTeamMembers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (allMembers) => {
        console.log('All team members for invitations:', allMembers);
        const userInvitations = allMembers.filter(member => 
          member.userId === userId && member.status === 'PENDING'
        );
        console.log('User invitations:', userInvitations);

        // Get team details for each invitation
        const invitationPromises = userInvitations.map(invitation => 
          this.teamService.getTeamById(invitation.teamId).toPromise()
        );

        Promise.all(invitationPromises).then(teams => {
          console.log('Teams for invitations:', teams);
          this.pendingInvitations = userInvitations.map(invitation => {
            const team = teams.find(t => t?.id === invitation.teamId);
            return {
              id: invitation.id,
              teamId: invitation.teamId,
              teamName: team?.name || 'Unknown Team',
              role: invitation.role,
              invitedBy: invitation.invitedBy?.toString() || 'Unknown',
              createdAt: invitation.createdAt
            };
          });
          console.log('Final pending invitations:', this.pendingInvitations);
        });
      },
      error: (err) => {
        console.error('Failed to load pending invitations', err);
      }
    });
  }

  loadJoinRequests(userId: number): void {
    console.log('Loading join requests for user ID:', userId);
    
    // Get teams where current user is organizer
    this.teamService.getTeamsByCreator(userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (userTeams) => {
        console.log('User teams (as creator):', userTeams);
        const teamIds = userTeams.map(team => team.id);
        console.log('Team IDs where user is creator:', teamIds);
        
        // Get all team members for these teams
        this.teamService.getAllTeamMembers().pipe(takeUntil(this.destroy$)).subscribe({
          next: (allMembers) => {
            console.log('All team members:', allMembers);
            const joinRequests = allMembers.filter(member => 
              teamIds.includes(member.teamId) && 
              member.status === 'PENDING' && 
              member.userId !== userId
            );
            console.log('Filtered join requests:', joinRequests);

            this.joinRequests = joinRequests.map(request => ({
              id: request.id,
              teamId: request.teamId,
              teamName: userTeams.find(team => team.id === request.teamId)?.name || 'Unknown Team',
              userId: request.userId,
              username: request.username,
              email: request.email,
              createdAt: request.createdAt
            }));
            
            console.log('Final join requests:', this.joinRequests);
            this.loading = false;
          },
          error: (err) => {
            console.error('Failed to load join requests', err);
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Failed to load user teams', err);
        this.loading = false;
      }
    });
  }

  respondToInvitation(invitationId: string, status: 'APPROVED' | 'REJECTED'): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    // Find the invitation
    const invitation = this.pendingInvitations.find(inv => inv.id === invitationId);
    if (!invitation) return;

    console.log('Responding to invitation:', invitation);
    console.log('New status:', status);

    // Update team member status
    this.teamService.getAllTeamMembers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (allMembers) => {
        const member = allMembers.find(m => m.id === invitationId);
        if (member) {
          console.log('Found member to update:', member);
          member.status = status;
          member.respondedAt = new Date().toISOString();
          
          // Update in localStorage
          localStorage.setItem('teamMembers', JSON.stringify(allMembers));
          console.log('Updated team members in localStorage');

          // Create notification for team organizer
          this.notificationService.createApprovalNotification(
            member.invitedBy || 0,
            'team invitation',
            invitation.teamName
          ).subscribe();

          this.successMessage = status === 'APPROVED' 
            ? `Successfully joined ${invitation.teamName}!` 
            : `Declined invitation to ${invitation.teamName}`;
          
          // Remove from pending invitations
          this.pendingInvitations = this.pendingInvitations.filter(inv => inv.id !== invitationId);
          
          setTimeout(() => this.successMessage = null, 3000);
        } else {
          console.error('Member not found for invitation ID:', invitationId);
          this.errorMessage = 'Invitation not found';
        }
      },
      error: (err) => {
        console.error('Failed to respond to invitation', err);
        this.errorMessage = 'Failed to respond to invitation';
      }
    });
  }

  respondToJoinRequest(requestId: string, status: 'APPROVED' | 'REJECTED'): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    // Find the request
    const request = this.joinRequests.find(req => req.id === requestId);
    if (!request) return;

    console.log('Responding to join request:', request);
    console.log('New status:', status);

    // Update team member status
    this.teamService.getAllTeamMembers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (allMembers) => {
        const member = allMembers.find(m => m.id === requestId);
        if (member) {
          console.log('Found member to update:', member);
          member.status = status;
          member.respondedAt = new Date().toISOString();
          
          // Update in localStorage
          localStorage.setItem('teamMembers', JSON.stringify(allMembers));
          console.log('Updated team members in localStorage');

          // Create notification for the user who requested to join
          this.notificationService.createApprovalNotification(
            member.userId,
            'team join request',
            request.teamName
          ).subscribe();

          this.successMessage = status === 'APPROVED' 
            ? `Approved ${request.username}'s request to join ${request.teamName}!` 
            : `Rejected ${request.username}'s request to join ${request.teamName}`;
          
          // Remove from join requests
          this.joinRequests = this.joinRequests.filter(req => req.id !== requestId);
          
          setTimeout(() => this.successMessage = null, 3000);
        } else {
          console.error('Member not found for request ID:', requestId);
          this.errorMessage = 'Request not found';
        }
      },
      error: (err) => {
        console.error('Failed to respond to join request', err);
        this.errorMessage = 'Failed to respond to join request';
      }
    });
  }

  // Method to manually add a join request for testing
  addTestJoinRequest(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    // Get the first team created by current user
    this.teamService.getTeamsByCreator(currentUser.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (teams) => {
        if (teams.length > 0) {
          const team = teams[0];
          console.log('Adding test join request for team:', team);
          
          // Create a test join request
          const testRequest = {
            id: Date.now().toString(),
            teamId: team.id,
            userId: 999, // Test user ID
            username: 'testuser',
            email: 'testuser@test.com',
            role: 'MEMBER',
            status: 'PENDING',
            createdAt: new Date().toISOString()
          };

          // Add to localStorage
          const membersString = localStorage.getItem('teamMembers');
          const members = membersString ? JSON.parse(membersString) : [];
          members.push(testRequest);
          localStorage.setItem('teamMembers', JSON.stringify(members));
          
          console.log('Test join request added:', testRequest);
          console.log('Updated team members:', members);
          
          // Reload requests
          this.loadRequests();
        }
      }
    });
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  }
}