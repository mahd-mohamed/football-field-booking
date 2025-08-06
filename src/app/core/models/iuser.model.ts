import { myUserRole } from '../enums/user-role';

export type UserRole =  'USER' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface IUser {
  id: string;
  username: string;
  email: string; 
  role: UserRole;
  status: UserStatus;
  createdAt: string; 
}


// create interface for register
export interface IRegisterUser {
  username: string;
  email: string;
  password: string;
}


// create interface for register
export interface IRegisterResponseUser {
  id: string;
  token: string;
  role: myUserRole;
}


export interface ILoginUser {
  email: string;
  password: string;
}


