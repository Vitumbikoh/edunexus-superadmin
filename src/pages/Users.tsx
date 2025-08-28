import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, MoreVertical, Users as UsersIcon, UserCheck, UserX, Crown, Eye, EyeOff, RotateCcw, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getSchoolCredentials, API_BASE } from "@/lib/utils";

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

interface CredentialsResponse {
  credentials: SchoolAdminCredentials[];
  total: number;
  page: number;
  limit: number;
}

const Users = () => {
  const [credentials, setCredentials] = useState<SchoolAdminCredentials[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  const fetchCredentials = async (page = 1, search = "") => {
    try {
      setLoading(true);
      
      // Use the utility function to get school credentials
      const data = await getSchoolCredentials();
      
      // Handle different response formats - check if it's an array or has credentials property
      let credentialsData: SchoolAdminCredentials[] = [];
      
      if (Array.isArray(data)) {
        credentialsData = data;
      } else if (data && Array.isArray(data.credentials)) {
        credentialsData = data.credentials;
      } else if (data && data.data && Array.isArray(data.data)) {
        credentialsData = data.data;
      }
      
      // Filter by search term if provided
      if (search) {
        const searchLower = search.toLowerCase();
        credentialsData = credentialsData.filter(credential => 
          credential.schoolName.toLowerCase().includes(searchLower) ||
          credential.schoolCode.toLowerCase().includes(searchLower) ||
          credential.username.toLowerCase().includes(searchLower) ||
          credential.email.toLowerCase().includes(searchLower)
        );
      }
      
      // Simple pagination (client-side for now)
      const limit = 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = credentialsData.slice(startIndex, endIndex);
      
      setCredentials(paginatedData);
      setTotal(credentialsData.length);
      setCurrentPage(page);
      setTotalPages(Math.ceil(credentialsData.length / limit));
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch school admin credentials",
        variant: "destructive",
      });
      console.error('Error fetching credentials:', error);
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials(currentPage, searchTerm);
  }, [currentPage]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    fetchCredentials(1, value);
  };

  const togglePasswordVisibility = (credentialId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId]
    }));
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
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

  const resetPassword = async (schoolId: string) => {
    try {
      const response = await fetch(`${API_BASE}/schools/${schoolId}/credentials/reset-password`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reset password');
      }

      const data = await response.json();
      
      toast({
        title: "Password Reset",
        description: `Password reset successfully. New password: ${data.newPassword}`,
      });

      // Refresh the credentials list
      fetchCredentials(currentPage, searchTerm);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      });
      console.error('Error resetting password:', error);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const activeCount = credentials.filter(c => c.isActive).length;
  const passwordChangedCount = credentials.filter(c => c.passwordChanged).length;
  const inactiveCount = credentials.filter(c => !c.isActive).length;

  return (
    <AdminLayout title="School Admin Credentials" subtitle="Manage school administrator credentials">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : total}</div>
              <p className="text-xs text-muted-foreground">Schools with admin credentials</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : activeCount}</div>
              <p className="text-xs text-muted-foreground">Active admin accounts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Password Changed</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : passwordChangedCount}</div>
              <p className="text-xs text-muted-foreground">Changed default password</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Admins</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : inactiveCount}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Credentials Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>School Admin Credentials</CardTitle>
                <CardDescription>View and manage school administrator login credentials</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search schools, usernames, emails..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            
            {loading ? (
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
                      <TableHead>School & Admin</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Password Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credentials.map((credential) => (
                      <TableRow key={credential.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="" alt={credential.schoolName} />
                              <AvatarFallback>{getInitials(credential.schoolName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{credential.schoolName}</div>
                              <div className="text-sm text-muted-foreground">
                                {credential.schoolCode} • {credential.email}
                              </div>
                            </div>
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
                            <span className="font-mono text-sm">
                              {showPasswords[credential.id] ? credential.password : '••••••••'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePasswordVisibility(credential.id)}
                              className="h-6 w-6 p-0"
                            >
                              {showPasswords[credential.id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
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
                          <div className="text-sm">
                            {new Date(credential.createdAt).toLocaleDateString()}
                          </div>
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
                                  `Username: ${credential.username}\nEmail: ${credential.email}\nPassword: ${credential.password}`,
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
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, total)} of {total} schools
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
      </div>
    </AdminLayout>
  );
};

export default Users;