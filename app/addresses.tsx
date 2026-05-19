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
import { user } from '../dummy-data/user';
import Divider from '../components/ui/Divider';

type Address = typeof user.addresses[number];

export default function Addresses() {
  const [addresses, setAddresses] = useState<Address[]>(user.addresses);
  const [defaultId, setDefaultId] = useState(addresses.find(a => a.default)?.id ?? '1');

  const setDefault = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDefaultId(id);
    setAddresses(prev => prev.map(a => ({ ...a, default: a.id === id })));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Addresses</Text>
        <View style={{ width: 36 }} />
      </View>
      <Divider />

      <FlatList
        data={addresses}
        keyExtractor={a => a.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: Spacing.xxl, gap: Spacing.lg, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={[styles.card, item.default && styles.cardActive]}>
            <View style={styles.cardHead}>
              <View style={[styles.labelChip, item.default && styles.labelChipActive]}>
                <Ionicons
                  name={item.label === 'Home' ? 'home-outline' : 'briefcase-outline'}
                  size={13}
                  color={item.default ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.labelText, item.default && styles.labelTextActive]}>{item.label}</Text>
              </View>
              {item.default && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
            </View>
            <Text style={styles.addressFull}>{item.full}</Text>
            <Divider />
            <View style={styles.cardActions}>
              {!item.default && (
                <Pressable style={styles.actionBtn} onPress={() => setDefault(item.id)}>
                  <Ionicons name="checkmark-circle-outline" size={15} color={Colors.primary} />
                  <Text style={styles.actionText}>Set as default</Text>
                </Pressable>
              )}
              <Pressable style={styles.actionBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <Ionicons name="pencil-outline" size={15} color={Colors.textSecondary} />
                <Text style={[styles.actionText, { color: Colors.textSecondary }]}>Edit</Text>
              </Pressable>
              <Pressable
                style={styles.actionBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setAddresses(prev => prev.filter(a => a.id !== item.id));
                }}
              >
                <Ionicons name="trash-outline" size={15} color={Colors.danger} />
                <Text style={[styles.actionText, { color: Colors.danger }]}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          <Pressable
            style={styles.addCard}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
            <Text style={styles.addText}>Add New Address</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface },
  backBtn: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm, borderWidth: 1.5, borderColor: Colors.border },
  cardActive: { borderColor: Colors.primary },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.lg, paddingBottom: Spacing.sm },
  labelChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.background, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  labelChipActive: { backgroundColor: Colors.primaryLight },
  labelText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textMuted },
  labelTextActive: { color: Colors.primary },
  defaultBadge: { backgroundColor: Colors.primaryPale, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  defaultText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.primary },
  addressFull: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, lineHeight: 20 },

  cardActions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.lg },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: Spacing.xs },
  actionText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },

  addCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed',
    borderRadius: Radius.lg, paddingVertical: Spacing.lg,
    backgroundColor: Colors.primaryPale,
  },
  addText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
});
