import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, MoreVertical, Users, BookOpen, TrendingUp, Eye, Copy, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [schools, setSchools] = useState<School[]>([]);
  const [credentials, setCredentials] = useState<SchoolAdminCredentials[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newSchool, setNewSchool] = useState<CreateSchoolRequest>({ name: "", code: "" });
  const [editSchool, setEditSchool] = useState<School | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCredentials, setShowCredentials] = useState(false);
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
      
      // Handle both array response and structured response
      if (Array.isArray(data)) {
        setSchools(data);
        setTotal(data.length);
        setCurrentPage(1);
        setTotalPages(1);
      } else {
        setSchools(data.schools || data.data || []);
        setTotal(data.total || data.count || 0);
        setCurrentPage(data.page || 1);
        setTotalPages(Math.ceil((data.total || data.count || 0) / (data.limit || 10)));
      }
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

  return (
    <AdminLayout title="Schools" subtitle="Manage all schools in the system">
      <div className="space-y-6">
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
                  <Button onClick={() => setShowAdd(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add School
                  </Button>
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
                      schools.map((school) => (
                        <TableRow key={school.id}>
                          <TableCell className="font-medium">{school.name}</TableCell>
                          <TableCell className="font-mono text-sm">{school.code}</TableCell>
                          <TableCell>
                            <Badge variant={["Active", "ACTIVE"].includes(school.status) ? "default" : "destructive"}>
                              {school.status}
                            </Badge>
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
                                <DropdownMenuItem 
                                  onClick={() => ["Active", "ACTIVE"].includes(school.status) ? handleSuspend(school.id) : handleActivate(school.id)} 
                                  className={["Active", "ACTIVE"].includes(school.status) ? "text-destructive" : "text-green-600"}
                                >
                                  {["Active", "ACTIVE"].includes(school.status) ? "Suspend" : "Activate"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
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
      </div>
    </AdminLayout>
  );
};

export default Schools;
