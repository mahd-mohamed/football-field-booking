import { Injectable } from '@angular/core';
import { HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IUser } from '../models/iuser.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  /**
   * Fetches user profile by ID using JWT token for authentication
   * @param userId The user's ID
   * @returns Observable containing user data
   */
  getUserById(userId: string): Observable<IUser> {
    console.log("Inside getUserById method of UserService");
    return this.http.get<IUser>(`${this.apiUrl}/${userId}`);
  }

  // getAllUsers(page?: number, size?: number): Observable<any> {
  //   console.log("Inside getAllUsers method of UserService");
  //   const params = new HttpParams()
  //     .set('page', page?.toString() || '0')
  //     .set('size', size?.toString() || '5');

  //   return this.http.get<any>(`${this.apiUrl}/all`, { params }).pipe(
  //     map(response => {
  //       // Handle paginated response
  //       if (response.content && Array.isArray(response.content)) {
  //         return {
  //           ...response,
  //           content: response.content.sort((a: IUser, b: IUser) =>
  //             a.username.toLowerCase().localeCompare(b.username.toLowerCase())
  //           )
  //         };
  //       }
  //       // Handle non-paginated response (array of users)
  //       else if (Array.isArray(response)) {
  //         return response.sort((a: IUser, b: IUser) =>
  //           a.username.toLowerCase().localeCompare(b.username.toLowerCase())
  //         );
  //       }
  //       // Return response as-is if structure is unexpected
  //       return response;
  //     })
  //   );
  // }

//   getAllUsers(page?: number, size?: number): Observable<any> {
//   console.log("Inside getAllUsers method of UserService");
//   const params = new HttpParams()
//     .set('page', page?.toString() || '0')
//     .set('size', size?.toString() || '5');

//   return this.http.get<any>(`${this.apiUrl}/all`, { params }).pipe(
//     map(response => {
//       // Handle paginated response
//       if (response.content && Array.isArray(response.content)) {
//         return {
//           ...response,
//           content: response.content.sort((a: IUser, b: IUser) =>
//             a.username.toLowerCase().localeCompare(b.username.toLowerCase())
//           )
//         };
//       }
//       // Handle non-paginated response (array of users)
//       else if (Array.isArray(response)) {
//         return response.sort((a: IUser, b: IUser) =>
//           a.username.toLowerCase().localeCompare(b.username.toLowerCase())
//         );
//       }
//       // Return response as-is if structure is unexpected
//       return response;
//     })
//   );
// }

  // getAllUsers(page?: number, size?: number): Observable<any> {
  //   console.log("Inside getAllUsers method of UserService");
  //   const params = new HttpParams()
  //     .set('page', page?.toString() || '0')
  //     .set('size', size?.toString() || '5');
  //   return this.http.get<IUser[]>(`${this.apiUrl}/all`, { params });
  // }

  /**
   * Get all users with filtering, sorting, and pagination
   * @param page Page number (default: 0)
   * @param size Page size (default: 10)
   * @param sortBy Field to sort by (default: 'createdAt')
   * @param sortDirection Sort direction 'asc' or 'desc' (default: 'asc')
   * @param email Filter by email (optional)
   * @param role Filter by role (optional)
   * @param status Filter by status (optional)
   * @param username Filter by username (optional)
   * @returns Observable with paginated user data
   */
  getAllUsers(
    page?: number,
    size?: number,
    sortBy?: string,
    sortDirection?: string,
    email?: string,
    role?: string,
    status?: string,
    username?: string
  ): Observable<any> {
    console.log("Inside getAllUsers method of UserService");

    let params = new HttpParams()
      .set('page', page?.toString() || '0')
      .set('size', size?.toString() || '10')
      .set('sortBy', sortBy || 'createdAt')
      .set('sortDirection', sortDirection || 'asc');

    // Add optional filter parameters
    if (email) {
      params = params.set('email', email);
    }
    if (role) {
      params = params.set('role', role);
    }
    if (status) {
      params = params.set('status', status);
    }
    if (username) {
      params = params.set('username', username);
    }

    return this.http.get<any>(`${this.apiUrl}/all-sorted`, { params });
  }




  checkPassword(password: string): Observable<boolean> {
    console.log("Checking password via API");
    const valid: Observable<boolean> = this.http.post<boolean>(`${this.apiUrl}/check-password`, { password });
    return valid;
  }

  updateUser(id: string, user: Record<string, any>): Observable<IUser> {
    console.log("Updating User via API : ", id, user);
    return this.http.patch<IUser>(`${this.apiUrl}/${id}`, user);
  }
}
