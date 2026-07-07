import type { ComplaintPriority } from './complaint';

export interface AIDetectionResult {
  category: string;
  confidence: number;
  priority: ComplaintPriority;
  duplicateWarning: boolean;
  duplicateCount?: number;
  estimatedResolutionTime: string; // e.g. "24 hours", "5 days"
}

export interface AILog {
  id: string;
  complaintId?: string;
  action: string; // e.g. "Image Classification", "Priority Assessment", "Duplicate Detection"
  timestamp: string;
  confidence: number;
  outcome: string;
  status: 'success' | 'warning' | 'error';
}
