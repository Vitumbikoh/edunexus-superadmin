import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, MoreVertical, Users, BookOpen, TrendingUp, Eye, Copy, RotateCcw, CreditCard, AlertTriangle, Ban, School, Calendar, GraduationCap, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE } from "@/lib/utils";
import { schoolBillingService, type BillingStatus, type SchoolWithBilling } from "@/services/schoolBillingService";

interface School {
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
}

interface SchoolAdminCredentials {
  id: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  username: string;
  email: string;
  password: string;
  isActive: boolean;
  passwordChanged: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SchoolsResponse {
  schools: School[];
  total: number;
  page: number;
  limit: number;
}

interface CredentialsResponse {
  credentials: SchoolAdminCredentials[];
  total: number;
  page: number;
  limit: number;
}

interface CreateSchoolRequest {
  name: string;
  code: string;
}

interface CreateSchoolResponse {
  school: School;
  adminCredentials: {
    username: string;
    email: string;
    password: string;
  };
}

const Schools = () => {
  const [schools, setSchools] = useState<SchoolWithBilling[]>([]);
  const [credentials, setCredentials] = useState<SchoolAdminCredentials[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newSchool, setNewSchool] = useState<CreateSchoolRequest>({ name: "", code: "" });
  const [editSchool, setEditSchool] = useState<School | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showDeactivatePopup, setShowDeactivatePopup] = useState(false);
  const [deactivateSchoolData, setDeactivateSchoolData] = useState<{id: string, name: string} | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivateDate, setDeactivateDate] = useState("");
  const { toast } = useToast();

  // API Helper Functions
  const apiCall = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}${url}`, {
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
  };

  const fetchSchools = async (searchTerm = "", page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm })
      });

      const data = await apiCall(`/schools?${params}`);
      
      let schoolsList: School[] = [];
      // Handle both array response and structured response
      if (Array.isArray(data)) {
        schoolsList = data;
        setTotal(data.length);
        setCurrentPage(1);
        setTotalPages(1);
      } else {
        schoolsList = data.schools || data.data || [];
        setTotal(data.total || data.count || 0);
        setCurrentPage(data.page || 1);
        setTotalPages(Math.ceil((data.total || data.count || 0) / (data.limit || 10)));
      }

      // Fetch billing status for all schools
      await fetchBillingStatuses(schoolsList);
    } catch (err: any) {
      console.error('Failed to fetch schools:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch schools',
        variant: "destructive",
      });
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingStatuses = async (schoolsList: School[]) => {
    if (schoolsList.length === 0) {
      setSchools([]);
      return;
    }

    setLoadingBilling(true);
    try {
      const schoolIds = schoolsList.map(school => school.id);
      const billingStatuses = await schoolBillingService.getBillingStatusForMultipleSchools(schoolIds);
      
      const schoolsWithBilling: SchoolWithBilling[] = schoolsList.map(school => {
        const billingStatus = billingStatuses.find(bs => bs.schoolId === school.id);
        return {
          ...school,
          billingStatus
        };
      });

      setSchools(schoolsWithBilling);
    } catch (err: any) {
      console.error('Failed to fetch billing statuses:', err);
      // Still set schools without billing data if billing fetch fails
      setSchools(schoolsList.map(school => ({ ...school, billingStatus: undefined })));
    } finally {
      setLoadingBilling(false);
    }
  };

  const fetchCredentials = async (searchTerm = "", page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm })
      });

      const data: CredentialsResponse = await apiCall(`/schools/credentials/all?${params}`);
      setCredentials(data.credentials || []);
    } catch (err: any) {
      console.error('Failed to fetch credentials:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch credentials',
        variant: "destructive",
      });
    }
  };

  const createSchoolAPI = async (schoolData: CreateSchoolRequest): Promise<CreateSchoolResponse> => {
    return apiCall('/schools', {
      method: 'POST',
      body: JSON.stringify(schoolData),
    });
  };

  const updateSchoolAPI = async (id: string, schoolData: Partial<School>): Promise<School> => {
    return apiCall(`/schools/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(schoolData),
    });
  };

  const suspendSchoolAPI = async (id: string): Promise<void> => {
    return apiCall(`/schools/${id}/suspend`, {
      method: 'PATCH',
    });
  };

  const activateSchoolAPI = async (id: string): Promise<void> => {
    return apiCall(`/schools/${id}/activate`, {
      method: 'PATCH',
    });
  };

  const resetPasswordAPI = async (schoolId: string): Promise<{ newPassword: string }> => {
    return apiCall(`/schools/${schoolId}/credentials/reset-password`, {
      method: 'PATCH',
    });
  };

  useEffect(() => {
    fetchSchools();
    if (showCredentials) {
      fetchCredentials();
    }
  }, [currentPage, showCredentials]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setCurrentPage(1);
    if (showCredentials) {
      fetchCredentials(value, 1);
    } else {
      fetchSchools(value, 1);
    }
  };

  const handleAddSchool = async () => {
    if (!newSchool.name.trim() || !newSchool.code.trim()) {
      toast({
        title: "Validation Error",
        description: 'Please provide both school name and code',
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await createSchoolAPI(newSchool);
      
      // Log the response for debugging
      console.log('Create school response:', response);
      
      // Check if adminCredentials exists in the response
      if (response && response.adminCredentials) {
        toast({
          title: "School Created",
          description: `School created successfully. Admin credentials:
          Username: ${response.adminCredentials.username}
          Email: ${response.adminCredentials.email}
          Password: ${response.adminCredentials.password}`,
        });
      } else {
        // Fallback if adminCredentials is not in the expected format
        toast({
          title: "School Created",
          description: "School created successfully.",
        });
        console.warn('Admin credentials not found in response:', response);
      }

      setShowAdd(false);
      setNewSchool({ name: "", code: "" });

      // After creating a school, ensure a "Graduated" class exists for this school (auto-create if missing)
      try {
        const schoolId = (response as any)?.school?.id;
        if (schoolId) {
          const created = await ensureGraduatedClassForSchool(schoolId);
          if (created) {
            toast({
              title: "Graduated Class Created",
              description: "A default 'Graduated' class was created for this school.",
            });
          } else {
            // Already exists; no action needed
          }
        }
      } catch (e:any) {
        console.warn('Failed to ensure Graduated class:', e);
        toast({
          title: "Graduated Class Setup Warning",
          description: e?.message || "Could not create 'Graduated' class automatically. You can create it manually.",
        });
      }
      await fetchSchools(search, currentPage);
      if (showCredentials) {
        await fetchCredentials(search, currentPage);
      }
    } catch (err: any) {
      console.error('Create school failed:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to create school',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSchool = async () => {
    if (!editSchool) return;
    if (!editSchool.name?.trim() || !editSchool.code?.trim()) {
      toast({
        title: "Validation Error",
        description: 'Please provide both school name and code',
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await updateSchoolAPI(editSchool.id, {
        name: editSchool.name,
        code: editSchool.code,
      });

      toast({
        title: "Success",
        description: 'School updated successfully',
      });

      // On edit, try to create "Graduated" class if missing; if exists, inform user cannot create again
      try {
        const created = await ensureGraduatedClassForSchool(editSchool.id);
        if (created) {
          toast({
            title: "Graduated Class Created",
            description: "A default 'Graduated' class was created since it was missing.",
          });
        } else {
          toast({
            title: "Graduated Class Exists",
            description: "You can't create the 'Graduated' class for this school — it already exists.",
          });
        }
      } catch (e:any) {
        console.warn('Graduated class check failed:', e);
        toast({
          title: "Graduated Class Setup Warning",
          description: e?.message || "Could not verify/create 'Graduated' class.",
        });
      }

      setEditSchool(null);
      await fetchSchools(search, currentPage);
    } catch (err: any) {
      console.error('Update school failed:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to update school',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Ensure a "Graduated" class exists for the given school. Returns true if created, false if already exists.
  const ensureGraduatedClassForSchool = async (schoolId: string): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    if (!schoolId || typeof schoolId !== 'string' || schoolId.trim().length === 0) {
      throw new Error('Missing schoolId. Cannot create Graduated class without a school context.');
    }

    // 1) Fetch classes scoped to the school (via tenant header)
    const scopedRes = await fetch(`${API_BASE}/classes?schoolId=${encodeURIComponent(schoolId)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': schoolId,
      },
    });
    if (!scopedRes.ok) {
      const txt = await scopedRes.text();
      throw new Error(txt || `Failed to list classes: ${scopedRes.status}`);
    }
    const scopedText = await scopedRes.text();
    const scopedClasses = scopedText ? JSON.parse(scopedText) : [];
    const graduatedInTenant = Array.isArray(scopedClasses) ? scopedClasses.find((c:any) => String(c?.name || '').toLowerCase() === 'graduated') : undefined;
    if (graduatedInTenant) {
      // Normalize numericalName to 999 if not already
      if (graduatedInTenant.numericalName !== 999) {
        const normRes = await fetch(`${API_BASE}/classes/${graduatedInTenant.id}?schoolId=${encodeURIComponent(schoolId)}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Tenant-ID': schoolId,
          },
          body: JSON.stringify({ numericalName: 999 }),
        });
        // Ignore non-OK normalization errors silently
      }
      return false;
    }

    // 2) Try to find an orphaned 'Graduated' class without schoolId and assign it
    const globalRes = await fetch(`${API_BASE}/classes`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (globalRes.ok) {
      const globalText = await globalRes.text();
      const globalClasses = globalText ? JSON.parse(globalText) : [];
      const orphan = Array.isArray(globalClasses) ? globalClasses.find((c:any) => String(c?.name || '').toLowerCase() === 'graduated' && !c?.schoolId) : undefined;
      if (orphan?.id) {
        const updateRes = await fetch(`${API_BASE}/classes/${orphan.id}?schoolId=${encodeURIComponent(schoolId)}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Tenant-ID': schoolId,
          },
          body: JSON.stringify({ schoolId, school_id: schoolId, numericalName: 999, description: orphan.description || 'Graduated class' }),
        });
        if (!updateRes.ok) {
          const txt = await updateRes.text();
          throw new Error(txt || `Failed to assign Graduated class to school: ${updateRes.status}`);
        }
        return true; // orphan fixed
      }
    }

    // Create the "Graduated" class
    const createRes = await fetch(`${API_BASE}/classes?schoolId=${encodeURIComponent(schoolId)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': schoolId,
      },
      body: JSON.stringify({ name: 'Graduated', numericalName: 999, description: 'Graduated class', schoolId, school_id: schoolId }),
    });
    if (!createRes.ok) {
      const txt = await createRes.text();
      throw new Error(txt || `Failed to create Graduated class: ${createRes.status}`);
    }

    // CRITICAL: Verify the created class has the correct schoolId - FAIL THE ENTIRE OPERATION IF NOT
    const createdText = await createRes.text();
    const created = createdText ? JSON.parse(createdText) : undefined;
    const createdId = created?.id;
    const createdSchoolId = created?.schoolId ?? created?.school_id;
    
    if (!createdId) {
      throw new Error('CRITICAL: Failed to create Graduated class - no ID returned. School save aborted.');
    }
    
    if (!createdSchoolId || createdSchoolId !== schoolId) {
      // Try one final update attempt
      const fixRes = await fetch(`${API_BASE}/classes/${createdId}?schoolId=${encodeURIComponent(schoolId)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': schoolId,
        },
        body: JSON.stringify({ schoolId, school_id: schoolId, numericalName: 999 }),
      });
      
      if (!fixRes.ok) {
        throw new Error(`CRITICAL: Cannot assign schoolId to Graduated class. Backend does not accept schoolId. School save aborted.`);
      }
      
      // Verify the fix worked
      const verifyRes = await fetch(`${API_BASE}/classes/${createdId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': schoolId,
        },
      });
      
      if (verifyRes.ok) {
        const verifyText = await verifyRes.text();
        const verified = verifyText ? JSON.parse(verifyText) : undefined;
        const verifiedSchoolId = verified?.schoolId ?? verified?.school_id;
        if (!verifiedSchoolId || verifiedSchoolId !== schoolId) {
          throw new Error(`CRITICAL: Graduated class created but schoolId is still missing/wrong (${verifiedSchoolId}). Backend issue. School save aborted.`);
        }
      } else {
        throw new Error(`CRITICAL: Cannot verify Graduated class schoolId assignment. School save aborted.`);
      }
    }
    
    return true;
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Are you sure you want to suspend this school?')) return;

    setLoading(true);
    try {
      await suspendSchoolAPI(id);
      toast({
        title: "Success",
        description: 'School suspended successfully',
      });
      await fetchSchools(search, currentPage);
    } catch (err: any) {
      console.error('Suspend failed:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to suspend school',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    if (!confirm('Are you sure you want to activate this school?')) return;

    setLoading(true);
    try {
      await activateSchoolAPI(id);
      toast({
        title: "Success",
        description: 'School activated successfully',
      });
      await fetchSchools(search, currentPage);
    } catch (err: any) {
      console.error('Activate failed:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to activate school',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateDueToBilling = async (id: string, schoolName: string) => {
    if (!confirm(`Are you sure you want to deactivate "${schoolName}" due to non-payment? Users from this school will not be able to log in.`)) return;

    setLoading(true);
    try {
      await schoolBillingService.deactivateSchoolDueToBilling(id);
      toast({
        title: "School Deactivated",
        description: `${schoolName} has been deactivated due to payment issues. Users cannot log in until payment is resolved.`,
        variant: "destructive",
      });
      await fetchSchools(search, currentPage);
    } catch (err: any) {
      console.error('Deactivate due to billing failed:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to deactivate school',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateWithReason = async () => {
    if (!deactivateSchoolData || !deactivateReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for deactivation.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await schoolBillingService.deactivateSchoolDueToBilling(deactivateSchoolData.id);
      
      // TODO: If you have an endpoint to save deactivation reasons, call it here
      // await apiCall(`/schools/${deactivateSchoolData.id}/deactivation-log`, {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     reason: deactivateReason,
      //     deactivationDate: deactivateDate,
      //   }),
      // });

      toast({
        title: "School Deactivated",
        description: `${deactivateSchoolData.name} has been deactivated on ${deactivateDate}. Reason: ${deactivateReason}`,
        variant: "destructive",
      });
      
      setShowDeactivatePopup(false);
      setDeactivateSchoolData(null);
      setDeactivateReason("");
      setDeactivateDate("");
      await fetchSchools(search, currentPage);
    } catch (err: any) {
      console.error('Deactivate with reason failed:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to deactivate school',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (schoolId: string, schoolName: string) => {
    if (!confirm(`Are you sure you want to mark all outstanding invoices for "${schoolName}" as paid?`)) return;

    setLoading(true);
    try {
      // Get all invoices for the school
      const invoices = await schoolBillingService.getInvoicesForSchool(schoolId);
      
      // Find unpaid invoices
      const unpaidInvoices = invoices.filter((invoice: any) => 
        invoice.status !== 'paid' && invoice.status !== 'cancelled'
      );

      if (unpaidInvoices.length === 0) {
        toast({
          title: "No Outstanding Invoices",
          description: `${schoolName} has no outstanding invoices to mark as paid.`,
        });
        return;
      }

      // Mark each unpaid invoice as paid
      for (const invoice of unpaidInvoices) {
        await schoolBillingService.markInvoiceAsPaid(invoice.id, invoice.totalAmount);
      }

      toast({
        title: "Invoices Marked as Paid",
        description: `Successfully marked ${unpaidInvoices.length} invoice(s) as paid for ${schoolName}.`,
      });

      // Refresh billing data
      await fetchSchools(search, currentPage);
    } catch (err: any) {
      console.error('Mark as paid failed:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to mark invoices as paid',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (schoolId: string) => {
    if (!confirm('Are you sure you want to reset the admin password for this school?')) return;

    try {
      const response = await resetPasswordAPI(schoolId);
      toast({
        title: "Password Reset",
        description: `Password reset successfully. New password: ${response.newPassword}`,
      });
      if (showCredentials) {
        await fetchCredentials(search, currentPage);
      }
    } catch (err: any) {
      console.error('Reset password failed:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to reset password',
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: `${type} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getCredentialForSchool = (schoolId: string) => {
    return credentials.find(c => c.schoolId === schoolId);
  };

  const activeSchools = schools.filter(s => ["Active", "ACTIVE"].includes(s.status)).length;
  const totalStudents = schools.reduce((sum, school) => sum + (school.students || 0), 0);
  const totalTeachers = schools.reduce((sum, school) => sum + (school.teachers || 0), 0);
  
  // Calculate billing statistics
  const schoolsWithOverdueBilling = schools.filter(s => s.billingStatus?.status === 'overdue');
  const schoolsWithPartialPayment = schools.filter(s => s.billingStatus?.status === 'partial');
  const totalOutstandingAmount = schools.reduce((sum, school) => {
    return sum + (school.billingStatus?.outstandingAmount || 0);
  }, 0);

  return (
    <AdminLayout title="Schools" subtitle="Manage all schools in the system">
      <div className="space-y-6">
        {/* Payment Alerts */}
        {schoolsWithOverdueBilling.length > 0 && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>{schoolsWithOverdueBilling.length} school{schoolsWithOverdueBilling.length > 1 ? 's have' : ' has'} overdue payments.</strong>
              {' '}Total outstanding: {schoolBillingService.formatCurrency(totalOutstandingAmount, 'MWK')}
              {' '}Consider deactivating schools with overdue payments to prevent service misuse.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : total}
              </div>
              <p className="text-xs text-muted-foreground">Schools in system</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Schools</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : activeSchools}
              </div>
              <p className="text-xs text-muted-foreground">
                {total > 0 ? `${((activeSchools / total) * 100).toFixed(1)}% active rate` : "No data"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : totalStudents.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Across all schools</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-16" /> : totalTeachers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Active educators</p>
            </CardContent>
          </Card>
        </div>

        {/* Schools Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{showCredentials ? "School Admin Credentials" : "Schools Management"}</CardTitle>
                <CardDescription>
                  {showCredentials ? "View admin credentials for all schools" : "View and manage all schools in the platform"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={showCredentials ? "outline" : "default"}
                  onClick={() => setShowCredentials(!showCredentials)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {showCredentials ? "View Schools" : "View Credentials"}
                </Button>
                {!showCredentials && (
                  <>
                    <Button onClick={() => setShowAdd(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add School
                    </Button>
                    
                    {schoolsWithOverdueBilling.length > 0 && (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          const overdueSchools = schools.filter(school => 
                            school.billingStatus?.status === 'overdue' || 
                            school.billingStatus?.status === 'partial' ||
                            school.billingStatus?.status === 'issued'
                          );
                          
                          if (overdueSchools.length === 0) {
                            toast({
                              title: "No Outstanding Invoices",
                              description: "No schools have outstanding invoices to mark as paid.",
                            });
                            return;
                          }
                          
                          if (confirm(`Mark all outstanding invoices as paid for ${overdueSchools.length} school(s)?`)) {
                            Promise.all(
                              overdueSchools.map(school => 
                                handleMarkAsPaid(school.id, school.name)
                              )
                            );
                          }
                        }}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark All as Paid ({schoolsWithOverdueBilling.length})
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={showCredentials ? "Search credentials..." : "Search schools..."}
                  className="pl-8"
                  value={search}
                  onChange={handleSearch}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Add School Modal */}
            {showAdd && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded shadow w-full max-w-md">
                  <h2 className="text-lg font-bold mb-4">Add School</h2>
                  <Input
                    placeholder="School Name"
                    className="mb-2"
                    value={newSchool.name}
                    onChange={e => setNewSchool(s => ({ ...s, name: e.target.value }))}
                  />
                  <Input
                    placeholder="School Code"
                    className="mb-2"
                    value={newSchool.code}
                    onChange={e => setNewSchool(s => ({ ...s, code: e.target.value }))}
                  />
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleAddSchool} disabled={loading}>
                      {loading ? "Creating..." : "Create"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit School Modal */}
            {editSchool && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded shadow w-full max-w-md">
                  <h2 className="text-lg font-bold mb-4">Edit School</h2>
                  <Input
                    placeholder="School Name"
                    className="mb-2"
                    value={editSchool.name}
                    onChange={e => setEditSchool(s => s ? { ...s, name: e.target.value } : s)}
                  />
                  <Input
                    placeholder="School Code"
                    className="mb-2"
                    value={editSchool.code}
                    onChange={e => setEditSchool(s => s ? { ...s, code: e.target.value } : s)}
                  />
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleEditSchool} disabled={loading}>
                      {loading ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="outline" onClick={() => setEditSchool(null)}>Cancel</Button>
                  </div>
                </div>
              </div>
            )}

            {loading && !showAdd && !editSchool ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {showCredentials ? (
                        <>
                          <TableHead>School</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Password</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Password Changed</TableHead>
                          <TableHead className="w-[70px]"></TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>School Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Billing Status</TableHead>
                          <TableHead>Students</TableHead>
                          <TableHead>Teachers</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="w-[70px]"></TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {showCredentials ? (
                      credentials.map((credential) => (
                        <TableRow key={credential.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{credential.schoolName}</div>
                              <div className="text-sm text-muted-foreground">{credential.schoolCode}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm">{credential.username}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(credential.username, 'Username')}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">{credential.email}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(credential.email, 'Email')}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm">{credential.password}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(credential.password, 'Password')}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={credential.isActive ? "default" : "destructive"}>
                              {credential.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={credential.passwordChanged ? "default" : "secondary"}>
                              {credential.passwordChanged ? "Changed" : "Default"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => copyToClipboard(
                                    `School: ${credential.schoolName}\nUsername: ${credential.username}\nEmail: ${credential.email}\nPassword: ${credential.password}`,
                                    'All credentials'
                                  )}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy All Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => resetPassword(credential.schoolId)}
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Reset Password
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      schools.map((school) => {
                        const isActive = ["Active", "ACTIVE"].includes(school.status);
                        const billingStatus = school.billingStatus;
                        const hasOverdueBilling = billingStatus?.status === 'overdue';
                        const hasOutstandingAmount = billingStatus && billingStatus.outstandingAmount > 0;
                        
                        return (
                          <TableRow key={school.id} className={hasOverdueBilling ? "bg-red-50 dark:bg-red-900/10" : ""}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {school.name}
                                {hasOverdueBilling && (
                                  <div title="Overdue payment">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{school.code}</TableCell>
                            <TableCell>
                              <Badge variant={isActive ? "default" : "destructive"}>
                                {school.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {loadingBilling ? (
                                <Skeleton className="h-6 w-20" />
                              ) : billingStatus ? (
                                <div className="space-y-1">
                                  <Badge variant={schoolBillingService.getBillingStatusBadgeVariant(billingStatus.status)}>
                                    {schoolBillingService.getBillingStatusLabel(billingStatus.status)}
                                  </Badge>
                                  {hasOutstandingAmount && (
                                    <div className="text-xs text-red-600">
                                      Outstanding: {schoolBillingService.formatCurrency(billingStatus.outstandingAmount, billingStatus.currency)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="secondary">No Data</Badge>
                              )}
                            </TableCell>
                            <TableCell>{school.students?.toLocaleString() ?? "-"}</TableCell>
                            <TableCell>{school.teachers ?? "-"}</TableCell>
                            <TableCell>{new Date(school.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditSchool(school)}>
                                    Edit School
                                  </DropdownMenuItem>
                                  
                                  {billingStatus && (
                                    <>
                                      <DropdownMenuSeparator />
                                      
                                      {/* Show mark as paid for schools with outstanding payments */}
                                      {(billingStatus.status === 'overdue' || billingStatus.status === 'partial' || billingStatus.status === 'issued') && billingStatus.outstandingAmount > 0 && (
                                        <DropdownMenuItem 
                                          onClick={() => handleMarkAsPaid(school.id, school.name)}
                                          className="text-green-600"
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Mark as Paid
                                        </DropdownMenuItem>
                                      )}

                                      {/* Deactivate button */}
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setDeactivateSchoolData({id: school.id, name: school.name});
                                          setDeactivateDate(new Date().toISOString().split('T')[0]); // Today's date
                                          setDeactivateReason("");
                                          setShowDeactivatePopup(true);
                                        }}
                                        className="text-red-600"
                                      >
                                        <Ban className="mr-2 h-4 w-4" />
                                        Deactivate
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  
                                  <DropdownMenuSeparator />
                                  
                                  {/* Show deactivate button for schools with overdue payments */}
                                  {hasOverdueBilling && isActive && (
                                    <DropdownMenuItem 
                                      onClick={() => handleDeactivateDueToBilling(school.id, school.name)}
                                      className="text-red-600"
                                    >
                                      <Ban className="mr-2 h-4 w-4" />
                                      Deactivate (Non-Payment)
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {/* Regular suspend/activate */}
                                  <DropdownMenuItem 
                                    onClick={() => isActive ? handleSuspend(school.id) : handleActivate(school.id)} 
                                    className={isActive ? "text-destructive" : "text-green-600"}
                                  >
                                    {isActive ? "Suspend" : "Activate"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, total)} of {total} items
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Deactivation Popup */}
        <Dialog open={showDeactivatePopup} onOpenChange={setShowDeactivatePopup}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-red-600">Deactivate School</DialogTitle>
              <DialogDescription>
                You are about to deactivate <strong>{deactivateSchoolData?.name}</strong>. 
                Users from this school will not be able to log in after deactivation.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="deactivate-date">Deactivation Date</Label>
                <Input
                  id="deactivate-date"
                  type="date"
                  value={deactivateDate}
                  onChange={(e) => setDeactivateDate(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deactivate-reason">Reason for Deactivation *</Label>
                <Textarea
                  id="deactivate-reason"
                  placeholder="Please provide a detailed reason for deactivating this school..." 
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeactivatePopup(false);
                  setDeactivateSchoolData(null);
                  setDeactivateReason("");
                  setDeactivateDate("");
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeactivateWithReason}
                disabled={loading || !deactivateReason.trim()}
              >
                {loading ? "Deactivating..." : "Deactivate School"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Schools;
