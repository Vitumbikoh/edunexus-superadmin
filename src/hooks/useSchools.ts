import { useQuery } from '@tanstack/react-query';
import { listSchools } from '@/lib/utils';

export interface APISchool {
  id: string;
  name: string;
  code: string;
  status: string; // e.g. ACTIVE | SUSPENDED
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

async function fetchSchools(search?: string): Promise<APISchool[]> {
  const data = await listSchools(search);
  // Support both { schools: [...] } or raw array
  return (data?.schools || data || []) as APISchool[];
}

export function useSchools(search?: string) {
  return useQuery({
    queryKey: ['schools', search || 'all'],
    queryFn: () => fetchSchools(search),
    staleTime: 60_000,
  });
}
