import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getActiveAcademicCalendar, listTerms, getFinanceSummary, getTransactions, TermDto } from "@/services/financeService";
import { Loader2, RefreshCcw } from "lucide-react";
import { StudentFinancialDetailsModal } from "@/components/StudentFinancialDetailsModal";

function formatMK(amount: number) {
  const v = Number(amount || 0);
  return `MK ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Finance() {
  const [calendar, setCalendar] = useState<{ id?: string; term?: string } | null>(null);
  const [terms, setTerms] = useState<TermDto[]>([]);
  const [termId, setTermId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<{ transactions: any[]; pagination: any } | null>(null);

  // Student Financial Details Modal
  const [showFinancialDetailsModal, setShowFinancialDetailsModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);

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
      const s = await getFinanceSummary(termId, academicCalendarId);
      setSummary(s);
      const tx = await getTransactions(1, 20, termId, academicCalendarId);
      setTransactions(tx);
    } catch (e) {
      console.error("Failed to load finance summary", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (termId !== undefined) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termId, academicCalendarId]);

  const totals = summary?.summary;
  const hasData = !!(totals && (totals.totalFeesPaid || totals.expectedFees || totals.pending));

  return (
    <AdminLayout title="Finance" subtitle="Filter-driven financial overview">
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
              <Select value={academicCalendarId || ""} onValueChange={() => { /* For now active-only */ }} disabled>
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
              <Button variant="outline" onClick={refresh} disabled={loading || !termId}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Fees Paid</CardTitle>
              <CardDescription className="text-xs">{summary?.labels?.currentTermFigures || "Current Term Figures"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMK(totals?.totalFeesPaid || 0)}</div>
              {!hasData && <p className="text-xs text-muted-foreground">MK 0.00 — No records for selected term</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expected Fees Amount</CardTitle>
              <CardDescription className="text-xs">Derived from fee assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMK(totals?.expectedFees || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <CardDescription className="text-xs">Selected term only</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMK(totals?.pending || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <CardDescription className="text-xs">{summary?.labels?.outstandingFromPreviousTerms || "Outstanding From Previous Terms"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMK(totals?.overdue || 0)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fee Statuses</CardTitle>
            <CardDescription>Per-student expected vs paid amounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Search student...</div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Term</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(summary?.statuses || []).map((s: any) => (
                  <TableRow 
                    key={`${s.studentId}-${s.termId}`}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setSelectedStudentId(s.studentId);
                      setSelectedStudentName(s.studentName);
                      setShowFinancialDetailsModal(true);
                    }}
                  >
                    <TableCell className="font-medium">{s.studentName}</TableCell>
                    <TableCell>{s.humanId || s.studentId}</TableCell>
                    <TableCell className="text-right">{formatMK(s.totalExpected)}</TableCell>
                    <TableCell className="text-right">{formatMK(s.totalPaid)}</TableCell>
                    <TableCell className="text-right">{formatMK(s.outstanding)}</TableCell>
                    <TableCell>{s.status === 'paid' ? 'paid' : s.status === 'partial' ? 'partial' : 'unpaid'}</TableCell>
                    <TableCell>{s.term || 'Current Term'}</TableCell>
                  </TableRow>
                ))}
                {(!summary?.statuses || summary?.statuses.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">No student records for selected term</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Search student...</CardDescription>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Export</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Txn ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Term</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(transactions?.transactions || []).map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.id?.slice(-8) || '—'}</TableCell>
                    <TableCell>{t.paymentDate ? new Date(t.paymentDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{t.studentName}</TableCell>
                    <TableCell>{t.studentId || '—'}</TableCell>
                    <TableCell>{t.paymentType || 'Tuition'}</TableCell>
                    <TableCell>{formatMK(t.amount)}</TableCell>
                    <TableCell>{t.paymentMethod || 'cash'}</TableCell>
                    <TableCell>
                      {t.receiptNumber && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/v1/receipts/${t.id}`, '_blank')}
                        >
                          Print
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>{t.term || '—'}</TableCell>
                  </TableRow>
                ))}
                {(!transactions?.transactions || transactions?.transactions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">No records for selected term</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Student Financial Details Modal */}
      <StudentFinancialDetailsModal
        open={showFinancialDetailsModal}
        onClose={() => {
          setShowFinancialDetailsModal(false);
          setSelectedStudentId(null);
          setSelectedStudentName(null);
        }}
        studentId={selectedStudentId || ''}
        studentName={selectedStudentName || ''}
        academicCalendarId={academicCalendarId}
        termId={termId}
      />
    </AdminLayout>
  );
}
