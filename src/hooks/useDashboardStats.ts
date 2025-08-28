import { useQuery } from '@tanstack/react-query';
import { listSchools, getSchoolCredentials } from '@/lib/utils';

export interface DashboardStats {
  totalSchools: number;
  activeSchools: number;
  suspendedSchools: number;
  totalAdmins: number;
  activeAdmins: number;
  adminsWithChangedPasswords: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    // Fetch schools data
    const schoolsData = await listSchools();
    const schools = Array.isArray(schoolsData) ? schoolsData : (schoolsData?.schools || []);
    
    // Fetch school credentials data
    const credentialsData = await getSchoolCredentials();
    const credentials = Array.isArray(credentialsData) ? credentialsData : (credentialsData?.credentials || credentialsData?.data || []);
    
    // Calculate school stats
    const totalSchools = schools.length;
    const activeSchools = schools.filter((school: any) => 
      school.status === 'ACTIVE' || school.status === 'active'
    ).length;
    const suspendedSchools = schools.filter((school: any) => 
      school.status === 'SUSPENDED' || school.status === 'suspended'
    ).length;
    
    // Calculate admin stats
    const totalAdmins = credentials.length;
    const activeAdmins = credentials.filter((cred: any) => cred.isActive).length;
    const adminsWithChangedPasswords = credentials.filter((cred: any) => cred.passwordChanged).length;
    
    return {
      totalSchools,
      activeSchools,
      suspendedSchools,
      totalAdmins,
      activeAdmins,
      adminsWithChangedPasswords,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default stats if there's an error
    return {
      totalSchools: 0,
      activeSchools: 0,
      suspendedSchools: 0,
      totalAdmins: 0,
      activeAdmins: 0,
      adminsWithChangedPasswords: 0,
    };
  }
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refetch every minute
  });
}
