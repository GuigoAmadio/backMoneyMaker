/**
 * Tipos compartilhados entre Backend e SDK
 * Este arquivo contém tipos que serão exportados para uso no SDK TypeScript
 */

import { UserRole, UserStatus, ClientStatus } from '@prisma/client';

// ==========================================
// ENUMS
// ==========================================
export { UserRole, UserStatus, ClientStatus };

// ==========================================
// AUTH TYPES
// ==========================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
  activeServices?: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface UserProfile {
  id: string;
  clientId: string;
  employeeId?: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  lastLogin?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export interface VerifyEmailData {
  token: string;
}

// ==========================================
// CLIENT TYPES
// ==========================================

export interface Client {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  logo?: string;
  website?: string;
  status: ClientStatus;
  settings: Record<string, any>;
  activeServices: string[];
  plan: string;
  expiresAt?: Date | string;
  stripeCustomerId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  logo?: string;
  website?: string;
  activeServices?: string[];
  plan?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  logo?: string;
  website?: string;
  status?: ClientStatus;
  activeServices?: string[];
  plan?: string;
}

// ==========================================
// USER TYPES
// ==========================================

export interface User {
  id: string;
  clientId: string;
  employeeId?: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  emailVerifiedAt?: Date | string;
  lastLogin?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  status?: UserStatus;
}

// ==========================================
// PRODUCT TYPES
// ==========================================

export interface Product {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  sku?: string;
  barcode?: string;
  image?: string;
  category?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  sku?: string;
  barcode?: string;
  image?: string;
  category?: string;
  isActive?: boolean;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  cost?: number;
  stock?: number;
  sku?: string;
  barcode?: string;
  image?: string;
  category?: string;
  isActive?: boolean;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  isActive?: boolean;
  lowStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface ProductStats {
  totalProducts: number;
  totalSoldValue: number;
  totalSoldQuantity: number;
  lowStockCount: number;
  outOfStockCount: number;
  averagePrice: number;
  monthlyRevenue: number;
  metrics: {
    productsInStock: number;
    inventoryValue: number;
    topSellingCategory?: string;
  };
}

// ==========================================
// SERVICE TYPES
// ==========================================

export interface Service {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  price: number;
  duration?: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateServiceData {
  name: string;
  description?: string;
  price: number;
  duration?: number;
  isActive?: boolean;
}

export interface UpdateServiceData {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  isActive?: boolean;
}

// ==========================================
// APPOINTMENT TYPES
// ==========================================

export interface Appointment {
  id: string;
  clientId: string;
  userId: string;
  serviceId?: string;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateAppointmentData {
  userId: string;
  serviceId?: string;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  status?: string;
}

export interface UpdateAppointmentData {
  title?: string;
  description?: string;
  startTime?: Date | string;
  endTime?: Date | string;
  status?: string;
}

// ==========================================
// ORDER TYPES
// ==========================================

export interface Order {
  id: string;
  clientId: string;
  userId: string;
  total: number;
  status: string;
  items: OrderItem[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface CreateOrderData {
  userId: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  status?: string;
}

// ==========================================
// SCHEDULE TYPES
// ==========================================

export interface Schedule {
  id: string;
  clientId: string;
  userId: string;
  title: string;
  description?: string;
  startDate: Date | string;
  endDate: Date | string;
  recurrence?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateScheduleData {
  title: string;
  description?: string;
  startDate: Date | string;
  endDate: Date | string;
  recurrence?: string;
}

export interface UpdateScheduleData {
  title?: string;
  description?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  recurrence?: string;
}

// ==========================================
// PAGINATION TYPES
// ==========================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ==========================================
// QUERY FILTERS
// ==========================================

export interface DateRangeFilter {
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface SearchFilter {
  search?: string;
}

// ==========================================
// ANALYTICS TYPES
// ==========================================

export interface AnalyticsEvent {
  id: string;
  clientId: string;
  eventType: string;
  eventData: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: Date | string;
}

export interface AnalyticsReport {
  id: string;
  clientId: string;
  reportType: string;
  reportData: Record<string, any>;
  generatedAt: Date | string;
}

// ==========================================
// STRIPE TYPES
// ==========================================

export interface CreateCheckoutSessionData {
  priceId?: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  mode?: 'payment' | 'subscription';
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

// ==========================================
// FINANCIAL TYPES
// ==========================================

export interface Transaction {
  id: string;
  clientId: string;
  userId: string;
  amount: number;
  type: string;
  category?: string;
  description?: string;
  date: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateTransactionData {
  amount: number;
  type: string;
  category?: string;
  description?: string;
  date: Date | string;
}

export interface Workspace {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateWorkspaceData {
  name: string;
  description?: string;
}
