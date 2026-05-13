// Unit 1 (Auth) request/response DTOs.

export interface StoreInfo {
  id: number;
  code: string;
  name: string;
}

// ── Admin login ──────────────────────────────────────────────
export interface AdminLoginRequest {
  storeCode: string;
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  expiresAt: string; // ISO 8601 +09:00
  store: StoreInfo;
  username: string;
}

// ── Customer (table) login ───────────────────────────────────
export interface CustomerLoginRequest {
  storeCode: string;
  tableNumber: number;
  password: string;
}

export interface CustomerLoginResponse {
  token: string;
  tableId: number;
  tableNumber: number;
  store: StoreInfo;
}

// ── Customer auto-login verification ─────────────────────────
export interface CustomerMeResponse {
  tableId: number;
  tableNumber: number;
  store: StoreInfo;
}
