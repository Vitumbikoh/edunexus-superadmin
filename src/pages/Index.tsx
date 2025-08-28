import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { SchoolsOverview } from "@/components/dashboard/SchoolsOverview";
import { School, Users, BarChart3, AlertTriangle, ShieldCheck, RefreshCcw } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  return (
    <AdminLayout 
      title="Dashboard" 
      subtitle="Overview of your Schomas platform"
    >
      <div className="space-y-6">
        {/* Header with refresh button */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => refetch()} 
            disabled={isLoading}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            // Loading skeletons
            <>
              <div className="p-6 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="p-6 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="p-6 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="p-6 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </>
          ) : error ? (
            // Error state
            <div className="col-span-full p-6 border rounded-lg text-center text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load dashboard statistics</p>
            </div>
          ) : (
            // Real data
            <>
              <StatsCard
                title="Total Schools"
                value={stats?.totalSchools || 0}
                description="registered schools"
                icon={School}
              />
              <StatsCard
                title="Active Schools"
                value={stats?.activeSchools || 0}
                change={{ 
                  value: `${stats?.suspendedSchools || 0} suspended`, 
                  type: stats?.suspendedSchools === 0 ? "neutral" : "decrease" 
                }}
                description="currently active"
                icon={ShieldCheck}
              />
              <StatsCard
                title="School Admins"
                value={stats?.totalAdmins || 0}
                change={{ 
                  value: `${stats?.activeAdmins || 0} active`, 
                  type: "neutral" 
                }}
                description="admin accounts"
                icon={Users}
              />
              <StatsCard
                title="Security"
                value={`${Math.round(((stats?.adminsWithChangedPasswords || 0) / Math.max(stats?.totalAdmins || 1, 1)) * 100)}%`}
                change={{ 
                  value: `${stats?.adminsWithChangedPasswords || 0}/${stats?.totalAdmins || 0}`, 
                  type: "neutral" 
                }}
                description="changed default passwords"
                icon={BarChart3}
              />
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SchoolsOverview />
          </div>
          <div>
            <RecentActivity />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Index;
