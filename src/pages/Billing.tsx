import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '@/lib/utils';

type Invoice = {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  amountPaid: number;
  status: string;
  issueDate: string;
  currency: string;
  termId?: string | null;
  academicCalendarId?: string | null;
  billingMonth?: string | null;
};

type BillingPlan = {
  id: string;
  schoolId: string;
  ratePerStudent: number;
  currency: string;
  cadence: 'monthly' | 'per_term' | 'per_academic_year';
  planType: 'per_student' | 'package';
  effectiveFrom: string;
  isActive: boolean;
};

type InvoiceScope = 'monthly' | 'term' | 'academic_calendar';
type PackageId = 'normal' | 'silver' | 'golden';
type PackageRates = Record<PackageId, string>;
type NumericPackageRates = Record<PackageId, number>;

type SchoolPackageConfigSummary = {
  assignedPackage: PackageId;
  pricing: NumericPackageRates;
};

const PACKAGE_LABELS: Record<PackageId, string> = {
  normal: 'Normal',
  silver: 'Silver',
  golden: 'Golden',
};

export default function Billing() {
  const [rate, setRate] = useState('500');
  const [currency, setCurrency] = useState('MWK');
  const [planType, setPlanType] = useState<'per_student' | 'package'>('per_student');
  const [cadence, setCadence] = useState<'monthly' | 'per_term' | 'per_academic_year'>('per_term');
  const [assignedPackage, setAssignedPackage] = useState<PackageId>('normal');
  const [packageRates, setPackageRates] = useState<PackageRates>({ normal: '120', silver: '200', golden: '300' });
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingMonth, setBillingMonth] = useState('');
  const [termId, setTermId] = useState('');
  const [academicCalendarId, setAcademicCalendarId] = useState('');
  const [schools, setSchools] = useState<{ id: string; name: string; code: string }[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [calendars, setCalendars] = useState<{ id: string; term: string }[]>([]);
  const [terms, setTerms] = useState<{ id: string; termNumber?: number; term?: string }[]>([]);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [schoolPackageMap, setSchoolPackageMap] = useState<Record<string, SchoolPackageConfigSummary>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [editingPlan, setEditingPlan] = useState<string | null>(null);

  // Function to load plan data into form for editing
  const editPlan = (plan: BillingPlan) => {
    setRate(plan.ratePerStudent.toString());
    setCurrency(plan.currency);
    setPlanType(plan.planType || 'per_student');
    setCadence(plan.cadence);
    setEditingPlan(plan.id);
    // Scroll to billing plan section
    document.getElementById('billing-plan-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingPlan(null);
    setRate('500');
    setCurrency('MWK');
    setPlanType('per_student');
    setCadence('per_term');
    setAssignedPackage('normal');
    setPackageRates({ normal: '120', silver: '200', golden: '300' });
  };
  const [initialLoading, setInitialLoading] = useState(true);

  async function authed(path: string, options: RequestInit = {}) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          ...(options.headers || {}),
        },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(errorData.message || 'Request failed');
      }
      return res.json();
    } catch (error) {
      console.error('API call failed:', path, error);
      throw error;
    }
  }

  async function authedBlob(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Request failed');
      throw new Error(errorText || 'Request failed');
    }
    return res.blob();
  }

  const isSuperAdmin = useMemo(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.role === 'SUPER_ADMIN';
    } catch (error) { 
      console.error('Error checking user role:', error);
      return false; 
    }
  }, []);

  const loadPlans = async () => {
    try {
      const qp = selectedSchoolId ? `?schoolId=${encodeURIComponent(selectedSchoolId)}` : '';
      const data = await authed(`/billing/plans${qp}`);
      setPlans(data || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
      setPlans([]);
    }
  };

  const loadPackageRates = async () => {
    try {
      const path = isSuperAdmin
        ? (selectedSchoolId
            ? `/school-packages/schools/${encodeURIComponent(selectedSchoolId)}`
            : '/school-packages/catalog')
        : '/school-packages/me';
      const data = await authed(path);
      const pricing = data?.pricing || {};
      const pkg = data?.assignedPackage;
      if (pkg === 'normal' || pkg === 'silver' || pkg === 'golden') {
        setAssignedPackage(pkg);
      }
      setPackageRates({
        normal: String(pricing.normal ?? 120),
        silver: String(pricing.silver ?? 200),
        golden: String(pricing.golden ?? 300),
      });
    } catch (error) {
      console.error('Failed to load package rates:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const qp = selectedSchoolId ? `?schoolId=${encodeURIComponent(selectedSchoolId)}` : '';
      const data = await authed(`/billing/invoices${qp}`);
      setInvoices(data || []);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      setInvoices([]);
    }
  };

  const loadSchoolPackageConfigsForPlans = async (targetPlans: BillingPlan[]) => {
    if (!isSuperAdmin) return;
    const schoolIds = Array.from(new Set(targetPlans.map((plan) => plan.schoolId).filter(Boolean)));
    if (schoolIds.length === 0) {
      setSchoolPackageMap({});
      return;
    }

    const entries = await Promise.all(
      schoolIds.map(async (schoolId) => {
        try {
          const data = await authed(`/school-packages/schools/${encodeURIComponent(schoolId)}`);
          const assignedPackage = data?.assignedPackage;
          if (assignedPackage !== 'normal' && assignedPackage !== 'silver' && assignedPackage !== 'golden') {
            return [schoolId, null] as const;
          }
          const pricing = data?.pricing || {};
          return [
            schoolId,
            {
              assignedPackage,
              pricing: {
                normal: Number(pricing.normal) || 0,
                silver: Number(pricing.silver) || 0,
                golden: Number(pricing.golden) || 0,
              },
            },
          ] as const;
        } catch (error) {
          return [schoolId, null] as const;
        }
      }),
    );

    const next: Record<string, SchoolPackageConfigSummary> = {};
    for (const [schoolId, config] of entries) {
      if (config) next[schoolId] = config;
    }
    setSchoolPackageMap(next);
  };

  // Initial loads
  useEffect(() => {
    if (isSuperAdmin) {
      authed('/billing/schools').then((data) => {
        setSchools(data || []);
      }).catch((error) => {
        console.error('Failed to load schools:', error);
        setSchools([]);
      });
    }
  }, [isSuperAdmin]);

  useEffect(() => { 
    const loadData = async () => {
      try {
        await loadInvoices(); 
        await loadPlans();
        await loadPackageRates();
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    loadData();
  }, [selectedSchoolId]);

  useEffect(() => {
    if (!isSuperAdmin || plans.length === 0) return;
    loadSchoolPackageConfigsForPlans(plans).catch(() => undefined);
  }, [isSuperAdmin, plans]);

  const schoolNameById = useMemo(() => {
    return schools.reduce<Record<string, string>>((acc, school) => {
      acc[school.id] = school.name;
      return acc;
    }, {});
  }, [schools]);

  const formatPlanAmount = (plan: BillingPlan) => {
    if (plan.planType === 'package') {
      const schoolPackage = schoolPackageMap[plan.schoolId];
      if (schoolPackage) {
        const packageAmount = schoolPackage.pricing[schoolPackage.assignedPackage] || 0;
        return `${plan.currency} ${packageAmount.toFixed(2)}`;
      }
      return `${plan.currency} Package`;
    }
    return `${plan.currency} ${Number(plan.ratePerStudent || 0).toFixed(2)}`;
  };

  const updatePlan = async () => {
    setLoadingPlan(true);
    try {
      const body: any = {
        planType,
        currency,
        cadence,
      };
      if (planType === 'per_student') {
        body.ratePerStudent = Number(rate);
      } else {
        body.packagePricing = {
          normal: Number(packageRates.normal),
          silver: Number(packageRates.silver),
          golden: Number(packageRates.golden),
        };
      }
      if (isSuperAdmin && selectedSchoolId) body.schoolId = selectedSchoolId;
      await authed('/billing/plans/set', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setSuccessMessage(editingPlan ? 'Billing plan updated successfully!' : 'Billing plan saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      cancelEdit();
      await loadInvoices();
      await loadPlans();
    } catch (error) {
      console.error('Failed to save plan:', error);
      alert('Failed to save plan: ' + (error as Error).message);
    } finally {
      setLoadingPlan(false);
    }
  };

  const loadAdditionalData = async () => {
    if (selectedSchoolId) {
      try {
  const [calendarsData, termsData] = await Promise.all([
          authed(`/billing/calendars?schoolId=${encodeURIComponent(selectedSchoolId)}`),
          authed(`/billing/terms?schoolId=${encodeURIComponent(selectedSchoolId)}`)
        ]);
  setCalendars(calendarsData || []);
  setTerms(termsData || []);
      } catch (error) {
        console.error('Failed to load calendars/terms:', error);
        setCalendars([]);
        setTerms([]);
      }
    }
  };

  useEffect(() => {
    if (selectedSchoolId) {
      loadAdditionalData();
    }
  }, [selectedSchoolId]);

  // When calendar changes, reload terms filtered by the selected calendar
  useEffect(() => {
    const reloadTerms = async () => {
      if (!selectedSchoolId) return;
      try {
        const qp = new URLSearchParams({ schoolId: selectedSchoolId });
        if (academicCalendarId) qp.set('academicCalendarId', academicCalendarId);
        const termsData = await authed(`/billing/terms?${qp.toString()}`);
        setTerms(termsData || []);
      } catch (e) {
        setTerms([]);
      }
    };
    reloadTerms();
  }, [selectedSchoolId, academicCalendarId]);

  const activePlan = useMemo(() => {
    if (plans.length === 0) return null;
    return plans.find((p) => p.isActive) || plans[0];
  }, [plans]);

  const derivedInvoiceScope: InvoiceScope = useMemo(() => {
    const selectedCadence = activePlan?.cadence || cadence;
    if (selectedCadence === 'monthly') return 'monthly';
    if (selectedCadence === 'per_term') return 'term';
    return 'academic_calendar';
  }, [activePlan, cadence]);

  const payableTerms = useMemo(() => {
    const paidTermIds = new Set(
      invoices
        .filter((invoice) => invoice.status === 'paid' && invoice.termId)
        .map((invoice) => String(invoice.termId)),
    );
    return terms.filter((term) => !paidTermIds.has(String(term.id)));
  }, [terms, invoices]);

  const payableCalendars = useMemo(() => {
    const paidCalendarIds = new Set(
      invoices
        .filter((invoice) => invoice.status === 'paid' && invoice.academicCalendarId)
        .map((invoice) => String(invoice.academicCalendarId)),
    );
    return calendars.filter((calendar) => !paidCalendarIds.has(String(calendar.id)));
  }, [calendars, invoices]);

  useEffect(() => {
    if (derivedInvoiceScope !== 'term') {
      setTermId('');
      return;
    }
    if (termId && !payableTerms.some((term) => term.id === termId)) {
      setTermId('');
    }
  }, [derivedInvoiceScope, payableTerms, termId]);

  useEffect(() => {
    if (derivedInvoiceScope !== 'academic_calendar') {
      setAcademicCalendarId('');
      return;
    }
    if (academicCalendarId && !payableCalendars.some((calendar) => calendar.id === academicCalendarId)) {
      setAcademicCalendarId('');
    }
  }, [derivedInvoiceScope, payableCalendars, academicCalendarId]);

  useEffect(() => {
    if (derivedInvoiceScope !== 'monthly') {
      setBillingMonth('');
    }
  }, [derivedInvoiceScope]);

  const generateInvoice = async () => {
    setLoadingGenerate(true);
    try {
      const body: any = {};
      if (isSuperAdmin && selectedSchoolId) body.schoolId = selectedSchoolId;
      if (derivedInvoiceScope === 'monthly') {
        if (!billingMonth) {
          alert('Please select a month');
          return;
        }
        body.billingMonth = billingMonth;
      }
      if (derivedInvoiceScope === 'term') {
        if (!termId) {
          alert('Please select a term');
          return;
        }
        body.termId = termId;
      }
      if (derivedInvoiceScope === 'academic_calendar') {
        if (!academicCalendarId) {
          alert('Please select an academic calendar');
          return;
        }
        body.academicCalendarId = academicCalendarId;
      }

      await authed('/billing/invoices/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setSuccessMessage('Invoice generated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadInvoices();
      setTermId('');
      setAcademicCalendarId('');
      setBillingMonth('');
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      alert('Failed to generate invoice: ' + (error as Error).message);
    } finally {
      setLoadingGenerate(false);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await authed(`/billing/invoices/${id}`, { method: 'DELETE' });
      await loadInvoices();
    } catch (e) {
      alert('Failed to delete invoice');
    }
  };

  const markInvoiceAsPaid = async (id: string, invoiceNumber: string, totalAmount: number) => {
    if (!confirm(`Mark invoice ${invoiceNumber} as paid?`)) return;
    try {
      await authed(`/billing/invoices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status: 'paid',
          amountPaid: totalAmount
        }),
      });
      setSuccessMessage(`Invoice ${invoiceNumber} marked as paid successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadInvoices();
    } catch (error) {
      console.error('Failed to mark invoice as paid:', error);
      alert('Failed to mark invoice as paid: ' + (error as Error).message);
    }
  };

  return (
    <AdminLayout title="Billing Management" subtitle="Professional billing system for schools">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Link to New Billing Management */}
        <div className="flex justify-end">
          <Button variant="outline" asChild>
            <Link to="/billing-management">
              <Wallet className="mr-2 h-4 w-4" />
              New Billing Management
            </Link>
          </Button>
        </div>

        {/* Success Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          </div>
        )}

        {/* School Selection */}
        {isSuperAdmin && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">School Selection</CardTitle>
              <CardDescription>Choose which school to manage billing for</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name} ({school.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* If school is selected (or user is admin), show school-specific tools */}
        {(selectedSchoolId || !isSuperAdmin) && (
          <>
            {/* Billing Plan Setup */}
            <Card className="w-full" id="billing-plan-section">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Billing Plan</CardTitle>
                <CardDescription>Set billing rates and frequency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="plan-type" className="text-sm font-medium">Billing Model</Label>
                <Select value={planType} onValueChange={(v: 'per_student' | 'package') => setPlanType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_student">Per Student</SelectItem>
                    <SelectItem value="package">By Package (Normal/Silver/Golden)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {planType === 'per_student' ? (
                <div className="space-y-2">
                  <Label htmlFor="rate" className="text-sm font-medium">Rate per Student</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="500.00"
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="assigned-package-rate" className="text-sm font-medium">
                    {PACKAGE_LABELS[assignedPackage]} Package Amount
                  </Label>
                  <Input
                    id="assigned-package-rate"
                    type="number"
                    step="0.01"
                    value={packageRates[assignedPackage]}
                    onChange={(e) => setPackageRates((prev) => ({
                      ...prev,
                      [assignedPackage]: e.target.value,
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Invoice amount will use the school's assigned package: {PACKAGE_LABELS[assignedPackage]}.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MWK">MWK</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cadence" className="text-sm font-medium">Billing Frequency</Label>
                  <Select value={cadence} onValueChange={(v: 'monthly' | 'per_term' | 'per_academic_year') => setCadence(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="per_term">Per Term</SelectItem>
                      <SelectItem value="per_academic_year">Per Academic Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button onClick={updatePlan} disabled={loadingPlan} className="flex-1">
                  {loadingPlan ? 'Saving...' : editingPlan ? 'Update Plan' : 'Save Plan'}
                </Button>
                {editingPlan && (
                  <Button onClick={cancelEdit} variant="outline">
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

            {/* Generate Invoice (single section) */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Generate Invoice</CardTitle>
                <CardDescription>Generate an invoice for a specific term or entire academic year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="invoice-scope" className="text-sm font-medium">Invoice Scope</Label>
                    <div id="invoice-scope" className="w-full rounded-md border px-3 py-2 text-sm bg-muted/40">
                      {derivedInvoiceScope === 'monthly' && 'Monthly'}
                      {derivedInvoiceScope === 'term' && 'Per Term'}
                      {derivedInvoiceScope === 'academic_calendar' && 'Per Academic Year'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Invoice scope is controlled by Billing Frequency in the active plan.
                    </p>
                  </div>

                  {derivedInvoiceScope === 'monthly' && (
                    <div className="space-y-2">
                      <Label htmlFor="billing-month" className="text-sm font-medium">Select Month</Label>
                      <Input
                        id="billing-month"
                        type="month"
                        value={billingMonth}
                        onChange={(e) => setBillingMonth(e.target.value)}
                      />
                    </div>
                  )}

                  {derivedInvoiceScope === 'term' && (
                    <div className="space-y-2">
                      <Label htmlFor="term-select" className="text-sm font-medium">Select Unpaid Term</Label>
                      <Select value={termId} onValueChange={setTermId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an unpaid term" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...new Map(payableTerms.map(t => [t.termNumber ?? t.term, t])).values()].map((term: any) => (
                            <SelectItem key={term.id} value={term.id}>
                              {term.term || `Term ${term.termNumber || 'Unknown'}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {payableTerms.length === 0 && (
                        <p className="text-xs text-muted-foreground">All terms are fully paid.</p>
                      )}
                    </div>
                  )}

                  {derivedInvoiceScope === 'academic_calendar' && (
                    <div className="space-y-2">
                      <Label htmlFor="calendar-select" className="text-sm font-medium">Select Unpaid Academic Calendar</Label>
                      <Select value={academicCalendarId} onValueChange={setAcademicCalendarId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an unpaid academic calendar" />
                        </SelectTrigger>
                        <SelectContent>
                          {payableCalendars.map((calendar) => (
                            <SelectItem key={calendar.id} value={calendar.id}>
                              {calendar.term}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {payableCalendars.length === 0 && (
                        <p className="text-xs text-muted-foreground">All academic years are fully paid.</p>
                      )}
                    </div>
                  )}

                  <Button 
                    onClick={generateInvoice} 
                    disabled={
                      loadingGenerate ||
                      (derivedInvoiceScope === 'monthly' && !billingMonth) ||
                      (derivedInvoiceScope === 'term' && !termId) ||
                      (derivedInvoiceScope === 'academic_calendar' && !academicCalendarId)
                    }
                    className="w-full"
                  >
                    {loadingGenerate ? 'Generating...' : 'Generate Invoice'}
                  </Button>
                </div>
              </CardContent>
            </Card>

        {/* Current Billing Plans */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Current Billing Plans</CardTitle>
            <CardDescription>
              {selectedSchoolId || !isSuperAdmin 
                ? 'Active billing configurations' 
                : 'Active billing configurations for all schools'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {initialLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-muted-foreground">Loading plans...</span>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <svg className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                No billing plans configured yet
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg">
                          {formatPlanAmount(plan)}
                        </span>
                        <Badge variant="outline">{(plan.planType || 'per_student').replace('_', ' ')}</Badge>
                        <Badge variant={plan.cadence === 'per_term' ? 'default' : 'secondary'}>
                          {plan.cadence.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Effective from {plan.effectiveFrom ? new Date(plan.effectiveFrom).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editPlan(plan)}
                        className="p-2 h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

  {/* Removed duplicate Generate Invoice section */}

        {/* Invoices */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl font-semibold">Invoices</CardTitle>
                <CardDescription>Generated invoices for the school</CardDescription>
              </div>
              
              {/* Mark All as Paid button - only show if there are unpaid invoices */}
              {invoices.some(inv => inv.status !== 'paid' && inv.status !== 'cancelled') && (
                <Button 
                  onClick={async () => {
                    const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled');
                    if (!confirm(`Mark all ${unpaidInvoices.length} unpaid invoice(s) as paid?`)) return;
                    
                    try {
                      for (const invoice of unpaidInvoices) {
                        await authed(`/billing/invoices/${invoice.id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ 
                            status: 'paid',
                            amountPaid: invoice.totalAmount
                          }),
                        });
                      }
                      setSuccessMessage(`Successfully marked ${unpaidInvoices.length} invoice(s) as paid!`);
                      setTimeout(() => setSuccessMessage(''), 3000);
                      await loadInvoices();
                    } catch (error) {
                      console.error('Failed to mark invoices as paid:', error);
                      alert('Failed to mark invoices as paid: ' + (error as Error).message);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mr-2 h-4 w-4">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                  Mark All as Paid
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No invoices found.
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold">{invoice.invoiceNumber}</span>
                          <span className="text-lg font-semibold">{invoice.currency} {invoice.totalAmount}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Issued {new Date(invoice.issueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          invoice.status === 'paid' ? 'default' :
                          invoice.status === 'partial' ? 'secondary' : 'destructive'
                        }>
                          {invoice.status}
                        </Badge>
                        
                        {/* Mark as Paid button - only show for unpaid invoices */}
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => markInvoiceAsPaid(invoice.id, invoice.invoiceNumber, invoice.totalAmount)}
                            aria-label="Mark as Paid"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                            </svg>
                          </Button>
                        )}
                        
                        <Button variant="ghost" size="icon" onClick={() => deleteInvoice(invoice.id)} aria-label="Delete Invoice">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-red-600">
                            <path d="M9 3a1 1 0 00-1 1v1H5a1 1 0 000 2h14a1 1 0 100-2h-3V4a1 1 0 00-1-1H9z"/>
                            <path fillRule="evenodd" d="M6 8a1 1 0 011-1h10a1 1 0 011 1v10a3 3 0 01-3 3H9a3 3 0 01-3-3V8zm4 3a1 1 0 112 0v6a1 1 0 11-2 0v-6zm5-1a1 1 0 00-1 1v6a1 1 0 102 0v-6a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={async () => {
                          try {
                            const blob = await authedBlob(`/billing/invoices/${invoice.id}/pdf`);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${invoice.invoiceNumber}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                          } catch (e) {
                            alert('Failed to download PDF');
                          }
                        }} aria-label="Download PDF">
                          {/* simple download icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                            <path d="M12 3a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L11 12.586V4a1 1 0 011-1z"/>
                            <path d="M5 20a2 2 0 002 2h10a2 2 0 002-2v-3a1 1 0 10-2 0v3H7v-3a1 1 0 10-2 0v3z"/>
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </>
        )}

        {/* If super admin with no school selected, show all schools data */}
        {isSuperAdmin && !selectedSchoolId && (
          <>
            {/* All Schools Billing Overview */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">All Schools Billing Overview</CardTitle>
                <CardDescription>Billing plans and invoices across all schools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Current Billing Plans for All Schools */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Current Billing Plans</h3>
                    {plans.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        No billing plans configured across schools
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {plans.map((plan) => (
                          <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-lg">
                                  {formatPlanAmount(plan)}
                                </span>
                                <Badge variant="outline">{(plan.planType || 'per_student').replace('_', ' ')}</Badge>
                                <Badge variant={plan.cadence === 'per_term' ? 'default' : 'secondary'}>
                                  {plan.cadence.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                School: {schoolNameById[plan.schoolId] || plan.schoolId}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Effective from {plan.effectiveFrom ? new Date(plan.effectiveFrom).toLocaleDateString() : 'Unknown'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                                {plan.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editPlan(plan)}
                                className="p-2 h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Generated Invoices for All Schools */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Generated Invoices</h3>
                    {invoices.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        No invoices found across schools
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {invoices.map((invoice) => (
                          <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="font-semibold">{invoice.invoiceNumber}</span>
                                  <span className="text-lg font-semibold">{invoice.currency} {invoice.totalAmount}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Issued {new Date(invoice.issueDate).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant={
                                invoice.status === 'paid' ? 'default' :
                                invoice.status === 'partial' ? 'secondary' : 'destructive'
                              }>
                                {invoice.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

      </div>
    </AdminLayout>
  );
}
