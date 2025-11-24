import { API_BASE } from "@/lib/utils";

export interface BillingStatus {
  schoolId: string;
  status: 'paid' | 'partial' | 'overdue' | 'issued' | 'none';
  totalAmount: number;
  amountPaid: number;
  outstandingAmount: number;
  lastInvoiceDate?: string;
  dueDate?: string;
  currency: string;
}

export interface SchoolWithBilling {
  id: string;
  name: string;
  code: string;
  status: string;
  students?: number;
  teachers?: number;
  established?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  billingStatus?: BillingStatus;
}

class SchoolBillingService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getBillingStatusForSchool(schoolId: string): Promise<BillingStatus> {
    try {
      const invoices = await this.request(`/billing/invoices?schoolId=${schoolId}`);
      
      if (!invoices || invoices.length === 0) {
        return {
          schoolId,
          status: 'none',
          totalAmount: 0,
          amountPaid: 0,
          outstandingAmount: 0,
          currency: 'MWK'
        };
      }

      // Get the most recent invoice
      const latestInvoice = invoices.sort((a: any, b: any) => 
        new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
      )[0];

      const totalAmount = Number(latestInvoice.totalAmount) || 0;
      const amountPaid = Number(latestInvoice.amountPaid) || 0;
      const outstandingAmount = totalAmount - amountPaid;

      return {
        schoolId,
        status: latestInvoice.status,
        totalAmount,
        amountPaid,
        outstandingAmount,
        lastInvoiceDate: latestInvoice.issueDate,
        dueDate: latestInvoice.dueDate,
        currency: latestInvoice.currency || 'MWK'
      };
    } catch (error) {
      console.error(`Failed to get billing status for school ${schoolId}:`, error);
      return {
        schoolId,
        status: 'none',
        totalAmount: 0,
        amountPaid: 0,
        outstandingAmount: 0,
        currency: 'MWK'
      };
    }
  }

  async getBillingStatusForMultipleSchools(schoolIds: string[]): Promise<BillingStatus[]> {
    const promises = schoolIds.map(id => this.getBillingStatusForSchool(id));
    return Promise.all(promises);
  }

  async deactivateSchoolDueToBilling(schoolId: string): Promise<void> {
    await this.request(`/schools/${schoolId}/suspend`, {
      method: 'PATCH',
    });
  }

  async activateSchoolAfterPayment(schoolId: string): Promise<void> {
    await this.request(`/schools/${schoolId}/activate`, {
      method: 'PATCH',
    });
  }

  async markInvoiceAsPaid(invoiceId: string, amountPaid?: number): Promise<void> {
    const updateData: any = { status: 'paid' };
    if (amountPaid !== undefined) {
      updateData.amountPaid = amountPaid;
    }

    await this.request(`/billing/invoices/${invoiceId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  async getInvoicesForSchool(schoolId: string): Promise<any[]> {
    try {
      return await this.request(`/billing/invoices?schoolId=${schoolId}`);
    } catch (error) {
      console.error(`Failed to get invoices for school ${schoolId}:`, error);
      return [];
    }
  }

  getBillingStatusColor(status: string): string {
    switch (status) {
      case 'paid':
        return 'text-green-600';
      case 'partial':
        return 'text-yellow-600';
      case 'overdue':
        return 'text-red-600';
      case 'issued':
        return 'text-blue-600';
      case 'none':
      default:
        return 'text-gray-500';
    }
  }

  getBillingStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'paid':
        return 'default';
      case 'partial':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      case 'issued':
        return 'outline';
      case 'none':
      default:
        return 'secondary';
    }
  }

  getBillingStatusLabel(status: string): string {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'partial':
        return 'Partial Payment';
      case 'overdue':
        return 'Overdue';
      case 'issued':
        return 'Invoice Issued';
      case 'none':
        return 'No Invoice';
      default:
        return 'Unknown';
    }
  }

  formatCurrency(amount: number, currency: string): string {
    switch (currency) {
      case 'MWK':
        return `MK ${amount.toLocaleString()}`;
      case 'USD':
        return `$${amount.toFixed(2)}`;
      default:
        return `${currency} ${amount.toLocaleString()}`;
    }
  }
}

export const schoolBillingService = new SchoolBillingService();