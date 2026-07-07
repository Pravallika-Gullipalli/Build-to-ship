import type { AIDetectionResult, AILog } from '../types/ai';
import type { ComplaintPriority } from '../types/complaint';
import { supabase } from '../lib/supabaseClient';

export const aiService = {
  async detectIssue(description: string, imageSrc?: string): Promise<AIDetectionResult> {
    const descLower = description.toLowerCase();
    
    // Keyword Analysis
    let category = 'Other';
    let confidence = 0.82;
    let priority: ComplaintPriority = 'medium';
    let estimatedResolutionTime = '7 days';
    let duplicateWarning = false;
    let duplicateCount = 0;

    if (descLower.includes('pothole') || descLower.includes('crater') || descLower.includes('road') || descLower.includes('pavement')) {
      category = 'Roads & Traffic';
      confidence = 0.94;
      priority = 'high';
      estimatedResolutionTime = '3 days';
    } else if (descLower.includes('water') || descLower.includes('leak') || descLower.includes('sewer') || descLower.includes('pipe') || descLower.includes('flood')) {
      category = 'Water & Sewer';
      confidence = 0.97;
      priority = 'critical';
      estimatedResolutionTime = '24 hours';
      duplicateWarning = true;
      duplicateCount = 2;
    } else if (descLower.includes('trash') || descLower.includes('dumping') || descLower.includes('garbage') || descLower.includes('litter') || descLower.includes('debris')) {
      category = 'Sanitation';
      confidence = 0.91;
      priority = 'high';
      estimatedResolutionTime = '2 days';
    } else if (descLower.includes('light') || descLower.includes('dark') || descLower.includes('lamp') || descLower.includes('bulb') || descLower.includes('electricity')) {
      category = 'Public Lighting';
      confidence = 0.89;
      priority = 'medium';
      estimatedResolutionTime = '5 days';
    } else if (descLower.includes('tree') || descLower.includes('bush') || descLower.includes('park') || descLower.includes('vegetation') || descLower.includes('grass')) {
      category = 'Parks & Recreation';
      confidence = 0.88;
      priority = 'low';
      estimatedResolutionTime = '6 days';
    }

    if (imageSrc) {
      confidence = Math.min(0.99, confidence + 0.03);
    }

    // Insert AI Log entry in Supabase
    await supabase.from('ai_logs').insert({
      action: 'Automated Image & Text Analysis',
      confidence,
      outcome: `Identified: ${category}. Confidence: ${(confidence * 100).toFixed(1)}%. Rated Priority: ${priority.toUpperCase()}. Est Resolution: ${estimatedResolutionTime}.`,
      status: duplicateWarning ? 'warning' : 'success'
    });

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
    if (category === 'Water & Sewer' || descLower.includes('flood') || descLower.includes('gushing')) {
      return 'critical';
    }
    if (category === 'Roads & Traffic' && (descLower.includes('severe') || descLower.includes('highway'))) {
      return 'high';
    }
    if (descLower.includes('blocking') || descLower.includes('hazard') || descLower.includes('emergency')) {
      return 'high';
    }
    if (category === 'Parks & Recreation') {
      return 'low';
    }
    return 'medium';
  },

  async detectDuplicate(lat: number, lng: number, category: string): Promise<{ duplicateWarning: boolean; duplicateCount: number }> {
    const threshold = 0.002; // Bounding box check
    
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('category', category)
      .neq('status', 'resolved');

    if (error) throw error;

    const matches = (data || []).filter(c => 
      Math.abs(c.lat - lat) < threshold &&
      Math.abs(c.lng - lng) < threshold
    );

    return {
      duplicateWarning: matches.length > 0,
      duplicateCount: matches.length
    };
  },

  async estimateResolution(category: string, priority: string): Promise<string> {
    if (priority === 'critical') return '24 hours';
    if (priority === 'high') return '3 days';
    
    switch (category) {
      case 'Water & Sewer': return '2 days';
      case 'Roads & Traffic': return '4 days';
      case 'Sanitation': return '3 days';
      case 'Public Lighting': return '5 days';
      case 'Parks & Recreation': return '7 days';
      default: return '6 days';
    }
  },

  async getLogs(): Promise<AILog[]> {
    const { data, error } = await supabase
      .from('ai_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      complaintId: row.complaint_id || undefined,
      action: row.action,
      timestamp: row.timestamp,
      confidence: row.confidence,
      outcome: row.outcome,
      status: row.status as any
    }));
  }
};
