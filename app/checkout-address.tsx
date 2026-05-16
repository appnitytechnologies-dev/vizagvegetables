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
import StepperBar from '../components/StepperBar';
import Divider from '../components/ui/Divider';

export default function CheckoutAddress() {
  const [selected, setSelected] = useState(user.addresses[0].id);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>My Cart</Text>
        <View style={{ width: 32 }} />
      </View>
      <Divider />

      <StepperBar step={2} />
      <Divider />

      <FlatList
        data={user.addresses}
        keyExtractor={a => a.id}
        contentContainerStyle={{ padding: Spacing.xxl, gap: Spacing.md, paddingBottom: 120 }}
        ListHeaderComponent={
          <Pressable style={styles.addBtn}>
            <View style={styles.addIcon}>
              <Ionicons name="add" size={20} color={Colors.textInverse} />
            </View>
            <Text style={styles.addText}>Add Address</Text>
          </Pressable>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.addressCard, selected === item.id && styles.addressCardSelected]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected(item.id); }}
          >
            <View style={styles.addressIcon}>
              <Ionicons name={item.label === 'Home' ? 'home-outline' : 'business-outline'} size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.addressLabelRow}>
                <Text style={styles.addressLabel}>{item.label}</Text>
                {item.default && (
                  <View style={styles.defaultChip}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressFull}>{item.full}</Text>
            </View>
            {selected === item.id && (
              <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
            )}
          </Pressable>
        )}
      />

      <View style={styles.bottomBar}>
        <Pressable
          style={styles.continueBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/checkout-payment' as any);
          }}
        >
          <Text style={styles.continueText}>Continue to Payment</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: Radius.lg, padding: Spacing.lg, backgroundColor: Colors.primaryPale, marginBottom: Spacing.md },
  addIcon: { width: 40, height: 40, borderRadius: Radius.full, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  addText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.primary },
  addressCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg, backgroundColor: Colors.surface, ...Shadow.sm },
  addressCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryPale },
  addressIcon: { width: 44, height: 44, borderRadius: Radius.full, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  addressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  addressLabel: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  defaultChip: { backgroundColor: Colors.successLight, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  defaultText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.success },
  addressFull: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  continueBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.lg, alignItems: 'center' },
  continueText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textInverse },
});
