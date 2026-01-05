import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRorkAgent } from '@rork-ai/toolkit-sdk';
import colors from '@/constants/colors';
import { Send, Sparkles, Heart, CheckCircle2, MessageCircle } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { classifyMessage, buildSafePrompt } from '@/utils/aiSafetyFilters';

export default function CoachScreen() {
  const [input, setInput] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);
  const { coachMessages, addCoachMessage, clearCoachMessages, markMessageHelpCheckComplete, cravings, profile, activateDistressMode, pauseStreak } = useApp();
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { messages, sendMessage, setMessages } = useRorkAgent({
    tools: {},
  });

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && isStreaming) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        const textParts = lastMessage.parts.filter(part => {
          if (part.type !== 'text') return false;
          const text = part.text.trim();
          if (text.includes('<function_calls>') || 
              text.includes('<invoke') || 
              text.includes('</function_calls>')) {
            return false;
          }
          return text.length > 0;
        });

        if (textParts.length > 0) {
          const content = textParts.map(p => p.type === 'text' ? p.text : '').join('\n').trim();
          if (content) {
            setStreamingContent(content);
          }
        }
      }
    }
  }, [messages, isStreaming]);

  useEffect(() => {
    if (messages.length > 0 && isStreaming && streamingContent) {
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }
      
      streamTimeoutRef.current = setTimeout(() => {
        const isDuplicate = coachMessages.some(m => 
          m.content === streamingContent && m.role === 'assistant'
        );
        if (!isDuplicate) {
          addCoachMessage({ role: 'assistant', content: streamingContent, needsHelpCheck: true });
        }
        setIsStreaming(false);
        setStreamingContent('');
      }, 1000);
      
      return () => {
        if (streamTimeoutRef.current) {
          clearTimeout(streamTimeoutRef.current);
        }
      };
    }
  }, [messages, isStreaming, streamingContent, coachMessages, addCoachMessage]);

  const handleSend = () => {
    if (input.trim()) {
      const userMessage = input.trim();
      
      const safetyAnalysis = classifyMessage(userMessage);
      
      if (safetyAnalysis.shouldActivateDistressMode) {
        activateDistressMode();
      }
      
      if (safetyAnalysis.shouldPauseStreaks) {
        pauseStreak();
      }
      
      addCoachMessage({ role: 'user', content: userMessage });
      
      if (safetyAnalysis.shouldUseFallback && safetyAnalysis.fallbackResponse) {
        addCoachMessage({ role: 'assistant', content: safetyAnalysis.fallbackResponse, needsHelpCheck: true });
        setInput('');
        return;
      }
      
      const conversationHistory = coachMessages.map(m => 
        `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`
      ).join('\n\n');
      
      const isFirstMessage = coachMessages.length === 0;
      
      const contextPrompt = buildSafePrompt(
        userMessage,
        safetyAnalysis,
        conversationHistory,
        isFirstMessage,
        {
          goalMode: profile?.goalMode || 'not set',
          cravingsLogged: cravings.length,
          cravingsResisted: cravings.filter(c => c.outcome === 'resisted').length,
        }
      );
      
      setIsStreaming(true);
      setStreamingContent('');
      sendMessage(contextPrompt);
      setInput('');
    }
  };

  const quickPrompts = [
    "I'm having a strong craving right now",
    "I gave in today and need support",
    "Help me understand my triggers",
    "How do I delay this craving?",
  ];

  const handleHelpResponse = (messageId: string, wasHelpful: boolean) => {
    markMessageHelpCheckComplete(messageId);
    
    if (wasHelpful) {
      setTimeout(() => {
        clearCoachMessages();
        setMessages([]);
      }, 500);
    } else {
      const lastUserMessage = coachMessages
        .filter(m => m.role === 'user')
        .slice(-1)[0]?.content || '';
      
      const safetyAnalysis = classifyMessage(lastUserMessage);
      
      const conversationHistory = coachMessages.map(m => 
        `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`
      ).join('\n\n');
      
      const contextPrompt = buildSafePrompt(
        lastUserMessage,
        safetyAnalysis,
        conversationHistory,
        false,
        {
          goalMode: profile?.goalMode || 'not set',
          cravingsLogged: cravings.length,
          cravingsResisted: cravings.filter(c => c.outcome === 'resisted').length,
        }
      ) + '\n\n[USER FEEDBACK: Need more help - try different approach]';
      
      setIsStreaming(true);
      setStreamingContent('');
      sendMessage(contextPrompt);
    }
  };

  const lastAIMessage = coachMessages.length > 0 && coachMessages[coachMessages.length - 1].role === 'assistant' 
    ? coachMessages[coachMessages.length - 1] 
    : null;
  const shouldShowHelpCheck = lastAIMessage?.needsHelpCheck && !isStreaming;

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
                onPress={() => {
                  const safetyAnalysis = classifyMessage(prompt);
                  
                  if (safetyAnalysis.shouldActivateDistressMode) {
                    activateDistressMode();
                  }
                  
                  if (safetyAnalysis.shouldPauseStreaks) {
                    pauseStreak();
                  }
                  
                  addCoachMessage({ role: 'user', content: prompt });
                  
                  if (safetyAnalysis.shouldUseFallback && safetyAnalysis.fallbackResponse) {
                    addCoachMessage({ role: 'assistant', content: safetyAnalysis.fallbackResponse, needsHelpCheck: true });
                    return;
                  }
                  
                  const contextPrompt = buildSafePrompt(
                    prompt,
                    safetyAnalysis,
                    '',
                    true,
                    {
                      goalMode: profile?.goalMode || 'not set',
                      cravingsLogged: cravings.length,
                      cravingsResisted: cravings.filter(c => c.outcome === 'resisted').length,
                    }
                  );
                  
                  setIsStreaming(true);
                  setStreamingContent('');
                  sendMessage(contextPrompt);
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
          {isStreaming && streamingContent && (
            <View style={styles.messageWrapper}>
              <View style={styles.coachIconContainer}>
                <Heart size={16} color={colors.primary} fill={colors.primary} />
              </View>
              <View style={styles.messageContent}>
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <Text style={[styles.messageText, styles.assistantText]}>
                    {streamingContent}
                  </Text>
                </View>
              </View>
            </View>
          )}
          {shouldShowHelpCheck && lastAIMessage && (
            <View style={styles.helpCheckContainer}>
              <Text style={styles.helpCheckText}>Did this help?</Text>
              <View style={styles.helpCheckButtons}>
                <TouchableOpacity
                  style={styles.helpCheckButton}
                  onPress={() => handleHelpResponse(lastAIMessage.id, true)}
                >
                  <CheckCircle2 size={18} color={colors.calm.teal} />
                  <Text style={styles.helpCheckButtonText}>Yes, thanks</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.helpCheckButton, styles.helpCheckButtonSecondary]}
                  onPress={() => handleHelpResponse(lastAIMessage.id, false)}
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
});
