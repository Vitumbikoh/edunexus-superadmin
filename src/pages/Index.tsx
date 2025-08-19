import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { SchoolsOverview } from "@/components/dashboard/SchoolsOverview";
import { School, Users, BarChart3, AlertTriangle } from "lucide-react";

const Index = () => {
  return (
    <AdminLayout 
      title="Dashboard" 
      subtitle="Overview of your Schomas platform"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Schools"
            value={247}
            change={{ value: "12%", type: "increase" }}
            description="from last month"
            icon={School}
          />
          <StatsCard
            title="Active Users"
            value={15642}
            change={{ value: "8%", type: "increase" }}
            description="from last month"
            icon={Users}
          />
          <StatsCard
            title="Platform Usage"
            value="94.2%"
            change={{ value: "2.1%", type: "increase" }}
            description="uptime this month"
            icon={BarChart3}
          />
          <StatsCard
            title="Issues"
            value={3}
            change={{ value: "2", type: "decrease" }}
            description="resolved today"
            icon={AlertTriangle}
          />
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
