import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API base - prefer Vite env, fallback to localhost:5000
export const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1";

// Optionally store / retrieve tenant id (if TenantGuard requires it)
export function setTenantId(tenantId: string | null) {
  if (tenantId) localStorage.setItem('tenantId', tenantId); else localStorage.removeItem('tenantId');
}

function getTenantId() {
  return localStorage.getItem('tenantId');
}

const DEBUG_API = false; // flip to true for verbose logging

async function request(path: string, options: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  // Get token and add to headers if available (except for login/public endpoints)
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) } as Record<string, string>;

  if (token && !path.includes('/auth/login')) {
    headers.Authorization = `Bearer ${token}`;
  }

  const tenantId = getTenantId();
  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }

  if (DEBUG_API) {
    // eslint-disable-next-line no-console
    console.debug('[API] Request', { url, method: options.method || 'GET', headers, body: options.body });
  }

  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let body: any = undefined;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch (err) {
    body = text; // non JSON response
  }

  if (DEBUG_API) {
    // eslint-disable-next-line no-console
    console.debug('[API] Response', { url, status: res.status, body });
  }

  if (!res.ok) {
    // Improve clarity for common 404 on guarded resources
    if (res.status === 404 && path.startsWith('/schools')) {
      const hint = 'Schools endpoint returned 404. Possible causes: (1) Schools module not mounted behind global prefix, (2) TenantGuard expects X-Tenant-ID header (set via setTenantId()), (3) Different route path than /schools.';
      const err: any = new Error(body?.message || hint);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    const err: any = new Error(body?.message || res.statusText || 'API request failed');
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

// School API endpoints
export async function createSchool(data: { name: string; code: string; metadata?: any }) {
  return request('/schools', { method: 'POST', body: JSON.stringify(data) });
}

export async function listSchools(search?: string) {
  const path = search ? `/schools?search=${encodeURIComponent(search)}` : '/schools';
  return request(path, { method: 'GET' });
}

export async function getSchool(id: string) {
  return request(`/schools/${id}`, { method: 'GET' });
}

export async function updateSchool(id: string, data: { name?: string; code?: string; status?: string; metadata?: any }) {
  return request(`/schools/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function suspendSchool(id: string) {
  return request(`/schools/${id}/suspend`, { method: 'PATCH' });
}

export async function activateSchool(id: string) {
  return request(`/schools/${id}/activate`, { method: 'PATCH' });
}

// Auth API endpoints
export async function login(credentials: { email: string; password: string }) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
}

export async function verifyToken() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found');
  return request('/auth/verify', { method: 'GET' });
}

export async function validateToken(token: string) {
  return request('/auth/validate-token', { method: 'POST', body: JSON.stringify({ token }) });
}

// Notifications API endpoints
export async function getSchoolCredentials() {
  return request('/schools/credentials/all', { method: 'GET' });
}
