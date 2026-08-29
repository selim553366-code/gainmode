import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, Header, Pill, Screen, SectionTitle } from '@/components/FitUI';

export default function FriendsScreen() {
  const colors = useColors();
  const { language } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  return <Screen>
    <Header eyebrow="Together / 07" title={t('friendsTitle')} subtitle={t('friendsSubtitle')} action="person-add-outline" onAction={() => Alert.alert(t('inviteFriend'), t('friendsSubtitle'))} />
    <Card style={[styles.challengeHero, { backgroundColor: colors.primary }]}><View style={styles.challengeTop}><View><Text style={[styles.heroEyebrow, { color: colors.primaryForeground }]}>{t('challenge').toUpperCase()}</Text><Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>30-day momentum</Text><Text style={[styles.heroCaption, { color: `${colors.primaryForeground}A8` }]}>You + 4 {t('friends').toLowerCase()}</Text></View><Ionicons name="people" size={33} color={colors.primaryForeground} /></View><View style={styles.challengeProgress}><View style={[styles.whiteBar, { width: '68%', backgroundColor: colors.primaryForeground }]} /></View><View style={styles.challengeBottom}><Text style={[styles.heroCaption, { color: `${colors.primaryForeground}A8` }]}>20 / 30 days</Text><Pill label={t('viewAll')} active /></View></Card>
    <View style={styles.actionRow}><Pressable onPress={() => Alert.alert(t('inviteFriend'), t('friendsSubtitle'))} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="person-add-outline" size={19} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>{t('inviteFriend')}</Text></Pressable><Pressable onPress={() => Alert.alert(t('challenge'), t('friendsSubtitle'))} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="trophy-outline" size={19} color={colors.orange} /><Text style={[styles.actionText, { color: colors.foreground }]}>{t('challenge')}</Text></Pressable></View>
    <SectionTitle title={t('friendsTitle')} action={t('viewAll')} onAction={() => undefined} />
    <Card style={styles.leaderboard}><Rank place="01" name="Mert Y." score="28 gün" accent /><Rank place="02" name="Selim" score="24 gün" /><Rank place="03" name="Derya K." score="20 gün" /></Card>
    <Card style={styles.inviteCard}><View style={[styles.inviteIcon, { backgroundColor: colors.secondary }]}><Ionicons name="link-outline" size={19} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.inviteTitle, { color: colors.foreground }]}>{t('inviteFriend')}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{t('friendsSubtitle')}</Text></View><Ionicons name="chevron-forward" size={17} color={colors.mutedForeground} /></Card>
  </Screen>;
}

function Rank({ place, name, score, accent }: { place: string; name: string; score: string; accent?: boolean }) {
  const colors = useColors();
  return <View style={styles.rank}><Text style={[styles.place, { color: accent ? colors.primary : colors.mutedForeground }]}>{place}</Text><View style={[styles.avatar, { backgroundColor: accent ? colors.primary : colors.secondary }]}><Text style={[styles.avatarText, { color: accent ? colors.primaryForeground : colors.foreground }]}>{name.slice(0, 1)}</Text></View><Text style={[styles.name, { color: colors.foreground }]}>{name}</Text><Text style={[styles.score, { color: colors.foreground }]}>{score}</Text></View>;
}

const styles = StyleSheet.create({
  challengeHero: { padding: 20, backgroundColor: '#D7F34A' },
  challengeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 23, letterSpacing: -0.7, marginVertical: 7 },
  heroCaption: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  challengeProgress: { height: 7, backgroundColor: '#0B0D0C25', borderRadius: 8, marginTop: 23, overflow: 'hidden' },
  whiteBar: { height: '100%', borderRadius: 8 },
  challengeBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  action: { flex: 1, height: 52, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  actionText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  leaderboard: { padding: 15 },
  rank: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  place: { fontFamily: 'Inter_700Bold', fontSize: 11, width: 21 },
  avatar: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  name: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13 },
  score: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  inviteCard: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  inviteIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  inviteTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
});