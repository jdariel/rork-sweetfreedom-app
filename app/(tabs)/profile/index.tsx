import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Share } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { goalModeData } from '@/constants/goalModes';
import colors from '@/constants/colors';
import { User, Target, Calendar, Award, AlertCircle, ExternalLink, Download, Trash2, MessageSquareOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { profile, streak, cravings, coachMessages, exportData, clearAllData, clearCoachMessages } = useApp();
  const router = useRouter();

  if (!profile) {
    return null;
  }

  const goalData = goalModeData[profile.goalMode];
  const memberSince = new Date(profile.startDate).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

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
              router.replace('/onboarding');
            } catch (error) {
              console.error('Clear error:', error);
              Alert.alert('Error', 'Could not clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

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
});
