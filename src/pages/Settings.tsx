import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Bell, ShieldCheck } from "lucide-react";
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
      <div className="space-y-6">
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>Basic account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    {loading ? (
                      <Skeleton className="h-9 w-full" />
                    ) : (
                      <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {loading ? (
                      <Skeleton className="h-9 w-full" />
                    ) : (
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    {loading ? (
                      <Skeleton className="h-9 w-full" />
                    ) : (
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    )}
                  </div>
                </CardContent>
              </Card>

              {isAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle>School Settings</CardTitle>
                    <CardDescription>Visible to your organization</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="school-name">School Name</Label>
                      {loading ? (
                        <Skeleton className="h-9 w-full" />
                      ) : (
                        <Input id="school-name" value={school?.schoolName || ""} onChange={(e) => setSchool(s => s ? { ...s, schoolName: e.target.value } : null)} />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="school-email">School Email</Label>
                      {loading ? (
                        <Skeleton className="h-9 w-full" />
                      ) : (
                        <Input id="school-email" type="email" value={school?.schoolEmail || ""} onChange={(e) => setSchool(s => s ? { ...s, schoolEmail: e.target.value } : null)} />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="school-phone">School Phone</Label>
                      {loading ? (
                        <Skeleton className="h-9 w-full" />
                      ) : (
                        <Input id="school-phone" value={school?.schoolPhone || ""} onChange={(e) => setSchool(s => s ? { ...s, schoolPhone: e.target.value } : null)} />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="school-address">Address</Label>
                      {loading ? (
                        <Skeleton className="h-20 w-full" />
                      ) : (
                        <Textarea id="school-address" value={school?.schoolAddress || ""} onChange={(e) => setSchool(s => s ? { ...s, schoolAddress: e.target.value } : null)} rows={3} />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="school-about">About</Label>
                      {loading ? (
                        <Skeleton className="h-20 w-full" />
                      ) : (
                        <Textarea id="school-about" value={school?.schoolAbout || ""} onChange={(e) => setSchool(s => s ? { ...s, schoolAbout: e.target.value } : null)} rows={3} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>How you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email</Label>
                      <p className="text-xs text-muted-foreground">Receive emails for important updates</p>
                    </div>
                    {loading ? <Skeleton className="h-6 w-11" /> : (
                      <Switch checked={!!notifications.email} onCheckedChange={(v) => setNotifications(n => ({ ...n, email: !!v }))} />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS</Label>
                      <p className="text-xs text-muted-foreground">Get text notifications</p>
                    </div>
                    {loading ? <Skeleton className="h-6 w-11" /> : (
                      <Switch checked={!!notifications.sms} onCheckedChange={(v) => setNotifications(n => ({ ...n, sms: !!v }))} />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Browser</Label>
                      <p className="text-xs text-muted-foreground">Enable in-app/browser alerts</p>
                    </div>
                    {loading ? <Skeleton className="h-6 w-11" /> : (
                      <Switch checked={!!notifications.browser} onCheckedChange={(v) => setNotifications(n => ({ ...n, browser: !!v }))} />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Summary</Label>
                      <p className="text-xs text-muted-foreground">Digest of activity each week</p>
                    </div>
                    {loading ? <Skeleton className="h-6 w-11" /> : (
                      <Switch checked={!!notifications.weeklySummary} onCheckedChange={(v) => setNotifications(n => ({ ...n, weeklySummary: !!v }))} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Security</span>
                </CardTitle>
                <CardDescription>Protect your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-factor authentication</Label>
                    <p className="text-xs text-muted-foreground">Require OTP during login</p>
                  </div>
                  {loading ? <Skeleton className="h-6 w-11" /> : (
                    <Switch checked={!!security.twoFactor} onCheckedChange={(v) => setSecurity({ twoFactor: !!v })} />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving || loading}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;