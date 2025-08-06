import { Injectable } from '@angular/core';
import { IErrorDetails, ErrorCategory, ErrorSeverity } from '../models/ierror-code.model';

@Injectable({
  providedIn: 'root'
})
export class ErrorMappingService {

  private errorMap = new Map<number, IErrorDetails>();

  constructor() {
    this.initializeErrorMap();
  }

  private initializeErrorMap(): void {
    // User Errors (200-299)
    this.addError(200, "Please enter a valid username", ErrorCategory.USER, ErrorSeverity.MEDIUM);
    this.addError(201, "Please enter a valid email address", ErrorCategory.USER, ErrorSeverity.MEDIUM);
    this.addError(202, "This email is already registered. Please use a different email or try logging in", ErrorCategory.USER, ErrorSeverity.MEDIUM);
    this.addError(203, "Please enter a valid password", ErrorCategory.USER, ErrorSeverity.MEDIUM);
    this.addError(204, "Invalid user role selected", ErrorCategory.USER, ErrorSeverity.HIGH);
    this.addError(205, "Invalid user status", ErrorCategory.USER, ErrorSeverity.HIGH);
    this.addError(206, "User already exists with these credentials", ErrorCategory.USER, ErrorSeverity.MEDIUM);
    this.addError(207, "User not found. Please check your credentials", ErrorCategory.USER, ErrorSeverity.MEDIUM);
    this.addError(208, "Your account is inactive. Please contact support", ErrorCategory.USER, ErrorSeverity.HIGH);

    // Team Errors (300-399)
    this.addError(300, "Invalid team ID provided", ErrorCategory.TEAM, ErrorSeverity.HIGH);
    this.addError(301, "Please enter a valid team name", ErrorCategory.TEAM, ErrorSeverity.MEDIUM);
    this.addError(302, "Please provide a team description", ErrorCategory.TEAM, ErrorSeverity.LOW);
    this.addError(303, "Team not found", ErrorCategory.TEAM, ErrorSeverity.MEDIUM);
    this.addError(304, "A team with this name already exists", ErrorCategory.TEAM, ErrorSeverity.MEDIUM);
    this.addError(305, "Only team organizers can perform this action", ErrorCategory.TEAM, ErrorSeverity.HIGH);

    // Team Member Errors (400-499)
    this.addError(400, "Invalid team member role", ErrorCategory.TEAM_MEMBER, ErrorSeverity.HIGH);
    this.addError(401, "Invalid team member status", ErrorCategory.TEAM_MEMBER, ErrorSeverity.HIGH);
    this.addError(402, "You are already a member of this team", ErrorCategory.TEAM_MEMBER, ErrorSeverity.MEDIUM);
    this.addError(403, "Team member not found", ErrorCategory.TEAM_MEMBER, ErrorSeverity.MEDIUM);
    this.addError(404, "Invalid team status", ErrorCategory.TEAM_MEMBER, ErrorSeverity.HIGH);
    this.addError(405, "You already have a pending request to join this team", ErrorCategory.TEAM_MEMBER, ErrorSeverity.MEDIUM);
    this.addError(406, "Response already exists for this team member", ErrorCategory.TEAM_MEMBER, ErrorSeverity.MEDIUM);

    // Place Errors (500-599)
    this.addError(500, "Invalid place ID provided", ErrorCategory.PLACE, ErrorSeverity.HIGH);
    this.addError(501, "Please enter a valid place name", ErrorCategory.PLACE, ErrorSeverity.MEDIUM);
    this.addError(502, "Please provide a place description", ErrorCategory.PLACE, ErrorSeverity.LOW);
    this.addError(503, "Please provide a valid image URL for the place", ErrorCategory.PLACE, ErrorSeverity.LOW);
    this.addError(504, "Please provide the place location", ErrorCategory.PLACE, ErrorSeverity.MEDIUM);
    this.addError(505, "Invalid place type selected", ErrorCategory.PLACE, ErrorSeverity.MEDIUM);
    this.addError(506, "Place not found", ErrorCategory.PLACE, ErrorSeverity.MEDIUM);

    // Booking Match Errors (600-699)
    this.addError(600, "Invalid booking ID provided", ErrorCategory.BOOKING, ErrorSeverity.HIGH);
    this.addError(601, "Please select a valid start time", ErrorCategory.BOOKING, ErrorSeverity.MEDIUM);
    this.addError(602, "Please select a valid end time", ErrorCategory.BOOKING, ErrorSeverity.MEDIUM);
    this.addError(603, "Invalid match status", ErrorCategory.BOOKING, ErrorSeverity.HIGH);
    this.addError(604, "Booking not found", ErrorCategory.BOOKING, ErrorSeverity.MEDIUM);
    this.addError(605, "This time slot is already booked. Please select a different time", ErrorCategory.BOOKING, ErrorSeverity.MEDIUM);
    this.addError(606, "Only team organizers can perform this action", ErrorCategory.BOOKING, ErrorSeverity.HIGH);
    this.addError(607, "This match cannot be cancelled at this time", ErrorCategory.BOOKING, ErrorSeverity.MEDIUM);

    // Match Participant Errors (700-799)
    this.addError(700, "Invalid participant ID provided", ErrorCategory.MATCH_PARTICIPANT, ErrorSeverity.HIGH);
    this.addError(701, "Invalid participant status", ErrorCategory.MATCH_PARTICIPANT, ErrorSeverity.HIGH);
    this.addError(702, "Match participant not found", ErrorCategory.MATCH_PARTICIPANT, ErrorSeverity.MEDIUM);
    this.addError(703, "You are already a participant in this match", ErrorCategory.MATCH_PARTICIPANT, ErrorSeverity.MEDIUM);
    this.addError(704, "Please provide a valid participant email", ErrorCategory.MATCH_PARTICIPANT, ErrorSeverity.MEDIUM);
    this.addError(705, "You have already responded to this invitation", ErrorCategory.MATCH_PARTICIPANT, ErrorSeverity.MEDIUM);
    this.addError(706, "Match capacity exceeded - invitation has expired", ErrorCategory.MATCH_PARTICIPANT, ErrorSeverity.MEDIUM);

    // Request Errors (800-899)
    this.addError(800, "Invalid request type", ErrorCategory.REQUEST, ErrorSeverity.HIGH);
    this.addError(801, "Invalid request status", ErrorCategory.REQUEST, ErrorSeverity.HIGH);
    this.addError(802, "Please provide a request message", ErrorCategory.REQUEST, ErrorSeverity.MEDIUM);
    this.addError(803, "Request not found", ErrorCategory.REQUEST, ErrorSeverity.MEDIUM);

    // Generic Errors (900-999)
    this.addError(900, "No content available", ErrorCategory.GENERIC, ErrorSeverity.LOW);
    this.addError(901, "Resource not found", ErrorCategory.GENERIC, ErrorSeverity.MEDIUM);
    this.addError(902, "No data provided", ErrorCategory.GENERIC, ErrorSeverity.MEDIUM);
    this.addError(903, "Please log in to access this feature", ErrorCategory.GENERIC, ErrorSeverity.HIGH, true);
    this.addError(904, "You don't have permission to perform this action", ErrorCategory.GENERIC, ErrorSeverity.HIGH);
    this.addError(905, "An internal error occurred. Please try again later", ErrorCategory.GENERIC, ErrorSeverity.CRITICAL, false, true);
    this.addError(906, "Invalid credentials. Please check your username and password", ErrorCategory.GENERIC, ErrorSeverity.MEDIUM);
    this.addError(907, "Your session has expired. Please log in again", ErrorCategory.GENERIC, ErrorSeverity.HIGH, true);
  }

  private addError(
    code: number, 
    userFriendlyMessage: string, 
    category: ErrorCategory, 
    severity: ErrorSeverity,
    requiresAuth: boolean = false,
    canRetry: boolean = true
  ): void {
    this.errorMap.set(code, {
      code,
      message: this.getOriginalMessage(code),
      category,
      severity,
      userFriendlyMessage,
      canRetry,
      requiresAuth
    });
  }

  private getOriginalMessage(code: number): string {
    // This would contain the original backend messages
    const originalMessages: { [key: number]: string } = {
      200: "Username is either empty or null",
      201: "Email is either empty or null",
      202: "Email already exists",
      203: "Password is either empty or null",
      204: "User role is invalid",
      205: "User status is invalid",
      206: "User already exists",
      207: "User not found",
      208: "Inactive user",
      300: "Team ID is either empty or null",
      301: "Team name is either empty or null",
      302: "Team description is either empty or null",
      303: "Team not found",
      304: "Team already exists",
      305: "Must be an organizer",
      400: "Team member role is invalid",
      401: "Team member status is invalid",
      402: "User is already a team member",
      403: "Team member not found",
      404: "Team status is invalid",
      405: "User is already pending to join this team",
      406: "Team member response already exists",
      500: "Place ID is either empty or null",
      501: "Place name is either empty or null",
      502: "Place description is either empty or null",
      503: "Place image URL is either empty or null",
      504: "Place location is either empty or null",
      505: "Place type is invalid",
      506: "Place not found",
      600: "Booking match ID is either empty or null",
      601: "Booking start time is invalid",
      602: "Booking end time is invalid",
      603: "Booking match status is invalid",
      604: "Booking match not found",
      605: "The selected time slot is already booked for this place",
      606: "Only team organizers can perform this action",
      607: "Match Can not be cancelled now",
      700: "Participant ID is either empty or null",
      701: "Participant status is invalid",
      702: "Match participant not found",
      703: "User is already a participant in this match",
      704: "Participant email is either empty or null",
      705: "Participant has already responded to the invitation",
      706: "Match capacity exceeded - invitation expired",
      800: "Request type is invalid",
      801: "Request status is invalid",
      802: "Request message is either empty or null",
      803: "Request not found",
      900: "No content available",
      901: "Resource not found",
      902: "No data provided",
      903: "Unauthorized access",
      904: "Action is forbidden",
      905: "Internal server error",
      906: "Invalid credentials provided",
      907: "Token is invalid or expired"
    };
    return originalMessages[code] || "Unknown error";
  }

  getErrorDetails(code: number): IErrorDetails | null {
    return this.errorMap.get(code) || null;
  }

  getErrorDetailsByCode(code: number): IErrorDetails {
    const details = this.getErrorDetails(code);
    if (details) {
      return details;
    }
    
    // Return a default error for unknown codes
    return {
      code,
      message: "Unknown error occurred",
      category: ErrorCategory.GENERIC,
      severity: ErrorSeverity.MEDIUM,
      userFriendlyMessage: "An unexpected error occurred. Please try again.",
      canRetry: true,
      requiresAuth: false
    };
  }

  isAuthError(code: number): boolean {
    const details = this.getErrorDetails(code);
    return details?.requiresAuth || false;
  }

  canRetryError(code: number): boolean {
    const details = this.getErrorDetails(code);
    return details?.canRetry || false;
  }

  getErrorCategory(code: number): ErrorCategory {
    const details = this.getErrorDetails(code);
    return details?.category || ErrorCategory.GENERIC;
  }

  getErrorSeverity(code: number): ErrorSeverity {
    const details = this.getErrorDetails(code);
    return details?.severity || ErrorSeverity.MEDIUM;
  }
} 