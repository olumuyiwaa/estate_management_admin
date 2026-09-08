export interface TokenDto {
  accessToken?: string | null;
  refreshToken?: string | null;
}

export interface LoginPayload {
  userName: string;
  password: string;
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser;
  [key: string]: any;
}

export interface AuthUser {
  id?: string | number;
  userName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  roles?: string[];
  role?: string;
  mobileNo?: string;
  isActive?: boolean;
  permissions?: string[];
  [key: string]: any;
}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export function getUserRole(user: AuthUser | null | undefined): string {
  if (!user) return "";
  if (user.role) return String(user.role);
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return String(user.roles[0]);
  }
  return "";
}

export interface ChangePasswordDto {
  currentPassword?: string | null;
  newPassword?: string | null;
}

/** Standard API envelope used by Corvanta */
export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string | null;
  data?: T;
  errors?: any;
}

export interface PagedData<T> {
  items: T[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface Resident {
  id: number;
  residentCode?: string;
  residentType?: string;
  title?: string | null;
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  email?: string;
  address?: string | null;
  mobileNo?: string;
  phoneNo?: string | null;
  sex?: string | null;
  category?: string | null;
  profileImageUrl?: string | null;
  isActive?: boolean;
  createdAt?: string;
  createdBy?: string;
  [key: string]: any;
}

export interface StaffMember {
  id: number;
  staffCode?: string;
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  fullName?: string;
  gender?: string;
  phoneNumber?: string;
  email?: string;
  departmentId?: number;
  departmentCode?: string;
  departmentName?: string;
  position?: string;
  isActive?: boolean;
  [key: string]: any;
}

export interface Visitor {
  id?: number;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  hostResidentId?: number;
  purpose?: string;
  status?: string;
  checkInTime?: string;
  checkOutTime?: string;
  verificationCode?: string;
  [key: string]: any;
}

export interface ServiceRequest {
  id: number;
  requestReference?: string;
  residentId?: number;
  categoryId?: number;
  subject?: string;
  description?: string;
  priority?: string;
  status?: string;
  attachmentUrl?: string | null;
  assignedTo?: string | null;
  assignedDate?: string | null;
  resolvedDate?: string | null;
  closedDate?: string | null;
  createdBy?: string;
  createdAt?: string;
  categoryCode?: string;
  categoryName?: string;
  residentCode?: string;
  residentFirstName?: string;
  residentLastName?: string;
  residentMobileNo?: string;
  residentEmail?: string;
  [key: string]: any;
}

export interface ServiceRequestSummary {
  totalRequests: number;
  openRequests: number;
  assignedRequests: number;
  inProgressRequests: number;
  resolvedRequests: number;
  closedRequests: number;
  criticalRequests: number;
  requestsToday: number;
  requestsThisMonth: number;
}

export interface AnnouncementSummary {
  totalAnnouncements: number;
  publishedAnnouncements: number;
  draftAnnouncements: number;
  expiredAnnouncements: number;
  criticalAnnouncements: number;
  announcementsToday: number;
  announcementsThisMonth: number;
}
