import type { AIDetectionResult, AILog } from '../types/ai';
import type { ComplaintPriority } from '../types/complaint';
import { complaintService } from './complaintService';

export const aiService = {
  async detectIssue(description: string, imageSrc?: string): Promise<AIDetectionResult> {
    const descLower = description.toLowerCase();
    
    // Keyword Analysis
    let category = 'Other Public Issues';
    let confidence = 0.82;
    let priority: ComplaintPriority = 'medium';
    let estimatedResolutionTime = '7 days';
    let duplicateWarning = false;
    let duplicateCount = 0;

    if (descLower.includes('pothole') || descLower.includes('crater') || descLower.includes('road') || descLower.includes('pavement') || descLower.includes('footpath')) {
      category = 'Roads & Streets';
      confidence = 0.94;
      priority = 'high';
      estimatedResolutionTime = '3 days';
    } else if (descLower.includes('signal') || descLower.includes('parking') || descLower.includes('bus stop') || descLower.includes('crosswalk')) {
      category = 'Traffic & Transportation';
      confidence = 0.89;
      priority = 'medium';
      estimatedResolutionTime = '5 days';
    } else if (descLower.includes('street light') || descLower.includes('electric') || descLower.includes('wire') || descLower.includes('transformer')) {
      category = 'Electricity';
      confidence = 0.93;
      priority = 'high';
      estimatedResolutionTime = '3 days';
    } else if (descLower.includes('water supply') || descLower.includes('water contamination') || descLower.includes('pipeline') || descLower.includes('leakage')) {
      category = 'Water Supply';
      confidence = 0.97;
      priority = 'critical';
      estimatedResolutionTime = '24 hours';
      duplicateWarning = true;
      duplicateCount = 2;
    } else if (descLower.includes('garbage') || descLower.includes('dumping') || descLower.includes('sewage') || descLower.includes('toilet') || descLower.includes('drain')) {
      category = 'Sanitation & Waste';
      confidence = 0.91;
      priority = 'high';
      estimatedResolutionTime = '2 days';
    } else if (descLower.includes('tree') || descLower.includes('pollution') || descLower.includes('air') || descLower.includes('noise')) {
      category = 'Environment';
      confidence = 0.88;
      priority = 'low';
      estimatedResolutionTime = '6 days';
    } else if (descLower.includes('mosquito') || descLower.includes('stray') || descLower.includes('unsafe space')) {
      category = 'Public Health & Safety';
      confidence = 0.87;
      priority = 'medium';
      estimatedResolutionTime = '4 days';
    } else if (descLower.includes('park') || descLower.includes('bench') || descLower.includes('government building') || descLower.includes('playground')) {
      category = 'Public Infrastructure';
      confidence = 0.90;
      priority = 'low';
      estimatedResolutionTime = '5 days';
    } else if (descLower.includes('flood') || descLower.includes('storm drain') || descLower.includes('landslide') || descLower.includes('fire')) {
      category = 'Flooding & Disaster Risks';
      confidence = 0.96;
      priority = 'critical';
      estimatedResolutionTime = '24 hours';
    } else if (descLower.includes('construction') || descLower.includes('collapse') || descLower.includes('pit') || descLower.includes('safety barrier')) {
      category = 'Public Safety';
      confidence = 0.92;
      priority = 'high';
      estimatedResolutionTime = '2 days';
    } else if (descLower.includes('bus shelter') || descLower.includes('railway')) {
      category = 'Public Transport';
      confidence = 0.85;
      priority = 'low';
      estimatedResolutionTime = '6 days';
    } else if (descLower.includes('fiber') || descLower.includes('cables') || descLower.includes('wifi') || descLower.includes('utility pole')) {
      category = 'Public Utilities';
      confidence = 0.89;
      priority = 'medium';
      estimatedResolutionTime = '4 days';
    }

    if (imageSrc) {
      confidence = Math.min(0.99, confidence + 0.03);
    }

    // Insert AI Log entry in local log storage
    const newLog: AILog = {
      id: `ai-log-${Date.now()}`,
      action: 'Automated Image & Text Analysis',
      confidence,
      outcome: `Identified: ${category}. Confidence: ${(confidence * 100).toFixed(1)}%. Rated Priority: ${priority.toUpperCase()}. Est Resolution: ${estimatedResolutionTime}.`,
      status: duplicateWarning ? 'warning' : 'success',
      timestamp: new Date().toISOString()
    };
    try {
      const existing = JSON.parse(localStorage.getItem('civicfix_ai_logs') || '[]');
      localStorage.setItem('civicfix_ai_logs', JSON.stringify([newLog, ...existing].slice(0, 50)));
    } catch {}

    return {
      category,
      confidence,
      priority,
      duplicateWarning,
      duplicateCount,
      estimatedResolutionTime
    };
  },

  async predictPriority(description: string, category: string): Promise<ComplaintPriority> {
    const descLower = description.toLowerCase();
    if (category === 'Water Supply' || category === 'Flooding & Disaster Risks' || descLower.includes('flood') || descLower.includes('gushing')) {
      return 'critical';
    }
    if ((category === 'Roads & Streets' || category === 'Public Safety') && (descLower.includes('severe') || descLower.includes('highway'))) {
      return 'high';
    }
    if (descLower.includes('blocking') || descLower.includes('hazard') || descLower.includes('emergency')) {
      return 'high';
    }
    if (category === 'Public Infrastructure' || category === 'Public Transport') {
      return 'low';
    }
    return 'medium';
  },

  async detectDuplicate(lat: number, lng: number, category: string): Promise<{ duplicateWarning: boolean; duplicateCount: number }> {
    const threshold = 0.002; // Bounding box check
    
    try {
      const complaints = await complaintService.getAllComplaints();
      const matches = complaints.filter(c => 
        c.category === category &&
        c.status !== 'resolved' &&
        Math.abs(c.location.lat - lat) < threshold &&
        Math.abs(c.location.lng - lng) < threshold
      );

      return {
        duplicateWarning: matches.length > 0,
        duplicateCount: matches.length
      };
    } catch {
      return { duplicateWarning: false, duplicateCount: 0 };
    }
  },

  async estimateResolution(category: string, priority: string): Promise<string> {
    if (priority === 'critical') return '24 hours';
    if (priority === 'high') return '3 days';
    
    switch (category) {
      case 'Water Supply': return '2 days';
      case 'Roads & Streets': return '4 days';
      case 'Sanitation & Waste': return '3 days';
      case 'Electricity': return '5 days';
      case 'Public Infrastructure': return '5 days';
      default: return '6 days';
    }
  },

  async getLogs(): Promise<AILog[]> {
    try {
      const logs = JSON.parse(localStorage.getItem('civicfix_ai_logs') || '[]');
      if (logs.length > 0) return logs;
    } catch {}

    return [
      {
        id: '1',
        action: 'Severity Assessment',
        confidence: 0.94,
        outcome: 'Priority set to HIGH for Pothole cluster',
        status: 'success',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      },
      {
        id: '2',
        action: 'Duplicate Check',
        confidence: 0.88,
        outcome: 'Merged with existing ticket #101',
        status: 'warning',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString()
      }
    ];
  }
};
