import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { goalModeData } from '@/constants/goalModes';
import colors from '@/constants/colors';
import { User, Target, Calendar, Award } from 'lucide-react-native';

export default function ProfileScreen() {
  const { profile, streak } = useApp();

  if (!profile) {
    return null;
  }

  const goalData = goalModeData[profile.goalMode];
  const memberSince = new Date(profile.startDate).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

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
          <Text style={styles.sectionTitle}>About SweetControl</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              SweetControl helps you take control of your sugar cravings through mindful tracking, supportive AI coaching, and proven behavior change techniques.
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
});
