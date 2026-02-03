import { API_BASE } from "@/lib/utils";

export interface FinanceSummaryResponse {
  success: boolean;
  filters: { termId: string; academicCalendarId: string | null };
  labels: { currentTermFigures: string; outstandingFromPreviousTerms: string };
  summary: { totalFeesPaid: number; expectedFees: number; pending: number; overdue: number };
  statuses: Array<{
    studentId: string;
    humanId?: string;
    studentName: string;
    termId: string;
    totalExpected: number;
    totalPaid: number;
    outstanding: number;
    status: 'paid' | 'partial' | 'unpaid';
    hasHistoricalOverdue: boolean;
    historicalOverdueAmount: number;
  }>;
}

export interface TermDto {
  id: string;
  academicCalendarId: string;
  periodId: string;
  periodName: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  isCompleted: boolean;
  termNumber: number;
  term: string;
}

export interface AcademicCalendarDto {
  id?: string;
  term: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  isCompleted?: boolean;
}

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const bodyText = await res.text();
  const json = bodyText ? JSON.parse(bodyText) : undefined;
  if (!res.ok) {
    const message = json?.message || res.statusText || 'Request failed';
    throw new Error(message);
  }
  return json;
}

export async function getActiveAcademicCalendar(): Promise<AcademicCalendarDto | null> {
  return request('/settings/active-academic-calendar');
}

export async function listTerms(academicCalendarId?: string): Promise<TermDto[]> {
  const q = academicCalendarId ? `?academicCalendarId=${academicCalendarId}` : '';
  return request(`/settings/terms${q}`);
}

export async function getFinanceSummary(termId?: string, academicCalendarId?: string): Promise<FinanceSummaryResponse> {
  const params = new URLSearchParams();
  if (termId) params.set('termId', termId);
  if (academicCalendarId) params.set('academicCalendarId', academicCalendarId);
  const q = params.toString() ? `?${params.toString()}` : '';
  return request(`/finance/summary${q}`);
}

export async function getTransactions(page = 1, limit = 10, termId?: string, academicCalendarId?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (termId) params.set('termId', termId);
  if (academicCalendarId) params.set('academicCalendarId', academicCalendarId);
  const q = `?${params.toString()}`;
  return request(`/finance/transactions${q}`);
}
