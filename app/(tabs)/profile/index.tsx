import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Share } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { goalModeData } from '@/constants/goalModes';
import colors from '@/constants/colors';
import { User, Target, Calendar, Award, AlertCircle, ExternalLink, Download, Trash2, MessageSquareOff, Gift, Bug } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { loadUserInsightProfile, buildRecentStats, buildLessContextSnapshot, topK } from '@/utils/lessAiMemory';
import { UserInsightProfile } from '@/types';

export default function ProfileScreen() {
  const { profile, streak, cravings, coachMessages, exportData, clearAllData, clearCoachMessages, getUnlockedItems } = useApp();
  const router = useRouter();
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [insightProfile, setInsightProfile] = useState<UserInsightProfile | null>(null);
  const [contextSnapshot, setContextSnapshot] = useState<string>('');

  useEffect(() => {
    loadUserInsightProfile().then(profile => {
      setInsightProfile(profile);
      if (profile) {
        const stats = buildRecentStats(cravings);
        const snapshot = buildLessContextSnapshot(profile, stats);
        setContextSnapshot(snapshot);
      }
    });
  }, [cravings]);

  if (!profile) {
    return null;
  }

  const goalData = goalModeData[profile.goalMode];
  const memberSince = new Date(profile.startDate).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const unlockedItems = getUnlockedItems();

  const handleExportData = async () => {
    try {
      const data = exportData();
      const jsonString = JSON.stringify(data, null, 2);
      
      if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `craveless-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        await Share.share({
          message: jsonString,
          title: 'CraveLess Data Export',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
    }
  };

  const handleClearCoachChat = () => {
    Alert.alert(
      'Clear Coach Chat',
      `This will permanently delete all ${coachMessages.length} coach messages. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Chat',
          style: 'destructive',
          onPress: () => {
            clearCoachMessages();
            Alert.alert('Success', 'Coach chat cleared.');
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete your profile, all cravings, streaks, and coach messages. This cannot be undone.\n\nConsider exporting your data first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              router.replace('/onboarding' as any);
            } catch (error) {
              console.error('Clear error:', error);
              Alert.alert('Error', 'Could not clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const topTriggers = insightProfile?.triggerStats ? topK(insightProfile.triggerStats, 5) : [];
  const topTimeBuckets = insightProfile?.timeBucketStats ? topK(insightProfile.timeBucketStats, 3) : [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <User size={48} color={colors.primary} />
          </View>
          <Text style={styles.userName}>Your Journey</Text>
          <Text style={styles.memberSince}>Member since {memberSince}</Text>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Target size={24} color={colors.primary} />
            <Text style={styles.goalCardTitle}>Current Goal</Text>
          </View>
          <View style={styles.goalContent}>
            <Text style={styles.goalEmoji}>{goalData.emoji}</Text>
            <View>
              <Text style={styles.goalTitle}>{goalData.title}</Text>
              <Text style={styles.goalDescription}>{goalData.description}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.calm.peachLight }]}>
                <Calendar size={24} color={colors.secondary} />
              </View>
              <Text style={styles.statValue}>{streak.current}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.calm.sage }]}>
                <Award size={24} color={colors.success} />
              </View>
              <Text style={styles.statValue}>{streak.longest}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
          </View>
        </View>

        {unlockedItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unlocked Rewards</Text>
            <View style={styles.unlocksCard}>
              <View style={styles.unlocksHeader}>
                <Gift size={20} color={colors.secondary} />
                <Text style={styles.unlocksCount}>{unlockedItems.length} items unlocked</Text>
              </View>
              <View style={styles.unlocksList}>
                {unlockedItems.slice(0, 6).map((item) => (
                  <View key={item.id} style={styles.unlockItem}>
                    <Text style={styles.unlockIcon}>{item.icon}</Text>
                    <View style={styles.unlockInfo}>
                      <Text style={styles.unlockName}>{item.name}</Text>
                      <Text style={styles.unlockDescription}>{item.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
              {unlockedItems.length > 6 && (
                <Text style={styles.unlocksMore}>+ {unlockedItems.length - 6} more</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About CraveLess</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              CraveLess helps you take control of your sugar cravings through mindful tracking, supportive AI coaching, and proven behavior change techniques.
            </Text>
            <Text style={[styles.aboutText, { marginTop: 12 }]}>
              Remember: Progress, not perfection. Every small step counts.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips for Success</Text>
          <View style={styles.tipsCard}>
            <Text style={styles.tipItem}>• Log your cravings immediately when they happen</Text>
            <Text style={styles.tipItem}>• Use the delay technique to give yourself time</Text>
            <Text style={styles.tipItem}>• Chat with your AI coach when you need support</Text>
            <Text style={styles.tipItem}>• Celebrate small wins and learn from setbacks</Text>
            <Text style={styles.tipItem}>• Track patterns to understand your triggers</Text>
          </View>
        </View>

        {__DEV__ && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.debugToggle}
              onPress={() => setShowDebug(!showDebug)}
            >
              <Bug size={20} color={colors.textSecondary} />
              <Text style={styles.debugToggleText}>
                {showDebug ? 'Hide' : 'Show'} Less AI Debug
              </Text>
            </TouchableOpacity>
            
            {showDebug && insightProfile && (
              <View style={styles.debugCard}>
                <View style={styles.debugSection}>
                  <Text style={styles.debugSectionTitle}>Trigger Stats (Top 5)</Text>
                  {topTriggers.length > 0 ? (
                    topTriggers.map(([trigger, count]) => (
                      <Text key={trigger} style={styles.debugText}>
                        • {trigger}: {count}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.debugTextEmpty}>No triggers recorded yet</Text>
                  )}
                </View>

                <View style={styles.debugSection}>
                  <Text style={styles.debugSectionTitle}>Time Bucket Stats (Top 3)</Text>
                  {topTimeBuckets.length > 0 ? (
                    topTimeBuckets.map(([time, count]) => (
                      <Text key={time} style={styles.debugText}>
                        • {time}: {count}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.debugTextEmpty}>No time data recorded yet</Text>
                  )}
                </View>

                <View style={styles.debugSection}>
                  <Text style={styles.debugSectionTitle}>Pattern Confidence</Text>
                  {insightProfile.patternConfidence?.primaryTrigger ? (
                    <>
                      <Text style={styles.debugText}>
                        • Primary Trigger: {insightProfile.patternConfidence.primaryTrigger}
                      </Text>
                      <Text style={styles.debugText}>
                        • Trigger Confidence: {insightProfile.patternConfidence.triggerConfidence?.toFixed(2) || 'N/A'}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.debugTextEmpty}>Not enough data for trigger confidence (need 3+ occurrences)</Text>
                  )}
                  {insightProfile.patternConfidence?.peakTime ? (
                    <>
                      <Text style={styles.debugText}>
                        • Peak Time: {insightProfile.patternConfidence.peakTime}
                      </Text>
                      <Text style={styles.debugText}>
                        • Time Confidence: {insightProfile.patternConfidence.timeConfidence?.toFixed(2) || 'N/A'}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.debugTextEmpty}>Not enough data for time confidence (need 3+ occurrences)</Text>
                  )}
                </View>

                <View style={styles.debugSection}>
                  <Text style={styles.debugSectionTitle}>Last Context Snapshot</Text>
                  <ScrollView style={styles.debugSnapshotScroll} nestedScrollEnabled>
                    <Text style={styles.debugTextMono}>{contextSnapshot || 'No snapshot yet'}</Text>
                  </ScrollView>
                </View>
                
                <View style={styles.debugSection}>
                  <Text style={styles.debugSectionTitle}>Quick Stats</Text>
                  <Text style={styles.debugText}>• Total cravings: {cravings.length}</Text>
                  <Text style={styles.debugText}>• Coach messages: {coachMessages.length}</Text>
                  <Text style={styles.debugText}>• Distress mode: {profile.isInDistressMode ? 'Active' : 'Inactive'}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Controls</Text>
          <View style={styles.dataControlsCard}>
            <TouchableOpacity 
              style={styles.dataButton}
              onPress={handleExportData}
            >
              <Download size={20} color={colors.primary} />
              <View style={styles.dataButtonText}>
                <Text style={styles.dataButtonTitle}>Export Data</Text>
                <Text style={styles.dataButtonSubtitle}>
                  {cravings.length} cravings, {coachMessages.length} messages
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.dataDivider} />

            <TouchableOpacity 
              style={styles.dataButton}
              onPress={handleClearCoachChat}
            >
              <MessageSquareOff size={20} color={colors.secondary} />
              <View style={styles.dataButtonText}>
                <Text style={styles.dataButtonTitle}>Clear Coach Chat</Text>
                <Text style={styles.dataButtonSubtitle}>Remove all coach messages</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.dataDivider} />

            <TouchableOpacity 
              style={styles.dataButton}
              onPress={handleClearAllData}
            >
              <Trash2 size={20} color={colors.error} />
              <View style={styles.dataButtonText}>
                <Text style={[styles.dataButtonTitle, { color: colors.error }]}>Clear All Data</Text>
                <Text style={styles.dataButtonSubtitle}>Reset app completely</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health & Safety</Text>
          <View style={styles.disclaimerCard}>
            <View style={styles.disclaimerHeader}>
              <AlertCircle size={20} color={colors.secondary} />
              <Text style={styles.disclaimerTitle}>Important Notice</Text>
            </View>
            <Text style={styles.disclaimerText}>
              CraveLess provides habit and wellness support. It is not medical or nutritional advice.
            </Text>
            <Text style={[styles.disclaimerText, { marginTop: 12 }]}>
              For health concerns, please consult:
            </Text>
            <View style={styles.resourceList}>
              <View style={styles.resourceItem}>
                <ExternalLink size={14} color={colors.primary} />
                <Text style={styles.resourceText}>Healthcare provider or registered dietitian</Text>
              </View>
              <View style={styles.resourceItem}>
                <ExternalLink size={14} color={colors.primary} />
                <Text style={styles.resourceText}>Mental health professional</Text>
              </View>
              <View style={styles.resourceItem}>
                <ExternalLink size={14} color={colors.primary} />
                <Text style={styles.resourceText}>Crisis services: 988 (US)</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.calm.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginLeft: 8,
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  aboutCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  aboutText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  tipsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  tipItem: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 28,
  },
  disclaimerCard: {
    backgroundColor: colors.calm.peachLight,
    borderRadius: 16,
    padding: 20,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginLeft: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  resourceList: {
    marginTop: 12,
    gap: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resourceText: {
    fontSize: 13,
    color: colors.primaryDark,
    lineHeight: 18,
    flex: 1,
  },
  dataControlsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  dataButtonText: {
    flex: 1,
  },
  dataButtonTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  dataButtonSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dataDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  unlocksCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  unlocksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  unlocksCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  unlocksList: {
    gap: 12,
  },
  unlockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unlockIcon: {
    fontSize: 32,
  },
  unlockInfo: {
    flex: 1,
  },
  unlockName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  unlockDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  unlocksMore: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic' as const,
  },
  debugToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
  },
  debugToggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  debugCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  debugSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  debugSectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.primary,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  debugContent: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  debugText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 3,
  },
  debugTextEmpty: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: 'italic' as const,
  },
  debugTextMono: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.text,
    lineHeight: 16,
  },
  debugSnapshotScroll: {
    maxHeight: 150,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
});
