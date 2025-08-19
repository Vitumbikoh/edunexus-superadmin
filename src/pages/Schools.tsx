import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, MoreVertical, Users, BookOpen, TrendingUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  listSchools,
  createSchool,
  updateSchool,
  suspendSchool,
  activateSchool,
} from "@/lib/utils";

type School = {
  id: string;
  name: string;
  code: string;
  status: string;
  students?: number;
  teachers?: number;
  established?: string;
  metadata?: any;
};


const Schools = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: "", code: "" });
  const [editSchool, setEditSchool] = useState<School | null>(null);

  const fetchSchools = async (searchTerm = "") => {
    setLoading(true);
    try {
      const data = await listSchools(searchTerm);
      setSchools(data?.schools || data || []);
    } catch (err: any) {
      console.error('Failed to fetch schools', err);
      alert(err?.message || 'Failed to fetch schools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    fetchSchools(e.target.value);
  };

  const handleAddSchool = async () => {
    if (!newSchool.name.trim() || !newSchool.code.trim()) {
      alert('Please provide both school name and code');
      return;
    }
    setLoading(true);
    try {
      const created = await createSchool(newSchool);
      console.log('Created school', created);
      setShowAdd(false);
      setNewSchool({ name: "", code: "" });
      await fetchSchools();
    } catch (err: any) {
      console.error('Create school failed', err);
      alert(err?.message || 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSchool = async () => {
    if (!editSchool) return;
    if (!editSchool.name?.trim() || !editSchool.code?.trim()) {
      alert('Please provide both school name and code');
      return;
    }
    setLoading(true);
    try {
      await updateSchool(editSchool.id, editSchool);
      setEditSchool(null);
      await fetchSchools();
    } catch (err: any) {
      console.error('Update school failed', err);
      alert(err?.message || 'Failed to update school');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Suspend this school?')) return;
    setLoading(true);
    try {
      await suspendSchool(id);
      await fetchSchools();
    } catch (err: any) {
      console.error('Suspend failed', err);
      alert(err?.message || 'Failed to suspend school');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    if (!confirm('Activate this school?')) return;
    setLoading(true);
    try {
      await activateSchool(id);
      await fetchSchools();
    } catch (err: any) {
      console.error('Activate failed', err);
      alert(err?.message || 'Failed to activate school');
    } finally {
      setLoading(false);
    }
  };

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
              <div className="text-2xl font-bold">247</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Schools</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">234</div>
              <p className="text-xs text-muted-foreground">94.7% active rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">65,432</div>
              <p className="text-xs text-muted-foreground">Across all schools</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4,127</div>
              <p className="text-xs text-muted-foreground">Active educators</p>
            </CardContent>
          </Card>
        </div>

        {/* Schools Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Schools Management</CardTitle>
                <CardDescription>View and manage all schools in the platform</CardDescription>
              </div>
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add School
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schools..."
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
                    <Button onClick={handleAddSchool} disabled={loading}>Create</Button>
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
                    <Button onClick={handleEditSchool} disabled={loading}>Save</Button>
                    <Button variant="outline" onClick={() => setEditSchool(null)}>Cancel</Button>
                  </div>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Teachers</TableHead>
                  <TableHead>Established</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell className="font-mono text-sm">{school.code}</TableCell>
                    <TableCell>
                      <Badge variant={school.status === "Active" ? "default" : "destructive"}>
                        {school.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{school.students?.toLocaleString() ?? "-"}</TableCell>
                    <TableCell>{school.teachers ?? "-"}</TableCell>
                    <TableCell>{school.established ? new Date(school.established).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditSchool(school)}>Edit School</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => school.status === "Active" ? handleSuspend(school.id) : handleActivate(school.id)} className={school.status === "Active" ? "text-destructive" : "text-green-600"}>
                            {school.status === "Active" ? "Suspend" : "Activate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default Schools;