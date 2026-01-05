export type MessageCategory = 
  | 'normal-craving'
  | 'slip-overeating'
  | 'health-condition'
  | 'disordered-eating'
  | 'mental-distress'
  | 'crisis'
  | 'medical-advice-request'
  | 'general-support';

export type RiskLevel = 'low' | 'medium' | 'high' | 'crisis';

export interface SafetyAnalysis {
  category: MessageCategory;
  riskLevel: RiskLevel;
  triggeredKeywords: string[];
  shouldUseFallback: boolean;
  fallbackResponse?: string;
  safetyInstructions: string;
}

const MEDIUM_RISK_TRIGGERS = [
  'diabetes',
  'prediabetes',
  'doctor said',
  'health issue',
  'failed',
  'broke my streak',
  'disappointed in myself',
  'worthless',
  'shame',
  'guilty',
  'disgusted',
];

const MEDICAL_TRIGGERS = [
  'should i stop eating',
  'what should i eat',
  'meal plan',
  'diet plan',
  'how many calories',
  'prescription',
  'medication',
  'cure',
  'treat my',
  'diagnose',
  'medical advice',
];

const DISORDERED_EATING_TRIGGERS = [
  'binge',
  'purge',
  'throw up',
  'out of control',
  "can't control",
  'overeating',
  'ate too much',
  'punish myself',
  'restrict',
  'starve',
];

const CRISIS_TRIGGERS = [
  'kill myself',
  'suicide',
  'want to die',
  'end it all',
  'self harm',
  'hurt myself',
  "don't want to live",
];

const MENTAL_DISTRESS_TRIGGERS = [
  'hopeless',
  'hate myself',
  'worthless',
  'depressed',
  'anxious',
  'panic',
  'overwhelming',
  'tired of trying',
];

export function classifyMessage(message: string): SafetyAnalysis {
  const lowerMessage = message.toLowerCase();
  const triggeredKeywords: string[] = [];

  const checkTriggers = (triggers: string[]) => {
    return triggers.filter(trigger => {
      if (lowerMessage.includes(trigger)) {
        triggeredKeywords.push(trigger);
        return true;
      }
      return false;
    });
  };

  const crisisTriggers = checkTriggers(CRISIS_TRIGGERS);
  if (crisisTriggers.length > 0) {
    return {
      category: 'crisis',
      riskLevel: 'crisis',
      triggeredKeywords,
      shouldUseFallback: true,
      fallbackResponse: getCrisisFallback(),
      safetyInstructions: getCrisisSafetyInstructions(),
    };
  }

  const disorderedEatingTriggers = checkTriggers(DISORDERED_EATING_TRIGGERS);
  if (disorderedEatingTriggers.length > 0) {
    return {
      category: 'disordered-eating',
      riskLevel: 'high',
      triggeredKeywords,
      shouldUseFallback: true,
      fallbackResponse: getDisorderedEatingFallback(),
      safetyInstructions: getDisorderedEatingSafetyInstructions(),
    };
  }

  const medicalTriggers = checkTriggers(MEDICAL_TRIGGERS);
  if (medicalTriggers.length > 0) {
    return {
      category: 'medical-advice-request',
      riskLevel: 'high',
      triggeredKeywords,
      shouldUseFallback: true,
      fallbackResponse: getMedicalAdviceFallback(),
      safetyInstructions: getMedicalAdviceSafetyInstructions(),
    };
  }

  const mentalDistressTriggers = checkTriggers(MENTAL_DISTRESS_TRIGGERS);
  if (mentalDistressTriggers.length > 0) {
    return {
      category: 'mental-distress',
      riskLevel: 'high',
      triggeredKeywords,
      shouldUseFallback: false,
      safetyInstructions: getMentalDistressSafetyInstructions(),
    };
  }

  const mediumRiskTriggers = checkTriggers(MEDIUM_RISK_TRIGGERS);
  if (mediumRiskTriggers.length > 0) {
    if (mediumRiskTriggers.some(t => t.includes('diabetes') || t === 'prediabetes' || t === 'doctor said')) {
      return {
        category: 'health-condition',
        riskLevel: 'medium',
        triggeredKeywords,
        shouldUseFallback: false,
        safetyInstructions: getHealthConditionSafetyInstructions(),
      };
    }
    
    if (mediumRiskTriggers.some(t => ['failed', 'broke my streak', 'disappointed in myself'].includes(t))) {
      return {
        category: 'slip-overeating',
        riskLevel: 'medium',
        triggeredKeywords,
        shouldUseFallback: false,
        safetyInstructions: getSlipSafetyInstructions(),
      };
    }
  }

  if (lowerMessage.includes('craving') || lowerMessage.includes('want') || lowerMessage.includes('need')) {
    return {
      category: 'normal-craving',
      riskLevel: 'low',
      triggeredKeywords,
      shouldUseFallback: false,
      safetyInstructions: getNormalCravingSafetyInstructions(),
    };
  }

  return {
    category: 'general-support',
    riskLevel: 'low',
    triggeredKeywords,
    shouldUseFallback: false,
    safetyInstructions: getGeneralSupportInstructions(),
  };
}

function getCrisisFallback(): string {
  return `I'm really glad you reached out.

I can't support you through this alone — you deserve real help right now.

If you can, please reach out to:
• Emergency services (911 in the US)
• Crisis Text Line: Text HOME to 741741
• National Suicide Prevention Lifeline: 988
• Or a trusted person immediately

Your safety matters most.`;
}

function getDisorderedEatingFallback(): string {
  return `I'm really glad you said this. When eating feels out of control, strict rules can actually make things harder.

You're not broken — and this isn't a failure.

I'm here to help you reduce pressure, not add more.

If this keeps feeling overwhelming, talking to a professional could make a big difference. You deserve support that goes deeper than what I can offer.`;
}

function getMedicalAdviceFallback(): string {
  return `I can't help with medical or nutrition advice — that's outside my scope.

What I can do is help you slow down cravings and reduce pressure around them.

For health decisions, it's important to follow your healthcare provider's guidance. They know your specific situation best.`;
}

function getCrisisSafetyInstructions(): string {
  return `CRISIS MODE ACTIVE:
- User has expressed crisis-level distress
- DO NOT provide coaching or behavior advice
- Focus entirely on safety and getting help
- Be calm, direct, and compassionate
- Encourage immediate professional support
- No goal talk, no streak talk, no habit advice`;
}

function getDisorderedEatingSafetyInstructions(): string {
  return `DISORDERED EATING SENSITIVITY:
- NO restriction language
- NO "just resist" advice
- NO calorie/portion talk
- Emphasize self-compassion
- Validate without reinforcing harmful patterns
- Gently suggest professional support
- Focus on safety over goals
- Avoid any language about control or willpower`;
}

function getMedicalAdviceSafetyInstructions(): string {
  return `MEDICAL BOUNDARY:
- This is a medical advice request - REFUSE politely
- Redirect to healthcare provider
- Explain you're a habit coach, not medical professional
- Do not give any specific dietary instructions
- Do not suggest foods for medical conditions
- Keep response warm but firm`;
}

function getMentalDistressSafetyInstructions(): string {
  return `MENTAL DISTRESS MODE:
- User is experiencing shame/anxiety/hopelessness
- Validate emotion FIRST
- Reduce all pressure
- NO goals or streaks talk
- Focus on grounding and compassion
- Keep responses short and soothing
- Offer optional, tiny steps only
- Suggest professional help if appropriate`;
}

function getHealthConditionSafetyInstructions(): string {
  return `HEALTH CONDITION SENSITIVITY:
- User mentioned diabetes/prediabetes/doctor
- Stay calm and non-directive
- Acknowledge health makes cravings harder
- Defer to healthcare provider for medical decisions
- Focus on stress reduction and awareness
- No specific food recommendations
- No medical claims`;
}

function getSlipSafetyInstructions(): string {
  return `SLIP/OVEREATING RESPONSE:
- User mentioned giving in or failing
- NO punishment language
- NO "you broke your streak" talk
- Use neutral, learning-focused language
- Validate it's human
- Focus on information gathering, not shame
- "Today gave us information" approach
- Keep it light and forward-looking`;
}

function getNormalCravingSafetyInstructions(): string {
  return `NORMAL CRAVING SUPPORT:
- Standard craving coaching mode
- Use 4-step pattern: Acknowledge → Ground → Guide → Follow up
- Keep it short and practical
- Offer one technique at a time
- Validate the craving as normal
- No judgment, just support`;
}

function getGeneralSupportInstructions(): string {
  return `GENERAL SUPPORT MODE:
- Provide calm, empathetic responses
- Keep it conversational and natural
- Validate feelings
- Offer optional suggestions
- Stay within scope (habit awareness, not medical advice)`;
}

export function buildSafePrompt(
  userMessage: string,
  analysis: SafetyAnalysis,
  conversationHistory: string,
  isFirstMessage: boolean,
  userContext: {
    goalMode: string;
    cravingsLogged: number;
    cravingsResisted: number;
  }
): string {
  const baseIdentity = `You are Less, a wellness habit coach inside CraveLess.

CRITICAL - YOUR SCOPE:
- You are NOT a doctor, therapist, nutritionist, or dietitian
- You provide emotional support, craving awareness, and habit-building guidance ONLY
- You do NOT give medical advice, diagnoses, or dietary prescriptions
- If asked if you're a doctor: "I'm not a medical professional — I'm here to help you build awareness and control around cravings."

YOUR APPROACH:
- Calm, empathetic, non-judgmental
- Short responses (2-4 sentences usually)
- Validate feelings first
- One small optional step at a time
- Never shame or use fear
- Food is morally neutral

LANGUAGE RULES:
❌ NEVER say: "This will fix your diabetes", "You should stop eating X completely", "This food is bad", "You failed", "You must"
✅ ALWAYS prefer: "You might consider...", "Some people find...", "If it feels right for you...", "Let's explore what works for you"

CORE BELIEFS:
- Cravings are temporary, not failures
- Awareness beats restriction
- Delay is often enough
- Slips are data, not mistakes
- Habits change gradually
- Safety over streaks`;

  const contextSection = `
USER CONTEXT:
- Goal: ${userContext.goalMode}
- Cravings logged: ${userContext.cravingsLogged}
- Resisted: ${userContext.cravingsResisted}`;

  const conversationSection = isFirstMessage 
    ? `This is the user's FIRST message in a NEW conversation. Introduce yourself briefly as "Less" (1-2 sentences max) then respond to their message.`
    : `CONVERSATION HISTORY:
${conversationHistory}

This is an ONGOING conversation. DO NOT introduce yourself again. Just respond naturally to continue the conversation.`;

  const safetySection = `
SAFETY ANALYSIS FOR THIS MESSAGE:
Category: ${analysis.category}
Risk Level: ${analysis.riskLevel}
${analysis.triggeredKeywords.length > 0 ? `Triggered Keywords: ${analysis.triggeredKeywords.join(', ')}` : ''}

${analysis.safetyInstructions}`;

  const userMessageSection = `
USER MESSAGE: ${userMessage}`;

  const responseGuidance = isFirstMessage
    ? `Respond as Less with a natural, conversational reply. Keep your introduction brief then address their message.`
    : `Continue the conversation naturally. Stay in character as Less and respond appropriately to the safety context.`;

  return `${baseIdentity}

${contextSection}

${conversationSection}

${safetySection}

${userMessageSection}

${responseGuidance}`;
}
