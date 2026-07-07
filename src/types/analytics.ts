export interface MonthlyComplaints {
  month: string;
  submitted: number;
  resolved: number;
}

export interface PriorityDistribution {
  priority: string;
  count: number;
  color: string;
}

export interface DepartmentPerformance {
  department: string;
  total: number;
  resolved: number;
  avgResolutionDays: number;
  rating: number; // Out of 5
}

export interface CategoryDistribution {
  category: string;
  count: number;
}

export interface SystemAnalytics {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  duplicateComplaints: number;
  avgResolutionTimeDays: number;
  aiVerificationRate: number; // percentage
  monthlyTrend: MonthlyComplaints[];
  priorityDistribution: PriorityDistribution[];
  departmentPerformance: DepartmentPerformance[];
  categoryDistribution: CategoryDistribution[];
}
