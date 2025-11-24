import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [allSchoolsData, setAllSchoolsData] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([]);
  const { toast } = useToast();

  // Load all data on component mount - no school selection needed
  useEffect(() => {
    loadAllBillingData();
  }, []);

  const loadAllBillingData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSchools(),
        fetchBillingPlans(),
        fetchAllSchoolsBillingData(),
      ]);
    } catch (error) {
      console.error('Failed to load billing data:', error);
      toast({
        title: "Error",
        description: "Failed to load billing data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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



  const fetchAllSchoolsBillingData = async () => {
    try {
      const schoolsList = schools.length > 0 ? schools : await fetchSchools();
      const billingPromises = schoolsList.map(async (school) => {
        try {
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
        } catch (error) {
          console.error(`Failed to fetch billing data for school ${school.name}:`, error);
          return {
            ...school,
            billingStatus: { status: 'unknown' },
            invoices: [],
            totalRevenue: 0,
            outstandingAmount: 0,
            lastPayment: null
          };
        }
      });

      const schoolsWithBilling = await Promise.all(billingPromises);
      setAllSchoolsData(schoolsWithBilling);
      
      // Calculate financial summary from the data
      calculateFinancialSummary(schoolsWithBilling);
    } catch (error) {
      console.error('Failed to fetch all schools billing data:', error);
      toast({
        title: "Error",
        description: "Failed to load comprehensive billing data",
        variant: "destructive",
      });
    }
  };

  const calculateFinancialSummary = (schoolsData: any[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const summary = {
      totalRevenue: schoolsData.reduce((sum, school) => sum + (school.totalRevenue || 0), 0),
      monthlyRevenue: schoolsData.reduce((sum, school) => {
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
      outstandingAmount: schoolsData.reduce((sum, school) => sum + (school.outstandingAmount || 0), 0),
      totalSchools: schoolsData.length,
      paidSchools: schoolsData.filter(school => school.billingStatus?.status === 'paid').length,
      overdueSchools: schoolsData.filter(school => school.billingStatus?.status === 'overdue').length,
      partialSchools: schoolsData.filter(school => school.billingStatus?.status === 'partial').length,
      recentPayments: schoolsData
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
  };

  const handleMarkInvoiceAsPaid = async (invoiceId: string, invoice: Invoice) => {
    if (!confirm(`Mark invoice ${invoice.invoiceNumber} as paid?`)) return;

    try {
      await schoolBillingService.markInvoiceAsPaid(invoiceId, invoice.totalAmount);
      
      toast({
        title: "Invoice Updated",
        description: `Invoice ${invoice.invoiceNumber} marked as paid`,
      });

      // Refresh all billing data
      await loadAllBillingData();
    } catch (error: any) {
      console.error('Failed to mark invoice as paid:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'paid': return 'default';
      case 'partial': return 'secondary';
      case 'overdue': return 'destructive';
      case 'issued': return 'outline';
      default: return 'secondary';
    }
  };

  // Filter schools based on search and status
  const filteredSchools = allSchoolsData.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(search.toLowerCase()) ||
                         school.code.toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && school.billingStatus?.status === statusFilter;
  });

  return (
    <AdminLayout title="Billing Management" subtitle="Manage school billing, invoices, and payment status">
      <div className="space-y-6">
        {/* Enhanced Header with Financial Overview */}
        {/* Header with refresh button */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={loadAllBillingData} 
              disabled={loading}
            >
              <RotateCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/finance/billing">
                <FileText className="mr-2 h-4 w-4" />
                Classic Billing
              </Link>
            </Button>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            // Loading skeletons
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-6 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </>
          ) : financialSummary ? (
            <>
              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">MK {financialSummary.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    This Month
                  </CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">MK {financialSummary.monthlyRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Current month revenue</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Outstanding
                  </CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">MK {financialSummary.outstandingAmount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Pending payments</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Schools
                  </CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <School className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{financialSummary.totalSchools}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total active schools</p>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="col-span-full p-6 border rounded-lg text-center text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load financial statistics</p>
            </div>
          )}
        </div>



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
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                          <div>
                            <p className="font-medium">{payment.schoolName}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(payment.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Fully Paid ({allSchoolsData.filter(s => s.billingStatus?.status === 'paid').length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-96 overflow-y-auto">
                  {allSchoolsData.filter(school => school.billingStatus?.status === 'paid').map((school) => (
                    <div key={school.id} className="p-4 border-b hover:bg-muted/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{school.name}</p>
                          <p className="text-sm text-muted-foreground">{school.code}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Revenue: MK {school.totalRevenue?.toLocaleString() || 0}
                          </p>
                        </div>
                        <Badge variant="default">
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Overdue ({allSchoolsData.filter(s => s.billingStatus?.status === 'overdue').length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-96 overflow-y-auto">
                  {allSchoolsData.filter(school => school.billingStatus?.status === 'overdue').map((school) => (
                    <div key={school.id} className="p-4 border-b hover:bg-muted/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{school.name}</p>
                          <p className="text-sm text-muted-foreground">{school.code}</p>
                          <p className="text-xs text-muted-foreground mt-1">
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Partial Payment ({allSchoolsData.filter(s => s.billingStatus?.status === 'partial').length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-96 overflow-y-auto">
                  {allSchoolsData.filter(school => school.billingStatus?.status === 'partial').map((school) => (
                    <div key={school.id} className="p-4 border-b hover:bg-muted/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{school.name}</p>
                          <p className="text-sm text-muted-foreground">{school.code}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Remaining: MK {school.outstandingAmount?.toLocaleString() || 0}
                          </p>
                        </div>
                        <Badge variant="secondary">
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
                              setActiveTab("invoices");
                              // Auto-scroll to school's section in invoices tab
                              setTimeout(() => {
                                document.getElementById(`school-${school.id}`)?.scrollIntoView({ behavior: 'smooth' });
                              }, 100);
                            }}
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
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>All School Invoices</CardTitle>
                    <CardDescription>Comprehensive invoice management across all schools</CardDescription>
                  </div>
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
                  <div className="space-y-6">
                    {filteredSchools.map((school) => (
                      <div key={school.id} id={`school-${school.id}`} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{school.name}</h3>
                            <p className="text-sm text-muted-foreground">{school.code}</p>
                          </div>
                          <Badge variant={schoolBillingService.getBillingStatusBadgeVariant(school.billingStatus?.status || 'none')}>
                            {schoolBillingService.getBillingStatusLabel(school.billingStatus?.status || 'none')}
                          </Badge>
                        </div>
                        
                        {school.invoices && school.invoices.length > 0 ? (
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
                              {school.invoices
                                .filter(invoice => statusFilter === "all" || invoice.status === statusFilter)
                                .map((invoice) => {
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
                                          >
                                            <CheckCircle className="mr-1 h-3 w-3" />
                                            Mark Paid
                                          </Button>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            No invoices found for this school
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {filteredSchools.length === 0 && (
                      <div className="text-center py-8">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No schools found</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
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
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">This Month</p>
                        <p className="text-2xl font-bold">
                          MK {financialSummary?.monthlyRevenue?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold">
                          MK {financialSummary?.totalRevenue?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <DollarSign className="h-4 w-4 text-primary" />
                      </div>
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
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="text-sm">Fully Paid</span>
                      </div>
                      <span className="font-medium">{financialSummary?.paidSchools || 0} schools</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
                        <span className="text-sm">Partial Payment</span>
                      </div>
                      <span className="font-medium">{financialSummary?.partialSchools || 0} schools</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-destructive"></div>
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