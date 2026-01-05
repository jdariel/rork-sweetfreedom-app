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
  shouldActivateDistressMode: boolean;
  shouldPauseStreaks: boolean;
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
  'hate myself for',
  'ruined',
  'messed up',
  'why did i',
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
  'purging',
  'throw up',
  'vomiting',
  'laxatives',
  'out of control',
  "can't control",
  'ate too much',
  'punish myself',
  'restrict',
  'starve',
  'stop eating',
  "don't deserve",
  'fast for',
  'fasting for',
  'water fast',
  'cleanse',
  'detox',
  'compensate',
];

const CRISIS_TRIGGERS = [
  'kill myself',
  'suicide',
  'want to die',
  'end it all',
  'end my life',
  'self harm',
  'hurt myself',
  'cut myself',
  'overdose',
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
      const escapedTrigger = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedTrigger}\\b`, 'i');
      if (regex.test(lowerMessage)) {
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
      shouldActivateDistressMode: true,
      shouldPauseStreaks: true,
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
      shouldActivateDistressMode: true,
      shouldPauseStreaks: true,
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
      shouldActivateDistressMode: false,
      shouldPauseStreaks: false,
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
      shouldActivateDistressMode: true,
      shouldPauseStreaks: true,
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
        shouldActivateDistressMode: false,
        shouldPauseStreaks: false,
      };
    }
    
    if (mediumRiskTriggers.some(t => ['failed', 'broke my streak', 'disappointed in myself', 'shame', 'guilty', 'disgusted', 'hate myself for', 'ruined', 'messed up', 'why did i'].includes(t))) {
      return {
        category: 'slip-overeating',
        riskLevel: 'medium',
        triggeredKeywords,
        shouldUseFallback: false,
        safetyInstructions: getSlipSafetyInstructions(),
        shouldActivateDistressMode: false,
        shouldPauseStreaks: true,
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
      shouldActivateDistressMode: false,
      shouldPauseStreaks: false,
    };
  }

  return {
    category: 'general-support',
    riskLevel: 'low',
    triggeredKeywords,
    shouldUseFallback: false,
    safetyInstructions: getGeneralSupportInstructions(),
    shouldActivateDistressMode: false,
    shouldPauseStreaks: false,
  };
}

function getCrisisFallback(): string {
  return `I'm really glad you reached out.

I can't support you through this alone — you deserve real help right now.

Please reach out immediately:
• Contact emergency services in your country
• Call a local crisis hotline
• Reach out to a trusted person

If you're in the US:
• Call or text 988 (Suicide & Crisis Lifeline)
• Text HOME to 741741 (Crisis Text Line)
• Call 911 for emergencies

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
  return `DISORDERED EATING SENSITIVITY (MAXIMUM PRIORITY):
- CRITICAL: NO restriction language of any kind
- NO "just resist" or "try harder" advice
- NO calorie/portion/macro talk
- NO food rules or "should/shouldn't eat X"
- NO language about control, willpower, or discipline
- Emphasize self-compassion and safety above all
- Validate without reinforcing harmful patterns
- Strongly suggest professional support
- Focus entirely on reducing pressure
- Never frame eating as success/failure
- NEVER mention streaks, progress, or goals
- Remove all performance expectations`;
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
  return `MENTAL DISTRESS MODE (MAXIMUM SAFETY):
- User is experiencing shame/anxiety/hopelessness
- Validate emotion FIRST - nothing else matters
- ZERO pressure, ZERO goals, ZERO streaks
- Remove all performance language
- Focus entirely on grounding and compassion
- Keep responses very short (1-2 sentences)
- Offer optional, tiny steps only if they ask
- Never imply they should "do better"
- Suggest professional help if distress is intense
- Frame everything as "you're safe, nothing is broken"`;
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
  return `SLIP/OVEREATING RESPONSE (CRITICAL - NO STREAK TALK):
- User mentioned giving in or failing
- NEVER mention streaks, progress lost, or "starting over"
- NO punishment language whatsoever
- NO "you broke your streak" or "back to zero" talk
- Use neutral, learning-focused language ONLY
- Frame as: "This gave us information" not "you failed"
- Validate it's completely human and normal
- Focus on what triggered it (curiosity, not judgment)
- Ask: "What do you think led to this?" not "Why did you do it?"
- Keep it extremely light and forward-looking
- Emphasize: One moment doesn't define anything
- NO goals talk, NO "get back on track" language`;
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

function getTimeOfDayContext(): string {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return `TIME: Morning (${hour}:00)
- Fresh start energy, new day mindset
- Common triggers: breakfast sweets, coffee shop temptations
- Tone: Energizing, optimistic, "you've got this today" vibe
- Techniques: Set intentions, plan ahead for afternoon cravings`;
  } else if (hour >= 12 && hour < 17) {
    return `TIME: Afternoon (${hour}:00)
- Post-lunch energy dip, stress from work
- Common triggers: 3pm slump, vending machines, office treats
- Tone: Supportive, grounding, "let's take a breath" vibe
- Techniques: Quick walks, hydration, short delays`;
  } else if (hour >= 17 && hour < 22) {
    return `TIME: Evening (${hour}:00)
- Winding down, transition from work, family time
- Common triggers: After-dinner dessert habits, TV snacking, reward mentality
- Tone: Calm, reflective, "you made it through the day" vibe
- Techniques: Alternative rewards, evening routines, stress release`;
  } else {
    return `TIME: Late Night (${hour}:00)
- Sleep-related stress, emotional vulnerability, fatigue
- Common triggers: Boredom, loneliness, anxiety, sleep procrastination
- Tone: Extra gentle, minimal pressure, "rest is important" vibe
- Techniques: Focus on sleep hygiene, emotional soothing, compassion`;
  }
}

function getGoalModeGuidance(goalMode: string): string {
  switch (goalMode) {
    case 'quit':
      return `GOAL MODE: Quit Sugar
- User wants complete elimination of added sugars
- Frame delays as "protecting your commitment"
- Emphasize identity shift: "I don't eat sugar" vs "I can't"
- Celebrate clean days strongly
- When slips happen: "This doesn't erase your decision"`;
    
    case 'reduce':
      return `GOAL MODE: Reduce Gradually
- User is cutting back step-by-step, not eliminating
- Small portions are SUCCESS, not failure
- Track reduction trends, not perfection
- Frame: "You're building flexibility, not restriction"
- Celebrate progress like "3 times this week vs 7 last week"`;
    
    case 'weight-loss':
      return `GOAL MODE: Weight Loss (HIGH SENSITIVITY)
- CRITICAL: Extra careful about disordered eating language
- NEVER mention calories, weight numbers, or body size
- Frame sugar control as energy/clarity, not weight
- Focus: "How do you feel after eating sweets?" not "will this make you gain weight"
- If they mention weight frustration: redirect to non-scale victories
- Keep it about habits, never about body`;
    
    case 'diabetes':
      return `GOAL MODE: Diabetes Management (MEDICAL BOUNDARY)
- User has a medical condition - stay in scope
- Acknowledge: "Health conditions make cravings feel more serious"
- Always defer: "Follow your provider's guidance on what to eat"
- Focus on: Stress reduction, craving awareness, delay techniques
- NO specific food advice or blood sugar claims
- Frame: "Managing the urge" not "managing diabetes"`;
    
    case 'habit-control':
      return `GOAL MODE: Habit Control (EMOTIONAL FOCUS)
- User wants to break emotional eating patterns
- This is about feelings, not food
- Ask: "What emotion is under this craving?"
- Techniques: Journaling, emotional awareness, trigger mapping
- Celebrate: "You noticed the pattern" not just "you resisted"
- Focus: Building awareness and alternative coping skills`;
    
    default:
      return `GOAL MODE: Not set
- Approach with general craving support
- Help user explore their "why" for managing cravings`;
  }
}

function getVariationGuidance(conversationHistory: string): string {
  const recentMessages = conversationHistory.toLowerCase();
  const usedPhrases: string[] = [];
  
  if (recentMessages.includes('take a breath') || recentMessages.includes('breathe')) {
    usedPhrases.push('breathing');
  }
  if (recentMessages.includes('pause') || recentMessages.includes('wait')) {
    usedPhrases.push('pausing');
  }
  if (recentMessages.includes('temporary') || recentMessages.includes('will pass')) {
    usedPhrases.push('temporary nature');
  }
  if (recentMessages.includes('walk') || recentMessages.includes('move')) {
    usedPhrases.push('physical movement');
  }
  if (recentMessages.includes('drink water') || recentMessages.includes('hydrate')) {
    usedPhrases.push('hydration');
  }
  
  if (usedPhrases.length === 0) {
    return `VARIATION: First interaction - use any techniques naturally.`;
  }
  
  return `VARIATION GUIDANCE (AVOID REPETITION):
- You've recently used these approaches: ${usedPhrases.join(', ')}
- Try a DIFFERENT technique this time
- Vary your opening: Don't always say "I hear you" or "That makes sense"
- Alternative techniques: sensory grounding (5 things you see), urge surfing, future self visualization, tracking intensity, identifying specific triggers, replacement activities
- Mix up your language: Sometimes ask questions, sometimes give statements, sometimes offer choices
- Don't repeat the same structure: Acknowledge → Technique → Encouragement gets stale`;
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

  const timeContext = getTimeOfDayContext();
  const goalGuidance = getGoalModeGuidance(userContext.goalMode);
  const variationGuidance = getVariationGuidance(conversationHistory);
  
  const contextSection = `
USER CONTEXT:
- Cravings logged: ${userContext.cravingsLogged}
- Resisted: ${userContext.cravingsResisted}

${goalGuidance}

${timeContext}

${variationGuidance}`;

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
