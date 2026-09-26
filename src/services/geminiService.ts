import type { Complaint } from '../types/complaint';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface AiAnalysisResult {
  summary: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isDuplicate: boolean;
  duplicateWarning?: string;
  reasoning: string;
}

export const geminiService = {
  async analyzeComplaint(target: Complaint, allComplaints: Complaint[]): Promise<AiAnalysisResult> {
    // 1. Prepare candidate list for duplicate detection
    const otherComplaints = allComplaints.filter(c => c.id !== target.id);
    const candidatesText = otherComplaints.map(c => 
      `- [ID: ${c.id}] Title: "${c.title}" | Category: "${c.category}" | Description: "${c.description}"`
    ).slice(0, 15).join('\n');

    const prompt = `
You are a municipal smart assistant analyzing a new civic complaint.
Your job is to:
1. Summarize the issue in 1 clear, professional sentence.
2. Prioritize the importance of the issue as one of: "low", "medium", "high", "critical". Critical is reserved for dangerous, hazardous, or emergency situations like fires, live wires, flooding, collapsing infrastructure, or severe road accidents.
3. Check for duplicates in the existing database. A complaint is a duplicate if it reports the exact same issue at the same location.

New Complaint to Analyze:
- Title: "${target.title}"
- Category: "${target.category}"
- Description: "${target.description}"
- Location: "${target.location?.address || 'Unknown'}"

Existing Complaints Database (Check for duplicates here):
${candidatesText || 'No other complaints in database.'}

You MUST return a JSON object exactly matches the following schema:
{
  "summary": "1-sentence summary",
  "priority": "low" | "medium" | "high" | "critical",
  "isDuplicate": true | false,
  "duplicateWarning": "Warning text describing duplicate ID if isDuplicate is true, else null",
  "reasoning": "Brief explanation for priority selection"
}
Response:`;

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      // Extract JSON from markdown code block if present
      const cleanText = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanText) as AiAnalysisResult;
      
      return {
        summary: parsed.summary || target.title,
        priority: parsed.priority || 'medium',
        isDuplicate: !!parsed.isDuplicate,
        duplicateWarning: parsed.duplicateWarning || undefined,
        reasoning: parsed.reasoning || 'Default automated check.'
      };
    } catch (e) {
      console.warn('Gemini analysis failed, falling back to local analysis:', e);
      return this.localFallbackAnalysis(target, otherComplaints);
    }
  },

  localFallbackAnalysis(target: Complaint, others: Complaint[]): AiAnalysisResult {
    const textToSearch = (target.title + ' ' + target.description).toLowerCase();
    
    // Heuristic Priority Check
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (textToSearch.match(/(fire|wire|accident|hazard|electric|leak|emergency|collapse|danger)/)) {
      priority = 'critical';
    } else if (textToSearch.match(/(pot hole|pothole|broken|block|traffic|pipe|water)/)) {
      priority = 'high';
    } else if (textToSearch.match(/(clean|trash|litter|graffiti|park)/)) {
      priority = 'low';
    }

    // Heuristic Duplicate Check
    let isDuplicate = false;
    let duplicateWarning: string | undefined = undefined;

    for (const other of others) {
      const distance = this.levenshteinDistance(target.title.toLowerCase(), other.title.toLowerCase());
      const maxLen = Math.max(target.title.length, other.title.length);
      const similarity = maxLen > 0 ? (1 - distance / maxLen) : 0;
      
      if (similarity > 0.7) {
        isDuplicate = true;
        duplicateWarning = `Possible duplicate of ticket: "${other.title}" (ID: ${other.id})`;
        break;
      }
    }

    return {
      summary: target.description.slice(0, 80) + '...',
      priority,
      isDuplicate,
      duplicateWarning,
      reasoning: 'Analyzed locally using local similarity matching.'
    };
  },

  levenshteinDistance(a: string, b: string): number {
    const tmp = [];
    let i, j, alen = a.length, blen = b.length;
    if (alen === 0) return blen;
    if (blen === 0) return alen;
    for (i = 0; i <= alen; i++) tmp[i] = [i];
    for (j = 0; j <= blen; j++) tmp[0][j] = j;
    for (i = 1; i <= alen; i++) {
      for (j = 1; j <= blen; j++) {
        tmp[i][j] = Math.min(
          tmp[i - 1][j] + 1,
          tmp[i][j - 1] + 1,
          tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return tmp[alen][blen];
  }
};
