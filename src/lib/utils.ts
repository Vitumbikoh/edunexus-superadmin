import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API base - prefer Vite env, fallback to localhost:5000
export const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "http://localhost:5000";

async function request(path: string, options: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) } as Record<string, string>;
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let body: any = undefined;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch (err) {
    body = text;
  }
  if (!res.ok) {
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
