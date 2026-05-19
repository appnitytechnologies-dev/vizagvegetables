import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { NOTIFICATIONS, Notification } from '../dummy-data/notifications';
import Divider from '../components/ui/Divider';

const TYPE_COLOR: Record<Notification['type'], string> = {
  price: Colors.primaryLight,
  order: '#E3F2FD',
  offer: '#FFF3E0',
};

const TYPE_ICON_COLOR: Record<Notification['type'], string> = {
  price: Colors.primary,
  order: '#1565C0',
  offer: '#E65100',
};

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState(NOTIFICATIONS);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifs(n => n.map(x => ({ ...x, read: true })));
  };

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(x => x.id === id ? { ...x, read: true } : x));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{unreadCount} new</Text>
            </View>
          )}
        </View>
        <Pressable onPress={markAllRead} style={styles.markAllBtn}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </Pressable>
      </View>
      <Divider />

      {notifs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyTitle}>You're all caught up!</Text>
          <Text style={styles.emptyBody}>No notifications right now.</Text>
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.xxxl }}
          ItemSeparatorComponent={() => <Divider />}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.item, !item.read && styles.itemUnread]}
              onPress={() => markRead(item.id)}
            >
              <View style={[styles.iconWrap, { backgroundColor: TYPE_COLOR[item.type] }]}>
                <Text style={styles.iconEmoji}>{item.icon}</Text>
              </View>
              <View style={styles.textWrap}>
                <View style={styles.titleRow}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.itemBody}>{item.body}</Text>
                <Text style={styles.itemTime}>{item.time}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.textMuted}
                style={{ alignSelf: 'center' }}
              />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  countBadge: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  countText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.primary },
  markAllBtn: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
  markAllText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },

  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  itemUnread: { backgroundColor: '#F1F8F1' },
  iconWrap: {
    width: 48, height: 48,
    borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: { fontSize: 22 },
  textWrap: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  itemTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, flexShrink: 0 },
  itemBody: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: 4 },
  itemTime: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  emptyBody: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted },
});
