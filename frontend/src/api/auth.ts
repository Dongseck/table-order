import type {
  AdminLoginRequest,
  AdminLoginResponse,
  CustomerLoginRequest,
  CustomerLoginResponse,
  CustomerMeResponse,
} from '@shared/types/api/auth';
import { api } from './client';

export const authApi = {
  adminLogin: (body: AdminLoginRequest) =>
    api.post<AdminLoginResponse>('/admin/auth/login', { body }),

  customerLogin: (body: CustomerLoginRequest) =>
    api.post<CustomerLoginResponse>('/customer/auth/login', { body }),

  customerMe: () => api.get<CustomerMeResponse>('/customer/auth/me'),
};
