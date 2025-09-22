import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, RefreshCcw, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { formatCurrency, getDefaultCurrency } from "@/lib/currency";

// Placeholder financial data (to be wired to API later)
const mockRevenue = [
  { month: "Jan", tuition: 42000, fees: 8500, other: 2400 },
  { month: "Feb", tuition: 46000, fees: 9100, other: 2100 },
  { month: "Mar", tuition: 50000, fees: 9400, other: 2600 },
];

export default function FinancialReports() {
  const [loading, setLoading] = useState(false);

  return (
    <AdminLayout title="Financial Reports" subtitle="Comprehensive financial analytics and insights">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue (YTD)</CardTitle>
              <CardDescription className="text-xs">All income streams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(312450, getDefaultCurrency())}</div>
              <p className="text-xs text-green-600 flex items-center"><TrendingUp className="h-3 w-3 mr-1" />+8.4% vs last year</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
              <CardDescription className="text-xs">Pending payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(27300, getDefaultCurrency())}</div>
              <p className="text-xs text-muted-foreground">Across 143 invoices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Collections Rate</CardTitle>
              <CardDescription className="text-xs">Paid vs billed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92.4%</div>
              <p className="text-xs text-green-600">Healthy</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expense Ratio</CardTitle>
              <CardDescription className="text-xs">Expenses / Revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">41.7%</div>
              <p className="text-xs text-green-600">Optimized</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Streams</TabsTrigger>
            <TabsTrigger value="aging">Aging</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>High-level financial performance snapshot</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Revenue growth remains stable with healthy collections and controlled expense ratios.</p>
                <p>Tuition continues to be the dominant income source while auxiliary fees show modest growth.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardTitle>Monthly Revenue Breakdown</CardTitle>
                  <CardDescription>Tuition vs fees vs other income</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setLoading(true)} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Tuition</TableHead>
                      <TableHead className="text-right">Fees</TableHead>
                      <TableHead className="text-right">Other</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockRevenue.map(r => (
                      <TableRow key={r.month}>
                        <TableCell className="font-medium">{r.month}</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.tuition, getDefaultCurrency())}</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.fees, getDefaultCurrency())}</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.other, getDefaultCurrency())}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(r.tuition + r.fees + r.other, getDefaultCurrency())}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aging" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Receivables Aging</CardTitle>
                <CardDescription>Breakdown of outstanding balances by aging bucket</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Coming soon: 0-30, 31-60, 61-90, 90+ day buckets.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Expense Analysis</CardTitle>
                <CardDescription>Operating expenses composition and trends</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Coming soon: salaries, utilities, maintenance, procurement categories.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
