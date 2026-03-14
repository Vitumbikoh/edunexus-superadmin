import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Trash2, School, Layers } from "lucide-react";
import { API_BASE } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type School = {
  id: string;
  name: string;
  code: string;
};

type Module = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
};

const LOCAL_STORAGE_KEY = "edunexus_superadmin_module_management";

function loadModulesForSchool(schoolId: string): Module[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Record<string, Module[]>;
    return data[schoolId] ?? [];
  } catch {
    return [];
  }
}

function saveModulesForSchool(schoolId: string, modules: Module[]) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const data = raw ? (JSON.parse(raw) as Record<string, Module[]>) : {};
    data[schoolId] = modules;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export default function ModuleManagement() {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Module | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const { toast } = useToast();

  const selectedSchool = useMemo(() => schools.find((s) => s.id === selectedSchoolId), [schools, selectedSchoolId]);

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (!selectedSchoolId) {
      setModules([]);
      return;
    }
    setModules(loadModulesForSchool(selectedSchoolId));
  }, [selectedSchoolId]);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/schools`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to load schools (${response.status})`);
      }
      const data = await response.json();
      const schoolsList: School[] = Array.isArray(data) ? data : data.schools || data.data || [];
      setSchools(schoolsList);
      if (schoolsList.length > 0 && !selectedSchoolId) {
        setSelectedSchoolId(schoolsList[0].id);
      }
    } catch (err: any) {
      console.error("Failed to fetch schools for module management", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to load schools",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setFormName("");
    setFormCode("");
    setIsActive(true);
    setShowAdd(true);
  };

  const openEdit = (module: Module) => {
    setEditing(module);
    setFormName(module.name);
    setFormCode(module.code);
    setIsActive(module.isActive);
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!selectedSchoolId) return;
    if (!formName.trim() || !formCode.trim()) {
      toast({
        title: "Validation",
        description: "Module name and code are required.",
        variant: "destructive",
      });
      return;
    }

    const nextModules = editing
      ? modules.map((m) =>
          m.id === editing.id ? { ...m, name: formName, code: formCode, isActive } : m
        )
      : [
          ...modules,
          {
            id: crypto.randomUUID(),
            name: formName,
            code: formCode,
            isActive,
          },
        ];

    setModules(nextModules);
    saveModulesForSchool(selectedSchoolId, nextModules);
    setShowAdd(false);
  };

  const handleDelete = (moduleId: string) => {
    if (!selectedSchoolId) return;
    const next = modules.filter((m) => m.id !== moduleId);
    setModules(next);
    saveModulesForSchool(selectedSchoolId, next);
  };

  return (
    <AdminLayout title="Module Management" subtitle="Organize modules per school">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Select school</p>
            <Select
              value={selectedSchoolId}
              onValueChange={setSelectedSchoolId}
              disabled={loading || schools.length === 0}
            >
              <SelectTrigger className="w-72">
                <SelectValue placeholder={loading ? "Loading schools..." : "Choose a school"} />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={fetchSchools}
              disabled={loading}
              size="sm"
            >
              Refresh
            </Button>
            <Button onClick={openAdd} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </Button>
          </div>
        </div>

        {!selectedSchoolId ? (
          <Alert>
            <AlertDescription>
              No school selected yet. Please select a school to manage modules.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Modules for {selectedSchool?.name || "selected school"}
              </CardTitle>
              <CardDescription>
                Modules are stored locally in your browser. This is a placeholder for the future API-backed module management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {modules.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No modules added yet. Click “Add Module” to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((module) => (
                      <TableRow key={module.id}>
                        <TableCell>{module.name}</TableCell>
                        <TableCell>{module.code}</TableCell>
                        <TableCell>{module.isActive ? "Active" : "Inactive"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(module)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(module.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Module" : "Add Module"}</DialogTitle>
              <DialogDescription>
                {editing
                  ? "Update module details for the selected school."
                  : "Create a new module that will be scoped to the selected school."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="module-name">Module Name</Label>
                <Input
                  id="module-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="module-code">Module Code</Label>
                <Input
                  id="module-code"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="module-active">Status</Label>
                <Select
                  value={isActive ? "active" : "inactive"}
                  onValueChange={(value) => setIsActive(value === "active")}
                >
                  <SelectTrigger id="module-active" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>{editing ? "Save changes" : "Create module"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
