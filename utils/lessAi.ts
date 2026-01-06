import { generateText } from '@rork-ai/toolkit-sdk';
import { LessAiResult, UserInsightProfile, AiTurn, RecentStats } from '@/types';
import { buildLessContextSnapshot } from '@/utils/lessAiMemory';

const LESS_SYSTEM_PROMPT = `You are "Less", the in-app coach for CraveLess. Your vibe is a trusted friend: warm, equal, and practical — never superior or preachy.
You are NOT a doctor, therapist, or dietitian. You do not diagnose or give medical/nutritional advice. You provide habit-support and general wellness guidance.

TONE
- Speak like a supportive friend: calm, kind, and real.
- Use "we" language and ask permission ("Want to try…?", "Would it help if…?").
- Keep it short and helpful. No lectures. No guilt.
- Avoid "you should / you must". Prefer "we could / one option is / if you're up for it".
- No emojis during active cravings. Outside cravings, at most one small emoji occasionally.

SMART BEHAVIOR (PATTERN-AWARE FRIEND)
- Always use the IMPORTANT CONTEXT snapshot and avoid repeating questions already answered.
- If a pattern has appeared >= 3 times OR confidence >= 0.65, treat it as likely true and DON'T re-ask.
- Reference patterns confidently: "This looks like a stress-driven moment" or "Night cravings tend to hit you hardest — let's pause first."
- When you reference patterns, say "based on your patterns" to show you remember.
- Ask at most ONE question only when missing critical info.
- Offer 2–3 better options when the user is stuck, and help them pick the easiest one.
- Focus on lowering urgency first (pause/grounding), then decisions (replacement/outcome), then reflection.

SAFETY & COMPLIANCE
Classify the user message into exactly one:
normal | slip | health_condition | disordered_eating | mental_distress | crisis | medical_request

- medical_request: gently refuse and suggest a licensed professional.
- health_condition: supportive habit guidance + remind to follow clinician advice for medical decisions.
- disordered_eating: avoid restrictive advice and streak talk; reduce pressure; encourage professional support.
- mental_distress: prioritize grounding and kindness; avoid goals/streak talk.
- crisis: encourage immediate local emergency help and reaching a trusted person now.

OUTPUT (STRICT JSON ONLY)
Return ONLY valid JSON matching this schema:

{
  "assistantMessage": "string",
  "classification": "normal|slip|health_condition|disordered_eating|mental_distress|crisis|medical_request",
  "quickActions": ["start_pause","log_emotion","log_intensity","choose_outcome","replacement_ideas","weekly_reflection"],
  "memoryUpdates": {
    "goalMode": "reduce|quit|weight|health|habit|null",
    "addTriggers": ["string"],
    "addSweetPreferences": ["string"],
    "addPeakTimes": ["string"],
    "tonePreference": "professional-calm|gentle|direct|null",
    "distressFlag": true|false
  }
}

RESPONSE QUALITY
- Start with validation: "Yeah, that makes sense."
- Then offer ONE main next step + 1–2 backup options.
- If the user asks "what should I do?", give 2–3 realistic options (not perfect ones).
- Never shame. Slips are learning moments.
- Use comparative reasoning when context shows deltas ("This started stronger than your usual" or "This is your peak time").`;

function extractJsonFromText(text: string): string | null {
  const trimmed = text.trim();
  
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    let jsonStr = jsonMatch[0];
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    return jsonStr;
  }
  
  return null;
}

function validateLessAiResult(parsed: any): parsed is LessAiResult {
  if (!parsed || typeof parsed !== 'object') return false;
  
  if (typeof parsed.assistantMessage !== 'string' || !parsed.assistantMessage.trim()) {
    console.warn('Invalid assistantMessage');
    return false;
  }
  
  const validClassifications = ['normal', 'slip', 'health_condition', 'disordered_eating', 'mental_distress', 'crisis', 'medical_request'];
  if (!validClassifications.includes(parsed.classification)) {
    console.warn('Invalid classification:', parsed.classification);
    return false;
  }
  
  if (!Array.isArray(parsed.quickActions)) {
    console.warn('Invalid quickActions: not an array');
    return false;
  }
  
  if (!parsed.memoryUpdates || typeof parsed.memoryUpdates !== 'object') {
    console.warn('Invalid memoryUpdates');
    return false;
  }
  
  return true;
}

function getSafeFallback(userMessage: string): LessAiResult {
  return {
    assistantMessage: "I'm here to help. Could you tell me more about what you're experiencing?",
    classification: 'normal',
    quickActions: ['start_pause'],
    memoryUpdates: {
      goalMode: null,
      addTriggers: [],
      addSweetPreferences: [],
      addPeakTimes: [],
      tonePreference: null,
      distressFlag: false,
    },
  };
}

export async function getLessAiReplyWithRetry(params: {
  userMessage: string;
  profile: UserInsightProfile;
  recentTurns: AiTurn[];
  stats: RecentStats;
  currentMoment?: {
    timeBucket?: string;
    intensity?: number;
    emotion?: string;
  };
  distressMode?: boolean;
}): Promise<LessAiResult> {
  const { userMessage, profile, recentTurns, stats, currentMoment, distressMode } = params;
  
  console.log('[Less AI] Starting request with user message:', userMessage.substring(0, 100));
  
  const contextSnapshot = buildLessContextSnapshot(profile, stats, currentMoment);
  
  const conversationHistory = recentTurns
    .slice(-6)
    .map(turn => `${turn.role === 'user' ? 'User' : 'Less'}: ${turn.content}`)
    .join('\n\n');
  
  let prompt = LESS_SYSTEM_PROMPT;
  prompt += `\n\n${contextSnapshot}`;
  
  if (conversationHistory) {
    prompt += `\n\nRecent conversation:\n${conversationHistory}`;
  }
  
  prompt += `\n\nUser message: ${userMessage}`;
  
  if (distressMode) {
    prompt += `\n\n[IMPORTANT: User is in distress mode - prioritize emotional safety, reduce pressure, no streak/goal talk]`;
  }
  
  try {
    console.log('[Less AI] Sending request to AI...');
    const response = await generateText({ messages: [{ role: 'user', content: prompt }] });
    console.log('[Less AI] Received response:', response.substring(0, 200));
    
    const jsonStr = extractJsonFromText(response);
    
    if (!jsonStr) {
      console.warn('[Less AI] No JSON found in response, attempting retry...');
      
      const retryPrompt = `${prompt}\n\n[SYSTEM: Previous response was not valid JSON. Return ONLY valid JSON matching the schema. No markdown, no extra text.]`;
      
      const retryResponse = await generateText({ messages: [{ role: 'user', content: retryPrompt }] });
      const retryJsonStr = extractJsonFromText(retryResponse);
      
      if (!retryJsonStr) {
        console.error('[Less AI] Retry failed, using fallback');
        return getSafeFallback(userMessage);
      }
      
      const retryParsed = JSON.parse(retryJsonStr);
      if (validateLessAiResult(retryParsed)) {
        console.log('[Less AI] Retry successful');
        return retryParsed;
      } else {
        console.error('[Less AI] Retry validation failed, using fallback');
        return getSafeFallback(userMessage);
      }
    }
    
    const parsed = JSON.parse(jsonStr);
    
    if (validateLessAiResult(parsed)) {
      console.log('[Less AI] Valid response received, classification:', parsed.classification);
      
      const crisisKeywords = ['kill', 'suicide', 'die', 'self harm', 'hurt myself', 'end it'];
      const hasCrisisKeyword = crisisKeywords.some(kw => userMessage.toLowerCase().includes(kw));
      
      if (hasCrisisKeyword && parsed.classification !== 'crisis') {
        console.warn('[Less AI] Safety override: crisis keywords detected');
        return {
          ...parsed,
          classification: 'crisis',
          assistantMessage: `I'm really glad you reached out.\n\nI can't support you through this alone — you deserve real help right now.\n\nPlease reach out immediately:\n• Contact emergency services in your country\n• Call a local crisis hotline\n• Reach out to a trusted person\n\nIf you're in the US:\n• Call or text 988 (Suicide & Crisis Lifeline)\n• Text HOME to 741741 (Crisis Text Line)\n\nYour safety matters most.`,
          quickActions: [],
          memoryUpdates: {
            ...parsed.memoryUpdates,
            distressFlag: true,
          },
        };
      }
      
      const disorderedKeywords = ['binge', 'purge', 'vomit', 'laxative', 'starve', 'punish myself'];
      const hasDisorderedKeyword = disorderedKeywords.some(kw => userMessage.toLowerCase().includes(kw));
      
      if (hasDisorderedKeyword && parsed.classification === 'normal') {
        console.warn('[Less AI] Safety override: disordered eating keywords detected');
        return {
          ...parsed,
          classification: 'disordered_eating',
          memoryUpdates: {
            ...parsed.memoryUpdates,
            distressFlag: true,
          },
        };
      }
      
      return parsed;
    } else {
      console.error('[Less AI] Validation failed, using fallback');
      return getSafeFallback(userMessage);
    }
  } catch (error) {
    console.error('[Less AI] Error in AI call:', error);
    return getSafeFallback(userMessage);
  }
}
