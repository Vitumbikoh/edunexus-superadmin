import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Edit, Layers, Package, School } from "lucide-react";
import { API_BASE } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type School = {
  id: string;
  name: string;
  code: string;
};

type PackageId = "normal" | "silver" | "golden";

type RoleKey = "admin" | "teacher" | "student" | "finance";

type PackageRoleAccess = Record<RoleKey, string>;

type PackageDefinition = {
  id: PackageId;
  name: string;
  description: string;
  modules: string[];
  roleAccess: PackageRoleAccess;
  price: number;
};

const normalModules = [
  "Students",
  "Teachers",
  "Courses",
  "Exams",
  "Reports",
  "Class & Schedule Setup",
  "Notices & Messages",
];

const fallbackRoleAccess: Record<PackageId, PackageRoleAccess> = {
  normal: {
    admin: "All normal modules; no Finance and no Library.",
    teacher: "Full teaching modules and reports.",
    student: "Full student learning modules and reports.",
    finance: "No access in this package.",
  },
  silver: {
    admin: "Everything in package except Library.",
    teacher: "Full teaching modules and reports.",
    student: "Full student learning modules and reports.",
    finance: "Full package access including Finance.",
  },
  golden: {
    admin: "Full access including Finance and Library.",
    teacher: "Full teaching modules and reports.",
    student: "Full student learning modules and reports.",
    finance: "Full package access including Finance.",
  },
};

const defaultPackages: PackageDefinition[] = [
  {
    id: "normal",
    name: "Normal Package",
    description: "Everything except Finance and Library.",
    modules: normalModules,
    roleAccess: fallbackRoleAccess.normal,
    price: 120,
  },
  {
    id: "silver",
    name: "Silver Package",
    description: "Normal Package plus Finance.",
    modules: [...normalModules, "Finance"],
    roleAccess: fallbackRoleAccess.silver,
    price: 200,
  },
  {
    id: "golden",
    name: "Golden Package",
    description: "Silver Package plus Library.",
    modules: [...normalModules, "Finance", "Library"],
    roleAccess: fallbackRoleAccess.golden,
    price: 300,
  },
];

const roleLabels: Record<RoleKey, string> = {
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
  finance: "Finance",
};

function formatCurrency(value: number) {
  return `MK ${new Intl.NumberFormat("en-MW", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export default function ModuleManagement() {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [packagePrices, setPackagePrices] = useState<Record<PackageId, number>>({
    normal: 120,
    silver: 200,
    golden: 300,
  });
  const [packageCatalog, setPackageCatalog] = useState<PackageDefinition[]>(defaultPackages);
  const [schoolAssignments, setSchoolAssignments] = useState<Record<string, PackageId>>({});

  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageId | null>(null);
  const [assigningPackage, setAssigningPackage] = useState<PackageId>("normal");
  const [priceInput, setPriceInput] = useState("");

  const { toast } = useToast();

  const selectedSchool = useMemo(
    () => schools.find((s) => s.id === selectedSchoolId),
    [schools, selectedSchoolId]
  );

  const packages = useMemo(
    () => packageCatalog.map((pkg) => ({ ...pkg, price: packagePrices[pkg.id] ?? pkg.price })),
    [packageCatalog, packagePrices]
  );

  const selectedSchoolPackage: PackageId = schoolAssignments[selectedSchoolId] || "normal";
  const selectedSchoolPackageDetails = packages.find((pkg) => pkg.id === selectedSchoolPackage);

  useEffect(() => {
    fetchSchools();
    fetchCatalog();
  }, []);

  useEffect(() => {
    if (!selectedSchoolId) return;
    fetchSelectedSchoolPackage(selectedSchoolId);
  }, [selectedSchoolId]);

  const authHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/schools`, {
        headers: authHeaders(),
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
      console.error("Failed to fetch schools for package management", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to load schools",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalog = async () => {
    try {
      const response = await fetch(`${API_BASE}/school-packages/catalog`, {
        headers: authHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Failed to load package catalog (${response.status})`);
      }
      const data = await response.json();
      if (data?.pricing) {
        setPackagePrices({
          normal: Number(data.pricing.normal) || 120,
          silver: Number(data.pricing.silver) || 200,
          golden: Number(data.pricing.golden) || 300,
        });
      }
      if (Array.isArray(data?.packages)) {
        const normalized = data.packages
          .filter((pkg: any) => pkg?.id === 'normal' || pkg?.id === 'silver' || pkg?.id === 'golden')
          .map((pkg: any) => ({
            id: pkg.id as PackageId,
            name: pkg.name || `${pkg.id} package`,
            description: pkg.description || '',
            modules: Array.isArray(pkg.modules) ? pkg.modules : [],
            roleAccess: {
              admin: pkg?.roleAccess?.admin || fallbackRoleAccess[pkg.id as PackageId].admin,
              teacher: pkg?.roleAccess?.teacher || fallbackRoleAccess[pkg.id as PackageId].teacher,
              student: pkg?.roleAccess?.student || fallbackRoleAccess[pkg.id as PackageId].student,
              finance: pkg?.roleAccess?.finance || fallbackRoleAccess[pkg.id as PackageId].finance,
            },
            price: Number(pkg.price) || 0,
          }));
        if (normalized.length > 0) {
          setPackageCatalog(normalized);
        }
      }
    } catch (err: any) {
      toast({
        title: "Warning",
        description: err?.message || "Using default package pricing",
        variant: "destructive",
      });
    }
  };

  const fetchSelectedSchoolPackage = async (schoolId: string) => {
    try {
      const response = await fetch(`${API_BASE}/school-packages/schools/${schoolId}`, {
        headers: authHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Failed to load school package (${response.status})`);
      }
      const data = await response.json();
      setSchoolAssignments((prev) => ({
        ...prev,
        [schoolId]: (data.assignedPackage || "normal") as PackageId,
      }));
      if (data?.pricing) {
        setPackagePrices({
          normal: Number(data.pricing.normal) || 120,
          silver: Number(data.pricing.silver) || 200,
          golden: Number(data.pricing.golden) || 300,
        });
      }
      if (Array.isArray(data?.packages)) {
        const normalized = data.packages
          .filter((pkg: any) => pkg?.id === 'normal' || pkg?.id === 'silver' || pkg?.id === 'golden')
          .map((pkg: any) => ({
            id: pkg.id as PackageId,
            name: pkg.name || `${pkg.id} package`,
            description: pkg.description || '',
            modules: Array.isArray(pkg.modules) ? pkg.modules : [],
            roleAccess: {
              admin: pkg?.roleAccess?.admin || fallbackRoleAccess[pkg.id as PackageId].admin,
              teacher: pkg?.roleAccess?.teacher || fallbackRoleAccess[pkg.id as PackageId].teacher,
              student: pkg?.roleAccess?.student || fallbackRoleAccess[pkg.id as PackageId].student,
              finance: pkg?.roleAccess?.finance || fallbackRoleAccess[pkg.id as PackageId].finance,
            },
            price: Number(pkg.price) || packagePrices[pkg.id as PackageId] || 0,
          }));
        if (normalized.length > 0) {
          setPackageCatalog(normalized);
        }
      }
    } catch (err: any) {
      toast({
        title: "Warning",
        description: err?.message || "Failed to load school package assignment",
        variant: "destructive",
      });
    }
  };

  const handleSchoolPackageChange = (packageId: PackageId) => {
    if (!selectedSchoolId) return;
    void (async () => {
      try {
        const response = await fetch(`${API_BASE}/school-packages/schools/${selectedSchoolId}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ packageId }),
        });
        if (!response.ok) {
          throw new Error(`Failed to assign package (${response.status})`);
        }
        const data = await response.json();
        const assignedPackage = (data.assignedPackage || packageId) as PackageId;
        setSchoolAssignments((prev) => ({ ...prev, [selectedSchoolId]: assignedPackage }));
        toast({
          title: "Package Assigned",
          description: `${selectedSchool?.name || "School"} moved to ${assignedPackage.toUpperCase()} package.`,
        });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to assign school package",
          variant: "destructive",
        });
      }
    })();
  };

  const openAssignPackageDialog = () => {
    if (!selectedSchoolId) return;
    setAssigningPackage(selectedSchoolPackage);
    setShowAssignDialog(true);
  };

  const savePackageAssignment = () => {
    handleSchoolPackageChange(assigningPackage);
    setShowAssignDialog(false);
  };

  const openPriceEditor = (packageId: PackageId) => {
    const currentPrice = packagePrices[packageId];
    setEditingPackage(packageId);
    setPriceInput(String(currentPrice));
    setShowPriceDialog(true);
  };

  const savePrice = () => {
    if (!editingPackage) return;
    const parsed = Number(priceInput);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast({
        title: "Validation",
        description: "Price must be a valid positive number.",
        variant: "destructive",
      });
      return;
    }

    void (async () => {
      try {
        const nextPrices = { ...packagePrices, [editingPackage]: parsed };
        const response = await fetch(`${API_BASE}/school-packages/pricing`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(nextPrices),
        });
        if (!response.ok) {
          throw new Error(`Failed to update pricing (${response.status})`);
        }
        const data = await response.json();
        if (data?.pricing) {
          setPackagePrices({
            normal: Number(data.pricing.normal) || nextPrices.normal,
            silver: Number(data.pricing.silver) || nextPrices.silver,
            golden: Number(data.pricing.golden) || nextPrices.golden,
          });
        } else {
          setPackagePrices(nextPrices);
        }
        setShowPriceDialog(false);
        toast({
          title: "Package Price Updated",
          description: `New price saved for ${editingPackage.toUpperCase()} package.`,
        });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to update package pricing",
          variant: "destructive",
        });
      }
    })();
  };

  return (
    <AdminLayout title="Module Management" subtitle="Manage packages, included modules, and package pricing">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-4 w-4" />
              School Package Assignment
            </CardTitle>
            <CardDescription>
              Select a school and assign the package it should use.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <Label>Select school</Label>
                <Select
                  value={selectedSchoolId}
                  onValueChange={setSelectedSchoolId}
                  disabled={loading || schools.length === 0}
                >
                  <SelectTrigger className="w-80">
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

              <Button variant="secondary" onClick={fetchSchools} disabled={loading}>
                Refresh Schools
              </Button>
            </div>

            {!selectedSchoolId ? (
              <Alert>
                <AlertDescription>
                  No school selected yet. Select a school to assign a package.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Assigned package for {selectedSchool?.name}</p>
                    {selectedSchoolPackageDetails && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{selectedSchoolPackageDetails.name}</Badge>
                        <span className="text-sm font-medium">{formatCurrency(selectedSchoolPackageDetails.price)}</span>
                      </div>
                    )}
                  </div>
                  <Button onClick={openAssignPackageDialog}>Choose Package</Button>
                </div>

                {selectedSchoolPackageDetails && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Included modules</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSchoolPackageDetails.modules.map((moduleName) => (
                        <Badge key={moduleName} variant="secondary">
                          {moduleName}
                        </Badge>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Role access in this package</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {(Object.keys(roleLabels) as RoleKey[]).map((role) => (
                          <div key={role} className="rounded border p-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {roleLabels[role]}
                            </p>
                            <p className="text-sm">{selectedSchoolPackageDetails.roleAccess[role]}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Package Catalog
            </CardTitle>
            <CardDescription>
              This shows the available packages, their modules, and package prices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Role Access</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>{pkg.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5 max-w-lg">
                        {pkg.modules.map((moduleName) => (
                          <Badge key={moduleName} variant="secondary">
                            {moduleName}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 max-w-sm">
                        {(Object.keys(roleLabels) as RoleKey[]).map((role) => (
                          <p key={role} className="text-xs">
                            <span className="font-semibold">{roleLabels[role]}:</span> {pkg.roleAccess[role]}
                          </p>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(pkg.price)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openPriceEditor(pkg.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Price
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Package Price</DialogTitle>
              <DialogDescription>
                Update the selected package price in Malawi Kwacha (MK).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <Label htmlFor="package-price">Package price (MK)</Label>
              <Input
                id="package-price"
                type="number"
                min="0"
                value={priceInput}
                onChange={(event) => setPriceInput(event.target.value)}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPriceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={savePrice}>Save Price</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Choose School Package</DialogTitle>
              <DialogDescription>
                Assign a package for {selectedSchool?.name || "the selected school"}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <Label htmlFor="school-package">Package</Label>
              <Select value={assigningPackage} onValueChange={(value) => setAssigningPackage(value as PackageId)}>
                <SelectTrigger id="school-package" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} ({formatCurrency(pkg.price)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={savePackageAssignment}>Save Package</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Alert>
          <Layers className="h-4 w-4" />
          <AlertDescription>
            Package data and assignments are synced through backend APIs and shared with school users in edunexus-frontend.
          </AlertDescription>
        </Alert>
      </div>
    </AdminLayout>
  );
}
