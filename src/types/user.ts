export type UserRole = 'admin' | 'teacher' | 'parent' | 'student' | 'driver' | 'finance' | 'developer' | 'canteen';

export interface User {
  id: string;
  email: string;
  name: string;
  nameAr?: string;
  role: UserRole;
  createdAt: Date;
  lastLogin?: Date;
  profileImage?: string;
  phone?: string;
  // Role-specific fields
  studentId?: string; // For students
  parentId?: string; // For students
  classId?: string; // For students and teachers
  busId?: string; // For drivers and students
  subjects?: string[]; // For teachers
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  selectRole: (role: UserRole) => void;
  selectedRole: UserRole | null;
  saveAction?: () => void;
}