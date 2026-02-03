// Enhanced finance service using the new v2 API endpoints
import { authFetch } from './api';

export interface StudentFeeStatus {
  studentId: string;
  studentName: string;
  humanId: string;
  termId: string;
  classId?: string;
  className?: string;
  expectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  paymentPercentage: number;
  status: 'paid' | 'partial' | 'unpaid' | 'overpaid';
  isOverdue: boolean;
  lastPaymentDate?: string;
  carryForwardAmount: number;
  currentTermFees: number;
}

export interface TermFinanceSummary {
  termId: string;
  termName: string;
  academicCalendar: string;
  totalStudents: number;
  expectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  paymentPercentage: number;
  studentsFullyPaid: number;
  studentsPartiallyPaid: number;
  studentsUnpaid: number;
  studentsOverdue: number;
  totalCarryForwardAmount: number;
  currentTermFeesAmount: number;
  averagePaymentPerStudent: number;
  isTermCompleted: boolean;
  termEndDate: string;
}

export interface AllocationSuggestion {
  termId: string;
  termName: string;
  suggestedAmount: number;
  reason: string;
  priority: number;
  description: string;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  termId: string;
  allocatedAmount: number;
  allocationReason: string;
  notes?: string;
  allocatedAt: string;
  isAutoAllocation: boolean;
  term?: {
    termNumber: number;
    academicCalendar: { term: string };
  };
}

export interface OverdueAnalysis {
  studentId: string;
  studentName: string;
  totalOverdueAmount: number;
  overdueTerms: Array<{
    termId: string;
    termName: string;
    amount: number;
    daysPastDue: number;
  }>;
}

export interface CarryForwardSummary {
  totalStudents: number;
  totalAmountCarriedForward: number;
  createdFeeRecords: number;
  balances: Array<{
    studentId: string;
    originalTermId: string;
    targetTermId: string;
    outstandingAmount: number;
    reason: string;
  }>;
}

// Enhanced Finance API Service
export const enhancedFinanceService = {
  // Summary & Reporting
  async getFinanceSummary(termId: string, academicCalendarId?: string): Promise<TermFinanceSummary> {
    const params = new URLSearchParams({ termId });
    if (academicCalendarId) params.append('academicCalendarId', academicCalendarId);
    
    const response = await authFetch(`/finance/v2/summary?${params}`);
    if (!response.ok) throw new Error('Failed to fetch finance summary');
    return response.json();
  },

  async getFeeStatuses(termId: string, academicCalendarId?: string): Promise<StudentFeeStatus[]> {
    const params = new URLSearchParams({ termId });
    if (academicCalendarId) params.append('academicCalendarId', academicCalendarId);
    
    const response = await authFetch(`/finance/v2/fee-statuses?${params}`);
    if (!response.ok) throw new Error('Failed to fetch fee statuses');
    return response.json();
  },

  async getStudentFeeStatus(studentId: string, termId: string): Promise<StudentFeeStatus> {
    const response = await authFetch(`/finance/v2/student/${studentId}/status?termId=${termId}`);
    if (!response.ok) throw new Error('Failed to fetch student fee status');
    return response.json();
  },

  async getOverdueAnalysis(): Promise<OverdueAnalysis[]> {
    const response = await authFetch('/finance/v2/overdue-analysis');
    if (!response.ok) throw new Error('Failed to fetch overdue analysis');
    return response.json();
  },

  // Payment Allocations
  async getPaymentAllocations(paymentId: string): Promise<PaymentAllocation[]> {
    const response = await authFetch(`/finance/v2/payments/${paymentId}/allocations`);
    if (!response.ok) throw new Error('Failed to fetch payment allocations');
    return response.json();
  },

  async getAllocationSuggestions(paymentId: string): Promise<AllocationSuggestion[]> {
    const response = await authFetch(`/finance/v2/payments/${paymentId}/allocation-suggestions`);
    if (!response.ok) throw new Error('Failed to fetch allocation suggestions');
    return response.json();
  },

  async autoAllocatePayment(paymentId: string): Promise<PaymentAllocation[]> {
    const response = await authFetch(`/finance/v2/payments/${paymentId}/auto-allocate`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to auto-allocate payment');
    return response.json();
  },

  async createAllocations(allocations: Array<{
    paymentId: string;
    termId: string;
    amount: number;
    reason: string;
    notes?: string;
  }>): Promise<PaymentAllocation[]> {
    const response = await authFetch('/finance/v2/allocations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allocations)
    });
    if (!response.ok) throw new Error('Failed to create allocations');
    return response.json();
  },

  async removeAllocation(allocationId: string): Promise<void> {
    const response = await authFetch(`/finance/v2/allocations/${allocationId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to remove allocation');
  },

  async getTermAllocations(termId: string): Promise<PaymentAllocation[]> {
    const response = await authFetch(`/finance/v2/terms/${termId}/allocations`);
    if (!response.ok) throw new Error('Failed to fetch term allocations');
    return response.json();
  },

  // Carry Forward
  async getOutstandingBalances(termId: string): Promise<Array<{
    studentId: string;
    originalTermId: string;
    targetTermId: string;
    outstandingAmount: number;
    reason: string;
  }>> {
    const response = await authFetch(`/finance/v2/terms/${termId}/outstanding-balances`);
    if (!response.ok) throw new Error('Failed to fetch outstanding balances');
    return response.json();
  },

  async carryForwardBalances(fromTermId: string, toTermId: string): Promise<CarryForwardSummary> {
    const response = await authFetch('/finance/v2/carry-forward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromTermId, toTermId })
    });
    if (!response.ok) throw new Error('Failed to carry forward balances');
    return response.json();
  },

  async getStudentCarryForwardHistory(studentId: string): Promise<any[]> {
    const response = await authFetch(`/finance/v2/students/${studentId}/carry-forward-history`);
    if (!response.ok) throw new Error('Failed to fetch carry-forward history');
    return response.json();
  },

  async reverseCarryForward(termId: string, studentId?: string): Promise<{
    removedFees: number;
    totalAmount: number;
  }> {
    const params = new URLSearchParams({ termId });
    if (studentId) params.append('studentId', studentId);
    
    const response = await authFetch(`/finance/v2/carry-forward/reverse?${params}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to reverse carry-forward');
    return response.json();
  },

  // Enhanced Transactions
  async getTransactions(
    page: number = 1,
    limit: number = 20,
    termId?: string,
    studentId?: string,
    academicCalendarId?: string
  ): Promise<{
    transactions: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    filters: any;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    if (termId) params.append('termId', termId);
    if (studentId) params.append('studentId', studentId);
    if (academicCalendarId) params.append('academicCalendarId', academicCalendarId);

    const response = await authFetch(`/finance/v2/transactions?${params}`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  }
};