import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Easing, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Ionicons } from '@/components/AppIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useFit } from '@/context/FitContext';
import { translate } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Card, Header, Pill } from '@/components/FitUI';

type Message = { id: string; text: string; from: 'coach' | 'user' };

function TypingIndicator({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  const dots = React.useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  React.useEffect(() => {
    const animations = dots.map((dot, index) => Animated.loop(Animated.sequence([
      Animated.delay(index * 130),
      Animated.timing(dot, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.delay(500 - index * 130),
    ])));
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [dots]);
  return <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Text style={[styles.typingLabel, { color: colors.mutedForeground }]}>{label}</Text>
    <View style={styles.typingDots}>{dots.map((dot, index) => <Animated.View key={index} style={[styles.typingDot, { backgroundColor: colors.primary, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]} />)}</View>
  </View>;
}

export default function CoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, profile, username, meals, calorieGoal, proteinGoal, workouts, weight, coachMessagesUsed, incrementCoachUsage, setCoachThinking } = useFit();
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ id: 'welcome', text: t('coachWelcome'), from: 'coach' }]);
  const [loading, setLoading] = useState(false);
  const [chatOriginY, setChatOriginY] = React.useState(0);
  const [coachMessageOffsetY, setCoachMessageOffsetY] = React.useState(12);
  const inputRef = useRef<TextInput>(null);
  const aura = useRef(new Animated.Value(0)).current;
  const coachReveal = useRef(new Animated.Value(0)).current;
  const screenSize = Dimensions.get('window');
  const revealScale = Math.max(34, Math.ceil(Math.hypot(screenSize.width, screenSize.height) / 28));
  const flyingAvatarSize = 72;
  const flyingStartX = screenSize.width / 2 - flyingAvatarSize / 2;
  const flyingStartY = screenSize.height - insets.bottom - 100;
  const flyingTargetX = 20;
  const flyingTargetY = chatOriginY + coachMessageOffsetY;
  React.useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(aura, { toValue: 1, duration: 1800, useNativeDriver: true }), Animated.timing(aura, { toValue: 0, duration: 1800, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [aura]);
  useFocusEffect(React.useCallback(() => {
    coachReveal.setValue(0);
    const animation = Animated.timing(coachReveal, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [coachReveal]));
  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    if (coachMessagesUsed >= 5) {
      setMessages((current) => [...current, { id: `${Date.now()}-limit`, text: t('coachLimitReached'), from: 'coach' }]);
      return;
    }
    const userMessage = { id: `${Date.now()}`, text: trimmed, from: 'user' as const };
    setMessages((current) => [...current, userMessage]);
    setText('');
    setLoading(true);
    setCoachThinking(true);
    try {
      const context = JSON.stringify({ username, profile, weight, calorieGoal, proteinGoal, meals, workouts: workouts.map((item) => ({ name: item.name, completed: item.completed, exercises: item.exercises.length })) });
      const response = await fetch(`https://${process.env.EXPO_PUBLIC_DOMAIN}/api/ai/coach`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: trimmed, language, context }) });
      if (!response.ok) throw new Error('coach unavailable');
      const result = await response.json() as { content?: string };
      incrementCoachUsage();
      setMessages((current) => [...current, { id: `${Date.now()}-reply`, text: result.content ?? t('coachWelcome'), from: 'coach' }]);
    } catch {
      setMessages((current) => [...current, { id: `${Date.now()}-error`, text: t('coachSubtitle'), from: 'coach' }]);
    } finally {
      setLoading(false);
      setCoachThinking(false);
    }
  };
  return <View style={[styles.root, { backgroundColor: 'transparent', paddingTop: insets.top + 16, paddingBottom: insets.bottom + 104 }]}>
    <View pointerEvents="none" style={styles.coachBackgroundLayer}><Animated.Image source={require('@/assets/images/coach-background.jpeg')} resizeMode="cover" style={[styles.coachBackground, { opacity: coachReveal.interpolate({ inputRange: [0, 0.38, 0.78, 1], outputRange: [0, 0.08, 0.72, 1] }) }]} /></View>
    <Animated.View pointerEvents="none" style={[styles.coachReveal, { backgroundColor: colors.foreground, opacity: coachReveal.interpolate({ inputRange: [0, 0.55, 0.86, 1], outputRange: [0.96, 0.92, 0.28, 0] }), transform: [{ scale: coachReveal.interpolate({ inputRange: [0, 0.68, 1], outputRange: [1, revealScale * 0.88, revealScale] }) }] }]} />
    <Header eyebrow="Intelligence / 05" title={t('coachTitle')} subtitle={t('coachSubtitle')} action="sparkles-outline" actionLogo onAction={() => undefined} />
    <Card style={styles.coachCard}><Image source={require('@/assets/images/coach-tab-custom.jpeg')} resizeMode="cover" style={styles.coachAvatar} /><View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{t('coachTitle')}</Text></View><View style={styles.limit}><Text style={[styles.limitNumber, { color: colors.foreground }]}>{String(5 - coachMessagesUsed).padStart(2, '0')}</Text><Text style={[styles.caption, { color: colors.mutedForeground }]}>/ 05</Text></View></Card>
    <View pointerEvents="none" style={styles.coachFlightLayer}>
      <Animated.Image
        source={require('@/assets/images/coach-tab-custom.jpeg')}
        resizeMode="cover"
        style={[styles.coachFlyingAvatar, {
          left: flyingStartX,
          top: flyingStartY,
          opacity: coachReveal.interpolate({ inputRange: [0, 0.72, 0.95, 1], outputRange: [1, 1, 0.35, 0] }),
          transform: [
            { translateX: coachReveal.interpolate({ inputRange: [0, 1], outputRange: [0, flyingTargetX - flyingStartX] }) },
            { translateY: coachReveal.interpolate({ inputRange: [0, 1], outputRange: [0, flyingTargetY - flyingStartY] }) },
            { scale: coachReveal.interpolate({ inputRange: [0, 1], outputRange: [1, 2 / 3] }) },
          ],
        }]}
      />
    </View>
    <View style={styles.suggestions}><Pill label={t('coachExample')} onPress={() => setText(t('coachExample'))} /><Pill label={t('protein')} onPress={() => setText(t('protein'))} /></View>
    <KeyboardAvoidingView onLayout={({ nativeEvent }) => setChatOriginY(nativeEvent.layout.y)} style={styles.chatWrap} behavior="padding" keyboardVerticalOffset={0}>
      <FlatList
        style={styles.messagesList}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <View
          onLayout={item.from === 'coach' && item.id === 'welcome' ? ({ nativeEvent }) => setCoachMessageOffsetY(nativeEvent.layout.y) : undefined}
          style={[styles.messageRow, item.from === 'user' ? styles.userMessageRow : styles.coachMessageRow]}
        >
          {item.from === 'coach' ? <Animated.Image source={require('@/assets/images/coach-tab-custom.jpeg')} resizeMode="cover" style={[styles.messageAvatar, { opacity: item.id === 'welcome' ? coachReveal.interpolate({ inputRange: [0, 0.72, 1], outputRange: [0, 0.3, 1] }) : 1 }]} /> : null}
          <View style={[styles.bubble, item.from === 'user' ? [styles.userBubble, { backgroundColor: colors.primary }] : [styles.coachBubble, { backgroundColor: colors.card, borderColor: colors.border }]]}><Text style={[styles.bubbleText, { color: item.from === 'user' ? colors.primaryForeground : colors.foreground }]}>{item.text}</Text></View>
        </View>}
        ListFooterComponent={loading ? <TypingIndicator label={t('coachTyping')} colors={colors} /> : null}
        contentContainerStyle={styles.messageList}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8, backgroundColor: 'transparent' }]}>
        <Animated.View style={[styles.auraInput, { borderColor: colors.primary, shadowColor: colors.primary, opacity: aura.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }) }]}><TextInput ref={inputRef} value={text} onChangeText={setText} onSubmitEditing={send} returnKeyType="send" placeholder={loading ? t('analyzing') : t('askCoach')} placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, color: colors.foreground }]} /></Animated.View>
        <Pressable testID="send-coach-message" onPress={send} style={({ pressed }) => [styles.send, { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 }]}><Ionicons name="arrow-up" size={19} color={colors.primaryForeground} /></Pressable>
      </View>
    </KeyboardAvoidingView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  coachBackgroundLayer: { ...StyleSheet.absoluteFillObject },
  coachBackground: { ...StyleSheet.absoluteFillObject },
  coachReveal: { position: 'absolute', width: 56, height: 56, borderRadius: 28, left: '50%', marginLeft: -28, bottom: 44, shadowColor: '#FFFFFF', shadowOpacity: 0.52, shadowRadius: 28, shadowOffset: { width: 0, height: 0 }, elevation: 14 },
  coachFlightLayer: { ...StyleSheet.absoluteFillObject, zIndex: 4 },
  coachFlyingAvatar: { position: 'absolute', width: 72, height: 72, borderRadius: 36, shadowColor: '#FFFFFF', shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
  coachCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 },
  coachAvatar: { width: 48, height: 48, borderRadius: 17 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  limit: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  limitNumber: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  suggestions: { flexDirection: 'row', marginBottom: 8, overflow: 'hidden' },
  chatWrap: { flex: 1, minHeight: 0 },
  messagesList: { flex: 1, minHeight: 0 },
  messageList: { paddingVertical: 12, gap: 10 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  coachMessageRow: { alignSelf: 'flex-start', maxWidth: '90%' },
  userMessageRow: { alignSelf: 'flex-end', maxWidth: '84%' },
  messageAvatar: { width: 30, height: 30, borderRadius: 15, marginTop: 2 },
  bubble: { maxWidth: '84%', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 18 },
  userBubble: { borderBottomRightRadius: 6 },
  coachBubble: { borderWidth: 1, borderBottomLeftRadius: 6 },
  bubbleText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  typingBubble: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 18, borderBottomLeftRadius: 6, paddingHorizontal: 14, paddingVertical: 11 },
  typingLabel: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  typingDots: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 14 },
  typingDot: { width: 5, height: 5, borderRadius: 3 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 9 },
  input: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 17, paddingHorizontal: 15, fontFamily: 'Inter_400Regular', fontSize: 13 },
  auraInput: { flex: 1, borderWidth: 1.5, borderRadius: 19, shadowOpacity: 0.75, shadowRadius: 10, elevation: 3 },
  send: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});