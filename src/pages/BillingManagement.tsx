import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, CheckCircle, AlertTriangle, CreditCard, FileText, Download, Send, DollarSign, TrendingUp, School, RotateCcw, Users, Calendar, Eye, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { schoolBillingService, type BillingStatus } from "@/services/schoolBillingService";
import { API_BASE } from "@/lib/utils";

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

interface Invoice {
  id: string;
  schoolId: string;
  schoolName: string;
  invoiceNumber: string;
  totalAmount: number;
  amountPaid: number;
  currency: string;
  status: 'paid' | 'partial' | 'overdue' | 'issued' | 'cancelled';
  issueDate: string;
  dueDate: string;
  term: string;
  academicYear: string;
  description?: string;
}

interface BillingPlan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: 'term' | 'monthly' | 'yearly';
  description?: string;
  isActive: boolean;
  effectiveDate: string;
}

export function BillingManagement() {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedSchoolData, setSelectedSchoolData] = useState<School | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([]);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [allSchoolsData, setAllSchoolsData] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const { toast } = useToast();

  // Load schools on component mount
  useEffect(() => {
    fetchSchools();
    fetchBillingPlans();
    fetchAllSchoolsBillingData();
    fetchFinancialSummary();
  }, []);

  // Load invoices when school is selected
  useEffect(() => {
    if (selectedSchool) {
      fetchInvoicesForSchool(selectedSchool);
      fetchBillingStatusForSchool(selectedSchool);
    }
  }, [selectedSchool]);

  // Update financial summary when allSchoolsData changes
  useEffect(() => {
    if (allSchoolsData.length > 0) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const summary = {
        totalRevenue: allSchoolsData.reduce((sum, school) => sum + (school.totalRevenue || 0), 0),
        monthlyRevenue: allSchoolsData.reduce((sum, school) => {
          const monthlyAmount = school.invoices
            ?.filter(inv => {
              const invoiceDate = new Date(inv.issueDate);
              return inv.status === 'paid' && 
                     invoiceDate.getMonth() === currentMonth && 
                     invoiceDate.getFullYear() === currentYear;
            })
            .reduce((monthSum, inv) => monthSum + Number(inv.totalAmount), 0) || 0;
          return sum + monthlyAmount;
        }, 0),
        outstandingAmount: allSchoolsData.reduce((sum, school) => sum + (school.outstandingAmount || 0), 0),
        totalSchools: allSchoolsData.length,
        paidSchools: allSchoolsData.filter(school => school.billingStatus?.status === 'paid').length,
        overdueSchools: allSchoolsData.filter(school => school.billingStatus?.status === 'overdue').length,
        partialSchools: allSchoolsData.filter(school => school.billingStatus?.status === 'partial').length,
        recentPayments: allSchoolsData
          .filter(school => school.lastPayment)
          .map(school => ({
            schoolName: school.name,
            amount: school.lastPayment.totalAmount,
            date: school.lastPayment.updatedAt || school.lastPayment.issueDate,
            currency: school.lastPayment.currency
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
      };
      
      setFinancialSummary(summary);
    }
  }, [allSchoolsData]);

  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/schools`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch schools');
      
      const data = await response.json();
      const schoolsList = data.schools || data;
      setSchools(schoolsList);
      return schoolsList;
    } catch (error) {
      console.error('Failed to fetch schools:', error);
      toast({
        title: "Error",
        description: "Failed to load schools",
        variant: "destructive",
      });
      return [];
    }
  };

  const fetchBillingPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/billing/plans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBillingPlans(data);
      }
    } catch (error) {
      console.error('Failed to fetch billing plans:', error);
    }
  };

  const fetchInvoicesForSchool = async (schoolId: string) => {
    setLoading(true);
    try {
      const data = await schoolBillingService.getInvoicesForSchool(schoolId);
      setInvoices(data);
      
      // Set school data
      const school = schools.find(s => s.id === schoolId);
      setSelectedSchoolData(school || null);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingStatusForSchool = async (schoolId: string) => {
    try {
      const status = await schoolBillingService.getBillingStatusForSchool(schoolId);
      setBillingStatus(status);
    } catch (error) {
      console.error('Failed to fetch billing status:', error);
    }
  };

  const fetchAllSchoolsBillingData = async () => {
    setLoading(true);
    try {
      const schoolsList = schools.length > 0 ? schools : await fetchSchools();
      const billingPromises = schoolsList.map(async (school) => {
        const invoices = await schoolBillingService.getInvoicesForSchool(school.id);
        const billingStatus = await schoolBillingService.getBillingStatusForSchool(school.id);
        
        const totalRevenue = invoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        
        const outstandingAmount = invoices
          .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
          .reduce((sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.amountPaid)), 0);

        return {
          ...school,
          billingStatus,
          invoices,
          totalRevenue,
          outstandingAmount,
          lastPayment: invoices
            .filter(inv => inv.status === 'paid')
            .sort((a, b) => new Date(b.updatedAt || b.issueDate).getTime() - new Date(a.updatedAt || a.issueDate).getTime())[0]
        };
      });

      const schoolsWithBilling = await Promise.all(billingPromises);
      setAllSchoolsData(schoolsWithBilling);
    } catch (error) {
      console.error('Failed to fetch all schools billing data:', error);
      toast({
        title: "Error",
        description: "Failed to load comprehensive billing data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      // Calculate financial summary from all schools data
      const summary = {
        totalRevenue: 0,
        monthlyRevenue: 0,
        outstandingAmount: 0,
        totalSchools: 0,
        paidSchools: 0,
        overdueSchools: 0,
        recentPayments: []
      };

      // This would be calculated after allSchoolsData is loaded
      setFinancialSummary(summary);
    } catch (error) {
      console.error('Failed to fetch financial summary:', error);
    }
  };

  const handleMarkInvoiceAsPaid = async (invoiceId: string, invoice: Invoice) => {
    if (!confirm(`Mark invoice ${invoice.invoiceNumber} as paid?`)) return;

    try {
      await schoolBillingService.markInvoiceAsPaid(invoiceId, invoice.totalAmount);
      
      toast({
        title: "Invoice Updated",
        description: `Invoice ${invoice.invoiceNumber} marked as paid`,
      });

      // Refresh data
      if (selectedSchool) {
        await fetchInvoicesForSchool(selectedSchool);
        await fetchBillingStatusForSchool(selectedSchool);
      }
    } catch (error: any) {
      console.error('Failed to mark invoice as paid:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsPaid = async () => {
    if (!selectedSchool || !selectedSchoolData) return;
    
    const unpaidInvoices = invoices.filter(inv => 
      inv.status !== 'paid' && inv.status !== 'cancelled'
    );

    if (unpaidInvoices.length === 0) {
      toast({
        title: "No Outstanding Invoices",
        description: "This school has no outstanding invoices",
      });
      return;
    }

    if (!confirm(`Mark all ${unpaidInvoices.length} outstanding invoice(s) as paid for ${selectedSchoolData.name}?`)) return;

    setLoading(true);
    try {
      for (const invoice of unpaidInvoices) {
        await schoolBillingService.markInvoiceAsPaid(invoice.id, invoice.totalAmount);
      }

      toast({
        title: "All Invoices Updated",
        description: `Marked ${unpaidInvoices.length} invoice(s) as paid for ${selectedSchoolData.name}`,
      });

      // Refresh data
      await fetchInvoicesForSchool(selectedSchool);
      await fetchBillingStatusForSchool(selectedSchool);
    } catch (error: any) {
      console.error('Failed to mark invoices as paid:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      invoice.description?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.term.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'paid': return 'default';
      case 'partial': return 'secondary';
      case 'overdue': return 'destructive';
      case 'issued': return 'outline';
      default: return 'secondary';
    }
  };

  const totalOutstanding = invoices
    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + (inv.totalAmount - inv.amountPaid), 0);

  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <AdminLayout title="Billing Management" subtitle="Manage school billing, invoices, and payment status">
      <div className="space-y-6">
        {/* Enhanced Header with Financial Overview */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Financial Management Hub
              </h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive billing system with real-time financial insights
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={fetchAllSchoolsBillingData} disabled={loading}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Financial Summary Cards */}
          {financialSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-800">
                        MK {financialSummary.totalRevenue.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-600">All time earnings</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">This Month</p>
                      <p className="text-2xl font-bold text-blue-800">
                        MK {financialSummary.monthlyRevenue.toLocaleString()}
                      </p>
                      <p className="text-xs text-blue-600">Current month revenue</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-700">Outstanding</p>
                      <p className="text-2xl font-bold text-red-800">
                        MK {financialSummary.outstandingAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-red-600">Pending payments</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Active Schools</p>
                      <p className="text-2xl font-bold text-purple-800">
                        {financialSummary.totalSchools}
                      </p>
                      <p className="text-xs text-purple-600">
                        {financialSummary.paidSchools} paid, {financialSummary.overdueSchools} overdue
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <School className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* School Selection */}
        <Card>
          <CardHeader>
            <CardTitle>School Selection</CardTitle>
            <CardDescription>Choose which school to manage billing for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger>
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

              {selectedSchoolData && billingStatus && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
                          <p className="text-2xl font-bold text-red-600">
                            {schoolBillingService.formatCurrency(totalOutstanding, billingStatus.currency)}
                          </p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                          <p className="text-2xl font-bold text-green-600">
                            {schoolBillingService.formatCurrency(totalPaid, billingStatus.currency)}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Billing Status</p>
                          <Badge variant={schoolBillingService.getBillingStatusBadgeVariant(billingStatus.status)}>
                            {schoolBillingService.getBillingStatusLabel(billingStatus.status)}
                          </Badge>
                        </div>
                        <CreditCard className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="schools-status" className="flex items-center gap-2">
                <School className="h-4 w-4" />
                Schools Status
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Invoices
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schools, invoices..."
                  className="pl-8 w-[250px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Payments */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Recent Payments
                  </CardTitle>
                  <CardDescription>Latest successful payments from schools</CardDescription>
                </CardHeader>
                <CardContent>
                  {financialSummary?.recentPayments?.length > 0 ? (
                    <div className="space-y-3">
                      {financialSummary.recentPayments.map((payment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div>
                            <p className="font-medium text-green-800">{payment.schoolName}</p>
                            <p className="text-sm text-green-600">
                              {new Date(payment.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-800">
                              {payment.currency} {Number(payment.amount).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No recent payments</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Payment Rate</span>
                    <span className="font-medium">
                      {financialSummary ? Math.round((financialSummary.paidSchools / financialSummary.totalSchools) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg Revenue/School</span>
                    <span className="font-medium">
                      MK {financialSummary ? Math.round(financialSummary.totalRevenue / Math.max(financialSummary.totalSchools, 1)).toLocaleString() : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Collection Rate</span>
                    <span className="font-medium text-green-600">
                      {financialSummary ? Math.round((financialSummary.totalRevenue / (financialSummary.totalRevenue + financialSummary.outstandingAmount)) * 100) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Schools Status Tab */}
          <TabsContent value="schools-status" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Paid Schools */}
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Fully Paid ({allSchoolsData.filter(s => s.billingStatus?.status === 'paid').length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-96 overflow-y-auto">
                  {allSchoolsData.filter(school => school.billingStatus?.status === 'paid').map((school) => (
                    <div key={school.id} className="p-4 border-b border-green-100 hover:bg-green-25">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-green-800">{school.name}</p>
                          <p className="text-sm text-green-600">{school.code}</p>
                          <p className="text-xs text-green-500 mt-1">
                            Revenue: MK {school.totalRevenue?.toLocaleString() || 0}
                          </p>
                        </div>
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                          Paid
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {allSchoolsData.filter(s => s.billingStatus?.status === 'paid').length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No fully paid schools
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Overdue Schools */}
              <Card className="border-red-200">
                <CardHeader className="bg-red-50">
                  <CardTitle className="text-red-800 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Overdue ({allSchoolsData.filter(s => s.billingStatus?.status === 'overdue').length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-96 overflow-y-auto">
                  {allSchoolsData.filter(school => school.billingStatus?.status === 'overdue').map((school) => (
                    <div key={school.id} className="p-4 border-b border-red-100 hover:bg-red-25">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-red-800">{school.name}</p>
                          <p className="text-sm text-red-600">{school.code}</p>
                          <p className="text-xs text-red-500 mt-1">
                            Outstanding: MK {school.outstandingAmount?.toLocaleString() || 0}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          Overdue
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {allSchoolsData.filter(s => s.billingStatus?.status === 'overdue').length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No overdue schools
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Partial Payment Schools */}
              <Card className="border-yellow-200">
                <CardHeader className="bg-yellow-50">
                  <CardTitle className="text-yellow-800 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Partial Payment ({allSchoolsData.filter(s => s.billingStatus?.status === 'partial').length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-96 overflow-y-auto">
                  {allSchoolsData.filter(school => school.billingStatus?.status === 'partial').map((school) => (
                    <div key={school.id} className="p-4 border-b border-yellow-100 hover:bg-yellow-25">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-yellow-800">{school.name}</p>
                          <p className="text-sm text-yellow-600">{school.code}</p>
                          <p className="text-xs text-yellow-500 mt-1">
                            Remaining: MK {school.outstandingAmount?.toLocaleString() || 0}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          Partial
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {allSchoolsData.filter(s => s.billingStatus?.status === 'partial').length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No partial payment schools
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Management</CardTitle>
                <CardDescription>Track and manage payments from all schools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allSchoolsData.map((school) => (
                    <div key={school.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{school.name}</p>
                            <p className="text-sm text-muted-foreground">{school.code}</p>
                          </div>
                          <Badge variant={schoolBillingService.getBillingStatusBadgeVariant(school.billingStatus?.status || 'none')}>
                            {schoolBillingService.getBillingStatusLabel(school.billingStatus?.status || 'none')}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          Revenue: MK {school.totalRevenue?.toLocaleString() || 0}
                        </p>
                        {school.outstandingAmount > 0 && (
                          <p className="text-sm text-red-600">
                            Outstanding: MK {school.outstandingAmount.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {school.outstandingAmount > 0 && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedSchool(school.id);
                              setActiveTab("invoices");
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Manage Payment
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-4">
            {selectedSchool ? (
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle>Invoices for {selectedSchoolData?.name}</CardTitle>
                      <CardDescription>Manage and update invoice payment status</CardDescription>
                    </div>
                    
                    {invoices.some(inv => inv.status !== 'paid' && inv.status !== 'cancelled') && (
                      <Button 
                        onClick={handleMarkAllAsPaid}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark All as Paid
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="issued">Issued</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Term</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Outstanding</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                              <div className="flex flex-col items-center gap-2">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                                <p className="text-muted-foreground">No invoices found</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredInvoices.map((invoice) => {
                            const outstanding = invoice.totalAmount - invoice.amountPaid;
                            return (
                              <TableRow key={invoice.id}>
                                <TableCell className="font-medium">
                                  {invoice.invoiceNumber}
                                </TableCell>
                                <TableCell>{invoice.term}</TableCell>
                                <TableCell>
                                  {schoolBillingService.formatCurrency(invoice.totalAmount, invoice.currency)}
                                </TableCell>
                                <TableCell>
                                  {schoolBillingService.formatCurrency(invoice.amountPaid, invoice.currency)}
                                </TableCell>
                                <TableCell>
                                  <span className={outstanding > 0 ? "text-red-600 font-medium" : ""}>
                                    {schoolBillingService.formatCurrency(outstanding, invoice.currency)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getStatusBadgeVariant(invoice.status)}>
                                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(invoice.dueDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleMarkInvoiceAsPaid(invoice.id, invoice)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      Mark Paid
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Select a School</h3>
                    <p className="text-muted-foreground">
                      Choose a school from the payments tab or search above to view its invoices
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                  <CardDescription>Monthly revenue performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-blue-700">This Month</p>
                        <p className="text-2xl font-bold text-blue-800">
                          MK {financialSummary?.monthlyRevenue?.toLocaleString() || 0}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-700">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-800">
                          MK {financialSummary?.totalRevenue?.toLocaleString() || 0}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Distribution</CardTitle>
                  <CardDescription>School payment status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm">Fully Paid</span>
                      </div>
                      <span className="font-medium">{financialSummary?.paidSchools || 0} schools</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-sm">Partial Payment</span>
                      </div>
                      <span className="font-medium">{financialSummary?.partialSchools || 0} schools</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm">Overdue</span>
                      </div>
                      <span className="font-medium">{financialSummary?.overdueSchools || 0} schools</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}