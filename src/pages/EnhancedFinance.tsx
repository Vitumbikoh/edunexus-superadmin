import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  RefreshCcw, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight
} from "lucide-react";

import { getActiveAcademicCalendar, listTerms, TermDto } from "@/services/financeService";
import { 
  enhancedFinanceService,
  StudentFeeStatus,
  TermFinanceSummary,
  OverdueAnalysis
} from "@/services/enhancedFinanceService";

function formatMK(amount: number) {
  const v = Number(amount || 0);
  return `MK ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'paid': return 'default';
    case 'partial': return 'secondary';
    case 'unpaid': return 'destructive';
    case 'overpaid': return 'outline';
    default: return 'secondary';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'paid': return <CheckCircle className="h-4 w-4" />;
    case 'partial': return <Clock className="h-4 w-4" />;
    case 'unpaid': return <AlertTriangle className="h-4 w-4" />;
    case 'overpaid': return <TrendingUp className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
}

export default function EnhancedFinance() {
  const [calendar, setCalendar] = useState<{ id?: string; term?: string } | null>(null);
  const [terms, setTerms] = useState<TermDto[]>([]);
  const [termId, setTermId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<TermFinanceSummary | null>(null);
  const [feeStatuses, setFeeStatuses] = useState<StudentFeeStatus[]>([]);
  const [overdueAnalysis, setOverdueAnalysis] = useState<OverdueAnalysis[]>([]);
  const [activeTab, setActiveTab] = useState('summary');

  // Load active calendar and terms on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cal = await getActiveAcademicCalendar();
        if (mounted) setCalendar(cal);
        const t = await listTerms(cal?.id);
        if (mounted) setTerms(t);
        const current = t.find((x) => x.isCurrent) || t[0];
        if (mounted) setTermId(current?.id);
      } catch (e) {
        console.error("Failed to initialize finance filters", e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const academicCalendarId = useMemo(() => calendar?.id, [calendar]);

  async function refresh() {
    if (!termId) return;
    setLoading(true);
    try {
      // Load summary and fee statuses
      const [summaryData, statusesData] = await Promise.all([
        enhancedFinanceService.getFinanceSummary(termId, academicCalendarId),
        enhancedFinanceService.getFeeStatuses(termId, academicCalendarId)
      ]);
      
      setSummary(summaryData);
      setFeeStatuses(statusesData);

      // Load overdue analysis if we're viewing historical data
      if (summaryData.isTermCompleted) {
        const overdueData = await enhancedFinanceService.getOverdueAnalysis();
        setOverdueAnalysis(overdueData);
      }
    } catch (e) {
      console.error("Failed to load enhanced finance data", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (termId !== undefined) {
      refresh();
    }
  }, [termId, academicCalendarId]);

  return (
    <AdminLayout title="Enhanced Finance Management">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Academic Calendar and Term control all data displayed</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Academic Calendar</div>
              <Select value={academicCalendarId || ""} disabled>
                <SelectTrigger>
                  <SelectValue placeholder={calendar?.term || "Active Calendar"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={academicCalendarId || "active"}>{calendar?.term || "Active Calendar"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Term</div>
              <Select value={termId || ""} onValueChange={(v) => setTermId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder={"Select term"} />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.term} • {t.periodName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={refresh} disabled={loading} variant="outline" className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {summary && (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary.studentsFullyPaid} paid • {summary.studentsPartiallyPaid} partial • {summary.studentsUnpaid} unpaid
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expected Fees</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatMK(summary.expectedAmount)}</div>
                  <p className="text-xs text-muted-foreground">
                    Current: {formatMK(summary.currentTermFeesAmount)} • Carried: {formatMK(summary.totalCarryForwardAmount)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatMK(summary.paidAmount)}</div>
                  <Progress value={summary.paymentPercentage} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.paymentPercentage.toFixed(1)}% of expected fees
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatMK(summary.outstandingAmount)}</div>
                  {summary.isTermCompleted && summary.overdueAmount > 0 && (
                    <p className="text-xs text-destructive mt-1">
                      {formatMK(summary.overdueAmount)} overdue
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Avg per student: {formatMK(summary.averagePaymentPerStudent)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Term Status Alert */}
            {summary.isTermCompleted && summary.studentsOverdue > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  This term has ended with {summary.studentsOverdue} students having overdue balances totaling {formatMK(summary.overdueAmount)}.
                </AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Fee Statuses</TabsTrigger>
                <TabsTrigger value="overdue">Overdue Analysis</TabsTrigger>
                <TabsTrigger value="carryforward">Carry Forward</TabsTrigger>
              </TabsList>

              {/* Fee Statuses Tab */}
              <TabsContent value="summary" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Fee Statuses</CardTitle>
                    <CardDescription>
                      Detailed breakdown of expected vs paid amounts per student
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Expected</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Outstanding</TableHead>
                          <TableHead className="text-right">Current Term</TableHead>
                          <TableHead className="text-right">Carried Forward</TableHead>
                          <TableHead className="text-center">Progress</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feeStatuses.map((status) => (
                          <TableRow key={status.studentId}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{status.studentName}</div>
                                <div className="text-xs text-muted-foreground">{status.humanId}</div>
                              </div>
                            </TableCell>
                            <TableCell>{status.className || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(status.status)} className="flex items-center gap-1">
                                {getStatusIcon(status.status)}
                                {status.status.toUpperCase()}
                              </Badge>
                              {status.isOverdue && (
                                <Badge variant="destructive" className="ml-1 text-xs">
                                  OVERDUE
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{formatMK(status.expectedAmount)}</TableCell>
                            <TableCell className="text-right">{formatMK(status.paidAmount)}</TableCell>
                            <TableCell className="text-right">
                              <span className={status.outstandingAmount > 0 ? "text-destructive" : "text-muted-foreground"}>
                                {formatMK(status.outstandingAmount)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">{formatMK(status.currentTermFees)}</TableCell>
                            <TableCell className="text-right">
                              {status.carryForwardAmount > 0 ? (
                                <span className="text-orange-600">{formatMK(status.carryForwardAmount)}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="w-16">
                                <Progress value={status.paymentPercentage} className="h-2" />
                                <div className="text-xs text-muted-foreground mt-1">
                                  {status.paymentPercentage.toFixed(0)}%
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {feeStatuses.length === 0 && !loading && (
                      <div className="text-center py-8 text-muted-foreground">
                        No student fee data available for this term
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Overdue Analysis Tab */}
              <TabsContent value="overdue" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Overdue Balance Analysis</CardTitle>
                    <CardDescription>
                      Students with outstanding balances from completed terms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {overdueAnalysis.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead className="text-right">Total Overdue</TableHead>
                            <TableHead>Overdue Terms</TableHead>
                            <TableHead className="text-center">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {overdueAnalysis.map((analysis) => (
                            <TableRow key={analysis.studentId}>
                              <TableCell className="font-medium">{analysis.studentName}</TableCell>
                              <TableCell className="text-right">
                                <span className="text-destructive font-semibold">
                                  {formatMK(analysis.totalOverdueAmount)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {analysis.overdueTerms.map((term) => (
                                    <div key={term.termId} className="text-xs">
                                      <Badge variant="outline" className="mr-2">
                                        {term.termName}
                                      </Badge>
                                      {formatMK(term.amount)} • {term.daysPastDue} days overdue
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-green-700">No Overdue Balances</h3>
                        <p className="text-muted-foreground">All students are up to date with their payments!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Carry Forward Tab */}
              <TabsContent value="carryforward" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Balance Carry Forward Management</CardTitle>
                    <CardDescription>
                      Manage outstanding balances between academic terms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <ArrowRight className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Carry Forward Operations</h3>
                      <p className="text-muted-foreground mb-4">
                        This feature allows you to carry outstanding balances from completed terms to new terms.
                      </p>
                      <Button variant="outline" disabled>
                        Configure Carry Forward
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {!summary && !loading && termId && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                No financial data available for the selected term.
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card>
            <CardContent className="py-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                Loading enhanced finance data...
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}