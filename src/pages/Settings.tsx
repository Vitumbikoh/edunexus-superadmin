import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Bell, 
  ShieldCheck, 
  User, 
  School, 
  Settings as SettingsIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Building2,
  UserCircle,
  Lock,
  Smartphone,
  Globe,
  Calendar,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type NotificationSettings = {
  email: boolean;
  sms: boolean;
  browser: boolean;
  weeklySummary: boolean;
};

type SecuritySettings = {
  twoFactor: boolean;
};

type SchoolSettings = {
  schoolName: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolAddress: string;
  schoolAbout: string;
};

type SettingsResponse = {
  user: {
    id: string;
    username: string;
    email?: string | null;
    role: string;
    phone?: string;
    image?: string;
    notifications: NotificationSettings;
    security: SecuritySettings;
  };
  schoolSettings?: SchoolSettings;
};

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [role, setRole] = useState<string>("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    sms: false,
    browser: true,
    weeklySummary: true,
  });
  const [security, setSecurity] = useState<SecuritySettings>({ twoFactor: false });
  const [school, setSchool] = useState<SchoolSettings | null>(null);

  const isAdmin = useMemo(() => role === "ADMIN", [role]);

  const fetchSettings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load settings (${res.status})`);
      const data: SettingsResponse = await res.json();
      setRole(data.user.role);
      setUsername(data.user.username || "");
      setEmail((data.user.email as string) || "");
      setPhone(data.user.phone || "");
      setNotifications(data.user.notifications);
      setSecurity(data.user.security);
      setSchool(data.schoolSettings || (isAdmin ? { schoolName: "", schoolEmail: "", schoolPhone: "", schoolAddress: "", schoolAbout: "" } : null));
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to load settings", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Ensure school settings object exists when admin role is detected
  useEffect(() => {
    if (isAdmin && school === null) {
      setSchool({ schoolName: "", schoolEmail: "", schoolPhone: "", schoolAddress: "", schoolAbout: "" });
    }
  }, [isAdmin, school]);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const payload: any = {
        username,
        email,
        phone,
        notifications,
        security,
      };
      if (isAdmin && school) {
        payload.schoolSettings = school;
      }

      const res = await fetch(`${API_BASE}/settings`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to save (${res.status})`);
      }
      await fetchSettings();
      toast({ title: "Settings saved" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Settings" subtitle="Manage your account and school settings">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-6 border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm">
              <SettingsIcon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Account Settings</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your account preferences and school configuration</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="outline" className="bg-white dark:bg-slate-800">
                <UserCircle className="w-3 h-3 mr-1" />
                {role}
              </Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <TabsList className="h-12 bg-transparent p-0 space-x-8">
              <TabsTrigger 
                value="account" 
                className="h-12 px-0 pb-3 pt-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none font-medium"
              >
                <User className="h-4 w-4 mr-2" />
                Account Profile
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger 
                  value="school" 
                  className="h-12 px-0 pb-3 pt-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none font-medium"
                >
                  <School className="h-4 w-4 mr-2" />
                  School Information
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="notifications" 
                className="h-12 px-0 pb-3 pt-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none font-medium"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="h-12 px-0 pb-3 pt-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none font-medium"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Security & Privacy
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="account" className="space-y-6 mt-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <UserCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Personal Information</CardTitle>
                    <CardDescription>Update your personal details and contact information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-500" />
                      Username
                    </Label>
                    {loading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Input 
                        id="username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        className="h-10"
                        placeholder="Enter your username"
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      Email Address
                    </Label>
                    {loading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="h-10"
                        placeholder="Enter your email address"
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-500" />
                      Phone Number
                    </Label>
                    {loading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Input 
                        id="phone" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        className="h-10"
                        placeholder="Enter your phone number"
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Badge className="h-4 w-4 text-slate-500" />
                      Account Role
                    </Label>
                    <div className="h-10 flex items-center">
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                        {role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="school" className="space-y-6 mt-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">School Information</CardTitle>
                      <CardDescription>Manage your school's public information and contact details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <Label htmlFor="school-name" className="text-sm font-medium flex items-center gap-2">
                        <School className="h-4 w-4 text-slate-500" />
                        School Name
                      </Label>
                      {loading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Input 
                          id="school-name" 
                          value={school?.schoolName || ""} 
                          onChange={(e) => setSchool(s => s ? { ...s, schoolName: e.target.value } : null)} 
                          className="h-10"
                          placeholder="Enter school name"
                        />
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="school-email" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-500" />
                        School Email
                      </Label>
                      {loading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Input 
                          id="school-email" 
                          type="email" 
                          value={school?.schoolEmail || ""} 
                          onChange={(e) => setSchool(s => s ? { ...s, schoolEmail: e.target.value } : null)} 
                          className="h-10"
                          placeholder="Enter school email"
                        />
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="school-phone" className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-500" />
                        School Phone
                      </Label>
                      {loading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Input 
                          id="school-phone" 
                          value={school?.schoolPhone || ""} 
                          onChange={(e) => setSchool(s => s ? { ...s, schoolPhone: e.target.value } : null)} 
                          className="h-10"
                          placeholder="Enter school phone number"
                        />
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="school-address" className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        School Address
                      </Label>
                      {loading ? (
                        <Skeleton className="h-24 w-full" />
                      ) : (
                        <Textarea 
                          id="school-address" 
                          value={school?.schoolAddress || ""} 
                          onChange={(e) => setSchool(s => s ? { ...s, schoolAddress: e.target.value } : null)} 
                          rows={3} 
                          className="resize-none"
                          placeholder="Enter complete school address"
                        />
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="school-about" className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-500" />
                        About School
                      </Label>
                      {loading ? (
                        <Skeleton className="h-24 w-full" />
                      ) : (
                        <Textarea 
                          id="school-about" 
                          value={school?.schoolAbout || ""} 
                          onChange={(e) => setSchool(s => s ? { ...s, schoolAbout: e.target.value } : null)} 
                          rows={3} 
                          className="resize-none"
                          placeholder="Brief description about your school, its mission, and values"
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="notifications" className="space-y-6 mt-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Notification Preferences</CardTitle>
                    <CardDescription>Choose how and when you want to receive notifications</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Email Notifications</Label>
                        <p className="text-xs text-muted-foreground">Receive important updates and alerts via email</p>
                      </div>
                    </div>
                    {loading ? <Skeleton className="h-6 w-11" /> : (
                      <Switch checked={!!notifications.email} onCheckedChange={(v) => setNotifications(n => ({ ...n, email: !!v }))} />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <Smartphone className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">SMS Notifications</Label>
                        <p className="text-xs text-muted-foreground">Get urgent notifications via text message</p>
                      </div>
                    </div>
                    {loading ? <Skeleton className="h-6 w-11" /> : (
                      <Switch checked={!!notifications.sms} onCheckedChange={(v) => setNotifications(n => ({ ...n, sms: !!v }))} />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Browser Notifications</Label>
                        <p className="text-xs text-muted-foreground">Show notifications in your browser while using the app</p>
                      </div>
                    </div>
                    {loading ? <Skeleton className="h-6 w-11" /> : (
                      <Switch checked={!!notifications.browser} onCheckedChange={(v) => setNotifications(n => ({ ...n, browser: !!v }))} />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Weekly Summary</Label>
                        <p className="text-xs text-muted-foreground">Receive a weekly digest of your school's activities</p>
                      </div>
                    </div>
                    {loading ? <Skeleton className="h-6 w-11" /> : (
                      <Switch checked={!!notifications.weeklySummary} onCheckedChange={(v) => setNotifications(n => ({ ...n, weeklySummary: !!v }))} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <ShieldCheck className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Security & Privacy</CardTitle>
                    <CardDescription>Manage your account security settings and privacy preferences</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                      <p className="text-xs text-muted-foreground">Add an extra layer of security with OTP verification</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {loading ? <Skeleton className="h-6 w-11" /> : (
                      <>
                        <Switch checked={!!security.twoFactor} onCheckedChange={(v) => setSecurity({ twoFactor: !!v })} />
                        {security.twoFactor && (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs font-medium">Enabled</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Security Recommendation</span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    For enhanced security, we recommend enabling two-factor authentication and using a strong, unique password.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button 
            onClick={save} 
            disabled={saving || loading}
            size="lg"
            className="min-w-[120px] h-11"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;