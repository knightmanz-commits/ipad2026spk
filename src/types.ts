import { translations } from './constants';

export type TranslationKey = keyof typeof translations.th;

export enum UserRole {
  Admin = 'Admin',
  Staff = 'Staff'
}

export enum DeviceStatus {
  Available = 'Available',
  Borrowed = 'Borrowed',
  Maintenance = 'Maintenance',
  PendingApproval = 'PendingApproval',
  Lost = 'Lost'
}

export enum DeviceCategory {
  iPad = 'iPad',
  Laptop = 'Laptop',
  Projector = 'Projector',
  Camera = 'Camera',
  Others = 'Others'
}

export interface User {
  users: string;
  password?: string;
  name: string;
  role: UserRole;
}

export interface Category {
  category: string; // This is the ID (e.g., laptop, tablet)
  name: string;
  description: string;
  designatedFor: 'student' | 'teacher' | 'all';
  imageUrl: string;
}

export interface Device {
  id: string; // Device ID (e.g., L001)
  category_id: string; // Matches category in Category
  serial_number: string;
  defaultAccessories: string;
  is_featured: boolean;
  status: DeviceStatus;
  // Hydrated fields for UI
  name?: string;
  categoryName?: string;
  designatedFor?: string;
}

export interface Student {
  studentId: string;
  fullName: string;
  grade: string;
  classroom: string;
  email: string;
  teacherId?: string;
  note?: string;
}

export interface Teacher {
  id: number;
  fullName: string;
  phone: string;
  department: string;
  grade: number;
  classroom: number;
}

export interface ServiceLog {
  id: string;
  product_id: string;
  issue: string;
  report_date: string;
  status: string;
}

export interface ServiceReport {
  id: string;
  deviceId: string;
  issue_type: string;
  details: string;
  email: string;
  studentName?: string;
  classroom?: string;
  photo_url: string;
  reportedAt: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user_id: string;
  action: string;
  details: string;
}

export interface Transaction {
  borrowerId: number;
  fid: string;
  fname: string;
  serial_number: string;
  borrow_date: string;
  borrowTime: string;
  due_date: string;
  return_date: string;
  recorder: string;
  status: string;
}
