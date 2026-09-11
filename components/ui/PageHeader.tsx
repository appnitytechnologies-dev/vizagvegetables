import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

interface Props {
  title: string;
  /** Where to navigate if there is no back history (e.g. direct URL on web) */
  fallback?: string;
  /** Override the default back action */
  onBack?: () => void;
  /** Optional element rendered on the right side */
  right?: React.ReactNode;
}

export default function PageHeader({ title, fallback = '/(tabs)/home', onBack, right }: Props) {
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback as any);
    }
  };

  return (
    <View style={styles.header}>
      <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
        <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.right}>{right ?? <View style={{ width: 36 }} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F2F3F5',
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    flex: 1, textAlign: 'center',
    fontFamily: FontFamily.bold, fontSize: FontSize.lg,
    color: Colors.textPrimary, marginHorizontal: Spacing.sm,
  },
  right: { minWidth: 36, alignItems: 'flex-end' },
});
