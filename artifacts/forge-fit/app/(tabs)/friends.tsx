import React from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@/components/AppIcon';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, EmptyState, Header, Screen, SectionTitle } from '@/components/FitUI';

export default function FriendsScreen() {
  const colors = useColors();
  const { language, friends, challenges, addFriend, addChallenge } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [friendName, setFriendName] = React.useState('');
  const [challengeName, setChallengeName] = React.useState('');
  const [target, setTarget] = React.useState('30');
  const addNewFriend = () => { const clean = friendName.trim(); if (!clean) return; addFriend(clean); setFriendName(''); Alert.alert(t('inviteFriend'), t('friendAdded')); };
  const createNewChallenge = () => { const name = challengeName.trim(); const days = Number(target); if (!name || !days) return; addChallenge(name, days); setChallengeName(''); Alert.alert(t('challenge'), t('challengeCreated')); };
  return <Screen>
    <Header eyebrow="Together" title={t('friendsTitle')} subtitle={t('friendsSubtitle')} action="person-add-outline" onAction={() => Share.share({ message: t('inviteFriend') }).catch(() => undefined)} />
    <Card style={styles.formCard}><Text style={[styles.formTitle, { color: colors.foreground }]}>{t('inviteFriend')}</Text><View style={styles.formRow}><TextInput value={friendName} onChangeText={setFriendName} placeholder={t('friendUsername')} placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} /><Pressable onPress={addNewFriend} style={[styles.formButton, { backgroundColor: colors.primary }]}><Ionicons name="person-add-outline" size={18} color={colors.primaryForeground} /></Pressable></View></Card>
    <Card style={styles.formCard}><Text style={[styles.formTitle, { color: colors.foreground }]}>{t('challenge')}</Text><View style={styles.formRow}><TextInput value={challengeName} onChangeText={setChallengeName} placeholder={t('challengeName')} placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} /><TextInput value={target} onChangeText={setTarget} keyboardType="number-pad" placeholder={t('challengeTarget')} placeholderTextColor={colors.mutedForeground} style={[styles.targetInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} /><Pressable onPress={createNewChallenge} style={[styles.formButton, { backgroundColor: colors.primary }]}><Ionicons name="trophy-outline" size={18} color={colors.primaryForeground} /></Pressable></View></Card>
    <SectionTitle title={t('challenge')} />
    {challenges.length === 0 ? <Card style={styles.emptyCard}><EmptyState icon="trophy-outline" title={t('noChallenge')} text={t('challenge')} /></Card> : challenges.map((item) => <Card key={item.id} style={styles.itemCard}><View style={[styles.itemIcon, { backgroundColor: `${colors.primary}20` }]}><Ionicons name="trophy-outline" size={19} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>{item.progress} / {item.target} {t('thisWeek').toLowerCase()}</Text></View><Ionicons name="chevron-forward" size={17} color={colors.mutedForeground} /></Card>)}
    <SectionTitle title={t('friendsTitle')} />
    {friends.length === 0 ? <Card style={styles.emptyCard}><EmptyState icon="people-outline" title={t('noFriends')} text={t('inviteFriend')} /></Card> : friends.map((friend) => <Card key={friend.id} style={styles.itemCard}><View style={[styles.avatar, { backgroundColor: colors.secondary }]}><Text style={[styles.avatarText, { color: colors.primary }]}>{friend.username.slice(0, 1).toUpperCase()}</Text></View><Text style={[styles.itemTitle, { color: colors.foreground }]}>{friend.username}</Text><Ionicons name="checkmark-circle" size={19} color={colors.success} /></Card>)}
  </Screen>;
}

const styles = StyleSheet.create({
  formCard: { padding: 14 },
  formTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 10 },
  formRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, height: 44, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, fontFamily: 'Inter_400Regular', fontSize: 12 },
  targetInput: { width: 62, height: 44, borderWidth: 1, borderRadius: 13, paddingHorizontal: 8, fontFamily: 'Inter_400Regular', fontSize: 12 },
  formButton: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { padding: 0 },
  itemCard: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  itemTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
});