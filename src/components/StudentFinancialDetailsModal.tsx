import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, User, CreditCard, Receipt, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { API_BASE } from '@/lib/utils';

interface StudentFinancialDetailsModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName?: string;
  academicCalendarId?: string;
  termId?: string;
}

interface StudentFinancialDetails {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    email?: string;
    className: string;
  };
  summary: {
    totalExpectedAllTerms: number;
    totalPaidAllTerms: number;
    totalOutstandingAllTerms: number;
    creditBalance: number;
    paymentPercentage: number;
  };
  termBreakdown: Array<{
    termId: string;
    termNumber: number;
    academicYear: string;
    startDate: string;
    endDate: string;
    expectedMandatory: number;
    expectedOptional: number;
    totalExpected: number;
    totalPaid: number;
    outstanding: number;
    status: 'paid' | 'partial' | 'unpaid';
    isCurrentTerm: boolean;
    isPastTerm: boolean;
    paymentCount: number;
    lastPaymentDate?: string;
    feeStructures: Array<{
      feeType: string;
      amount: number;
      isOptional: boolean;
      frequency: string;
    }>;
  }>;
  transactionHistory: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    paymentType: string;
    paymentMethod: string;
    receiptNumber?: string;
    termId: string;
    termNumber?: number;
    academicYear?: string;
    status: string;
    processedBy: string;
  }>;
  historicalData: Array<{
    termId: string;
    termNumber: number;
    academicYear: string;
    totalExpected: number;
    totalPaid: number;
    outstandingAmount: number;
    status: string;
  }>;
  metadata: {
    lastUpdated: string;
    academicCalendarId?: string;
    schoolId?: string;
  };
}

function formatMK(amount: number) {
  const v = Number(amount || 0);
  return `MK ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function StudentFinancialDetailsModal({ 
  open, 
  onClose, 
  studentId, 
  studentName, 
  academicCalendarId,
  termId
}: StudentFinancialDetailsModalProps) {
  const [details, setDetails] = useState<StudentFinancialDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchStudentFinancialDetails = async () => {
    if (!studentId || !open) return;

    setLoading(true);
    setError(null);

    try {
      const storedToken = localStorage.getItem('token') || localStorage.getItem('access_token');
      if (!storedToken) {
        throw new Error('No authentication token found');
      }

      let url = `${API_BASE}/finance/student-financial-details/${studentId}`;
      const params = new URLSearchParams();
      if (academicCalendarId) params.append('academicCalendarId', academicCalendarId);
      if (termId) params.append('termId', termId);
      const q = params.toString();
      if (q) url += `?${q}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch student financial details: ${response.statusText}`);
      }

      const data = await response.json();
      setDetails(data);
    } catch (err) {
      console.error('Error fetching student financial details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student financial details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentFinancialDetails();
  }, [studentId, open, academicCalendarId]);

  const getStatusBadge = (status: string, outstanding: number = 0) => {
    const variant = status === 'paid' 
      ? 'default' 
      : status === 'unpaid' && outstanding > 0
        ? 'destructive'
        : 'outline';
    
    const className = status === 'paid'
      ? 'bg-green-100 text-green-800 border-green-200'
      : status === 'unpaid' && outstanding > 0
        ? 'bg-red-100 text-red-800 border-red-200'
        : 'bg-yellow-100 text-yellow-800 border-yellow-200';

    return (
      <Badge variant={variant} className={`capitalize ${className}`}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Financial Details - {studentName || details?.student?.firstName + ' ' + details?.student?.lastName || 'Student'}
          </DialogTitle>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Please login to view financial details.</span>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading financial details...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        ) : details ? (
          <ScrollArea className="max-h-[calc(90vh-100px)]">
            <div className="space-y-6">
              {/* Student Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Student Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p className="text-lg font-semibold">
                        {details.student.firstName} {details.student.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Student ID</p>
                      <p className="text-lg font-semibold">{details.student.studentId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Class</p>
                      <p className="text-lg font-semibold">{details.student.className}</p>
                    </div>
                    {details.student.email && (
                      <div className="md:col-span-3">
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="text-lg">{details.student.email}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Expected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatMK(details.summary.totalExpectedAllTerms)}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Paid</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      {formatMK(details.summary.totalPaidAllTerms)}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Outstanding</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-600">
                      {formatMK(details.summary.totalOutstandingAllTerms)}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Payment %
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-purple-600">
                      {details.summary.paymentPercentage}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {details.summary.creditBalance > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <CreditCard className="h-5 w-5" />
                      Credit Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-semibold text-green-700">
                      {formatMK(details.summary.creditBalance)}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Detailed Information Tabs */}
              <Tabs defaultValue="terms" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="terms">Term Breakdown</TabsTrigger>
                  <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                  <TabsTrigger value="historical">Historical Data</TabsTrigger>
                  <TabsTrigger value="fees">Fee Structures</TabsTrigger>
                </TabsList>

                <TabsContent value="terms" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Term-by-Term Breakdown
                      </CardTitle>
                      <CardDescription>
                        Financial status across all terms
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {details.termBreakdown.map((term) => (
                          <div key={term.termId} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-semibold flex items-center gap-2">
                                  Term {term.termNumber} - {term.academicYear}
                                  {term.isCurrentTerm && (
                                    <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                                      Current
                                    </Badge>
                                  )}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(term.startDate)} - {formatDate(term.endDate)}
                                </p>
                              </div>
                              {getStatusBadge(term.status, term.outstanding)}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Expected</p>
                                <p className="font-semibold">
                                  {formatMK(term.totalExpected)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Paid</p>
                                <p className="font-semibold text-green-600">
                                  {formatMK(term.totalPaid)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                                <p className="font-semibold text-red-600">
                                  {formatMK(term.outstanding)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Payments</p>
                                <p className="font-semibold">{term.paymentCount}</p>
                                {term.lastPaymentDate && (
                                  <p className="text-xs text-muted-foreground">
                                    Last: {formatDate(term.lastPaymentDate)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Transaction History
                      </CardTitle>
                      <CardDescription>
                        All payment transactions across all terms
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {details.transactionHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Payment Type</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Receipt</TableHead>
                                <TableHead>Term</TableHead>
                                <TableHead>Processed By</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {details.transactionHistory.map((transaction) => (
                                <TableRow key={transaction.id}>
                                  <TableCell>{formatDate(transaction.paymentDate)}</TableCell>
                                  <TableCell className="font-semibold">
                                    {formatMK(transaction.amount)}
                                  </TableCell>
                                  <TableCell>{transaction.paymentType}</TableCell>
                                  <TableCell>{transaction.paymentMethod}</TableCell>
                                  <TableCell>
                                    {transaction.receiptNumber || '-'}
                                  </TableCell>
                                  <TableCell>
                                    Term {transaction.termNumber} - {transaction.academicYear}
                                  </TableCell>
                                  <TableCell>{transaction.processedBy}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No transactions found
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="historical" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Historical Data</CardTitle>
                      <CardDescription>
                        Archived financial records from closed terms
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {details.historicalData.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Term</TableHead>
                                <TableHead>Academic Year</TableHead>
                                <TableHead className="text-right">Expected</TableHead>
                                <TableHead className="text-right">Paid</TableHead>
                                <TableHead className="text-right">Outstanding</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {details.historicalData.map((record, index) => (
                                <TableRow key={index}>
                                  <TableCell>Term {record.termNumber}</TableCell>
                                  <TableCell>{record.academicYear}</TableCell>
                                  <TableCell className="text-right">
                                    {formatMK(record.totalExpected)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatMK(record.totalPaid)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatMK(record.outstandingAmount)}
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(record.status, record.outstandingAmount)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No historical data found
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="fees" className="space-y-4">
                  <div className="space-y-4">
                    {details.termBreakdown.map((term) => (
                      <Card key={term.termId}>
                        <CardHeader>
                          <CardTitle>
                            Term {term.termNumber} - {term.academicYear} Fee Structure
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {term.feeStructures.length > 0 ? (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Fee Type</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Frequency</TableHead>
                                    <TableHead>Type</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {term.feeStructures.map((fee, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">{fee.feeType}</TableCell>
                                      <TableCell className="text-right">
                                        {formatMK(fee.amount)}
                                      </TableCell>
                                      <TableCell>{fee.frequency}</TableCell>
                                      <TableCell>
                                        <Badge variant={fee.isOptional ? 'outline' : 'default'}>
                                          {fee.isOptional ? 'Optional' : 'Mandatory'}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              No fee structures defined for this term
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}