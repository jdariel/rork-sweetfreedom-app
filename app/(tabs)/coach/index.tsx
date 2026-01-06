import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import colors from '@/constants/colors';
import { Send, Sparkles, Heart, CheckCircle2, MessageCircle, Play, Heart as HeartIcon, Sliders, ListChecks, Lightbulb, CalendarDays } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useRewards } from '@/contexts/RewardsContext';
import { getLessAiReplyWithRetry } from '@/utils/lessAi';
import { loadUserInsightProfile, saveUserInsightProfile, loadAiTurns, addAiTurn, buildRecentStats, applyMemoryUpdates, inferSignalsFromUserText, incrementStat, clearAiTurns } from '@/utils/lessAiMemory';
import { useRouter } from 'expo-router';
import { UserInsightProfile } from '@/types';

export default function CoachScreen() {
  const [input, setInput] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);
  const { coachMessages, addCoachMessage, cravings, profile, activateDistressMode, markMessageHelpCheckComplete, clearCoachConversation } = useApp();
  const { awardXP } = useRewards();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [insightProfile, setInsightProfile] = useState<UserInsightProfile | null>(null);
  const [lastQuickActions, setLastQuickActions] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadUserInsightProfile().then(setInsightProfile);
  }, []);

  useEffect(() => {
    if (coachMessages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [coachMessages]);



  const handleSend = async () => {
    if (!input.trim() || !insightProfile) return;
    
    const userMessage = input.trim();
    setInput('');
    
    if (userMessage.toLowerCase() === 'new chat') {
      await clearAiTurns();
      clearCoachConversation();
      setLastQuickActions([]);
      console.log('[Coach] New chat started - conversation cleared');
      return;
    }
    
    addCoachMessage({ role: 'user', content: userMessage });
    awardXP('coach-message', profile?.isInDistressMode || false, profile?.lastActiveDate);
    await addAiTurn('user', userMessage);
    
    setIsLoading(true);
    
    try {
      const inferred = inferSignalsFromUserText(userMessage);
      console.log('[Coach] Inferred signals:', inferred);
      
      let updatedProfile = { ...insightProfile };
      
      if (!profile?.isInDistressMode) {
        if (inferred.inferredTimeBucket) {
          const timeStats = updatedProfile.timeBucketStats || {};
          updatedProfile.timeBucketStats = incrementStat(timeStats, inferred.inferredTimeBucket, 1);
        }
        
        inferred.inferredTriggers.forEach(trigger => {
          const triggerStats = updatedProfile.triggerStats || {};
          updatedProfile.triggerStats = incrementStat(triggerStats, trigger, 1);
        });
        
        inferred.inferredEmotions.forEach(emotion => {
          const emotionStats = updatedProfile.emotionStats || {};
          updatedProfile.emotionStats = incrementStat(emotionStats, emotion, 1);
        });
        
        inferred.inferredSweetPrefs.forEach(sweet => {
          const sweetStats = updatedProfile.sweetPreferenceStats || {};
          updatedProfile.sweetPreferenceStats = incrementStat(sweetStats, sweet, 1);
        });
        
        await saveUserInsightProfile(updatedProfile);
        setInsightProfile(updatedProfile);
      }
      
      const recentTurns = await loadAiTurns();
      const stats = buildRecentStats(cravings);
      
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentCravings = cravings.filter(c => c.timestamp >= sevenDaysAgo);
      const avgIntensity = recentCravings.length > 0
        ? recentCravings.reduce((sum, c) => sum + c.intensity, 0) / recentCravings.length
        : 0;
      
      const currentMoment = inferred.inferredTimeBucket || inferred.inferredEmotions.length > 0
        ? {
            timeBucket: inferred.inferredTimeBucket,
            emotion: inferred.inferredEmotions[0],
            avgIntensity,
          }
        : undefined;
      
      const result = await getLessAiReplyWithRetry({
        userMessage,
        profile: updatedProfile,
        recentTurns,
        stats,
        currentMoment,
        distressMode: profile?.isInDistressMode,
      });
      
      addCoachMessage({ role: 'assistant', content: result.assistantMessage, needsHelpCheck: true });
      await addAiTurn('assistant', result.assistantMessage);
      
      setLastQuickActions(result.quickActions);
      
      const finalProfile = applyMemoryUpdates(updatedProfile, result.memoryUpdates);
      await saveUserInsightProfile(finalProfile);
      setInsightProfile(finalProfile);
      
      if (result.memoryUpdates.distressFlag && !profile?.isInDistressMode) {
        activateDistressMode();
      }
      
      console.log('[Coach] AI response completed, classification:', result.classification);
    } catch (error) {
      console.error('[Coach] Error getting AI response:', error);
      addCoachMessage({ 
        role: 'assistant', 
        content: "I'm having trouble connecting right now. Could you try again?",
        needsHelpCheck: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "I'm having a strong craving right now",
    "I gave in today and need support",
    "Help me understand my triggers",
    "How do I delay this craving?",
  ];

  const quickActionLabels: Record<string, { label: string; icon: any; subtitle: string }> = {
    start_pause: { label: 'Pause with me', icon: Play, subtitle: 'Just to slow things down — no decisions yet.' },
    log_emotion: { label: 'Name the vibe', icon: HeartIcon, subtitle: 'All answers count.' },
    log_intensity: { label: 'Check the volume', icon: Sliders, subtitle: 'How strong is it?' },
    choose_outcome: { label: 'What happened?', icon: ListChecks, subtitle: 'Learning moment.' },
    replacement_ideas: { label: 'Other options', icon: Lightbulb, subtitle: 'Try this instead.' },
    weekly_reflection: { label: 'Look back together', icon: CalendarDays, subtitle: 'See your patterns.' },
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'start_pause':
        router.push('/delay-flow' as any);
        break;
      case 'log_emotion':
      case 'log_intensity':
        router.push('/log-craving' as any);
        break;
      case 'choose_outcome':
        router.push('/log-craving' as any);
        break;
      case 'replacement_ideas':
        router.push('/log-craving' as any);
        break;
      case 'weekly_reflection':
        router.push('/weekly-reflection' as any);
        break;
    }
  };

  const handleHelpResponse = async (wasHelpful: boolean, messageId: string) => {
    if (wasHelpful) {
      awardXP('coach-helped', profile?.isInDistressMode || false, profile?.lastActiveDate);
      setLastQuickActions([]);
      markMessageHelpCheckComplete(messageId);
      
      await clearAiTurns();
      clearCoachConversation();
      console.log('[Coach] Conversation cleared - ready for new topic');
    } else {
      if (!insightProfile) return;
      
      setIsLoading(true);
      const lastUserMessage = coachMessages
        .filter(m => m.role === 'user')
        .slice(-1)[0]?.content || 'I need more help';
      
      try {
        const recentTurns = await loadAiTurns();
        const stats = buildRecentStats(cravings);
        
        const result = await getLessAiReplyWithRetry({
          userMessage: lastUserMessage + ' [Need more help - try different approach]',
          profile: insightProfile,
          recentTurns,
          stats,
          distressMode: profile?.isInDistressMode,
        });
        
        addCoachMessage({ role: 'assistant', content: result.assistantMessage, needsHelpCheck: true });
        await addAiTurn('assistant', result.assistantMessage);
        setLastQuickActions(result.quickActions);
        
        const updatedProfile = applyMemoryUpdates(insightProfile, result.memoryUpdates);
        await saveUserInsightProfile(updatedProfile);
        setInsightProfile(updatedProfile);
      } catch (error) {
        console.error('[Coach] Error in retry:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const lastAIMessage = coachMessages.length > 0 && coachMessages[coachMessages.length - 1].role === 'assistant' 
    ? coachMessages[coachMessages.length - 1] 
    : null;
  const shouldShowHelpCheck = lastAIMessage?.needsHelpCheck && !isLoading;
  const shouldShowQuickActions = lastQuickActions.length > 0 && !isLoading;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {coachMessages.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.iconContainer}>
            <Sparkles size={48} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Hey, I&apos;m Less</Text>
          <Text style={styles.emptySubtitle}>
            Your calm coach for cravings. I&apos;m here to help you pause, reflect, and regain control. Share what&apos;s on your mind:
          </Text>
          <View style={styles.quickPromptsList}>
            {quickPrompts.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickPromptButton}
                onPress={async () => {
                  if (!insightProfile) return;
                  
                  addCoachMessage({ role: 'user', content: prompt });
                  awardXP('coach-message', profile?.isInDistressMode || false, profile?.lastActiveDate);
                  await addAiTurn('user', prompt);
                  
                  setIsLoading(true);
                  
                  try {
                    const inferred = inferSignalsFromUserText(prompt);
                    console.log('[Coach] Inferred signals:', inferred);
                    
                    let updatedProfile = { ...insightProfile };
                    
                    if (!profile?.isInDistressMode) {
                      if (inferred.inferredTimeBucket) {
                        const timeStats = updatedProfile.timeBucketStats || {};
                        updatedProfile.timeBucketStats = incrementStat(timeStats, inferred.inferredTimeBucket, 1);
                      }
                      
                      inferred.inferredTriggers.forEach(trigger => {
                        const triggerStats = updatedProfile.triggerStats || {};
                        updatedProfile.triggerStats = incrementStat(triggerStats, trigger, 1);
                      });
                      
                      inferred.inferredEmotions.forEach(emotion => {
                        const emotionStats = updatedProfile.emotionStats || {};
                        updatedProfile.emotionStats = incrementStat(emotionStats, emotion, 1);
                      });
                      
                      inferred.inferredSweetPrefs.forEach(sweet => {
                        const sweetStats = updatedProfile.sweetPreferenceStats || {};
                        updatedProfile.sweetPreferenceStats = incrementStat(sweetStats, sweet, 1);
                      });
                      
                      await saveUserInsightProfile(updatedProfile);
                      setInsightProfile(updatedProfile);
                    }
                    
                    const recentTurns = await loadAiTurns();
                    const stats = buildRecentStats(cravings);
                    
                    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                    const recentCravings = cravings.filter(c => c.timestamp >= sevenDaysAgo);
                    const avgIntensity = recentCravings.length > 0
                      ? recentCravings.reduce((sum, c) => sum + c.intensity, 0) / recentCravings.length
                      : 0;
                    
                    const currentMoment = inferred.inferredTimeBucket || inferred.inferredEmotions.length > 0
                      ? {
                          timeBucket: inferred.inferredTimeBucket,
                          emotion: inferred.inferredEmotions[0],
                          avgIntensity,
                        }
                      : undefined;
                    
                    const result = await getLessAiReplyWithRetry({
                      userMessage: prompt,
                      profile: updatedProfile,
                      recentTurns,
                      stats,
                      currentMoment,
                      distressMode: profile?.isInDistressMode,
                    });
                    
                    addCoachMessage({ role: 'assistant', content: result.assistantMessage, needsHelpCheck: true });
                    await addAiTurn('assistant', result.assistantMessage);
                    setLastQuickActions(result.quickActions);
                    
                    const finalProfile = applyMemoryUpdates(updatedProfile, result.memoryUpdates);
                    await saveUserInsightProfile(finalProfile);
                    setInsightProfile(finalProfile);
                    
                    if (result.memoryUpdates.distressFlag) {
                      activateDistressMode();
                    }
                  } catch (error) {
                    console.error('[Coach] Error:', error);
                    addCoachMessage({ 
                      role: 'assistant', 
                      content: "I'm having trouble connecting. Could you try again?",
                      needsHelpCheck: false,
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                <Text style={styles.quickPromptText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {coachMessages.map((m) => (
            <View key={m.id} style={styles.messageWrapper}>
              {m.role === 'assistant' && (
                <View style={styles.coachIconContainer}>
                  <Heart size={16} color={colors.primary} fill={colors.primary} />
                </View>
              )}
              <View style={styles.messageContent}>
                <View
                  style={[
                    styles.messageBubble,
                    m.role === 'user' ? styles.userBubble : styles.assistantBubble
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      m.role === 'user' ? styles.userText : styles.assistantText
                    ]}
                  >
                    {m.content}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          {isLoading && (
            <View style={styles.messageWrapper}>
              <View style={styles.coachIconContainer}>
                <Heart size={16} color={colors.primary} fill={colors.primary} />
              </View>
              <View style={styles.messageContent}>
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              </View>
            </View>
          )}
          {shouldShowQuickActions && (
            <View style={styles.quickActionsContainer}>
              <Text style={styles.quickActionsTitle}>Try this:</Text>
              <View style={styles.quickActionsGrid}>
                {lastQuickActions.slice(0, 3).map((action) => {
                  const actionData = quickActionLabels[action];
                  if (!actionData) return null;
                  const Icon = actionData.icon;
                  return (
                    <TouchableOpacity
                      key={action}
                      style={styles.quickActionCard}
                      onPress={() => handleQuickAction(action)}
                    >
                      <View style={styles.quickActionIcon}>
                        <Icon size={20} color={colors.primary} />
                      </View>
                      <Text style={styles.quickActionLabel}>{actionData.label}</Text>
                      <Text style={styles.quickActionSubtitle}>{actionData.subtitle}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
          {shouldShowHelpCheck && lastAIMessage && (
            <View style={styles.helpCheckContainer}>
              <Text style={styles.helpCheckText}>Did this help?</Text>
              <View style={styles.helpCheckButtons}>
                <TouchableOpacity
                  style={styles.helpCheckButton}
                  onPress={() => handleHelpResponse(true, lastAIMessage.id)}
                >
                  <CheckCircle2 size={18} color={colors.calm.teal} />
                  <Text style={styles.helpCheckButtonText}>Yes, thanks</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.helpCheckButton, styles.helpCheckButtonSecondary]}
                  onPress={() => handleHelpResponse(false, lastAIMessage.id)}
                >
                  <MessageCircle size={18} color={colors.textSecondary} />
                  <Text style={[styles.helpCheckButtonText, styles.helpCheckButtonTextSecondary]}>Need more help</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor={colors.textLight}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim()}
        >
          <Send size={20} color={input.trim() ? colors.surface : colors.textLight} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.calm.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  quickPromptsList: {
    width: '100%',
    gap: 12,
  },
  quickPromptButton: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickPromptText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  messageWrapper: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  coachIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.calm.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  messageContent: {
    flex: 1,
  },
  messageBubble: {
    borderRadius: 20,
    padding: 16,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  userText: {
    color: colors.surface,
    fontWeight: '500' as const,
  },
  assistantText: {
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  helpCheckContainer: {
    marginTop: 12,
    marginLeft: 40,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpCheckText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  helpCheckButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  helpCheckButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.calm.tealLight,
    borderRadius: 12,
  },
  helpCheckButtonSecondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpCheckButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.calm.teal,
  },
  helpCheckButtonTextSecondary: {
    color: colors.textSecondary,
  },
  quickActionsContainer: {
    marginTop: 16,
    marginLeft: 40,
    marginBottom: 12,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 100,
    maxWidth: '48%',
    flex: 1,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.calm.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 14,
  },
});
