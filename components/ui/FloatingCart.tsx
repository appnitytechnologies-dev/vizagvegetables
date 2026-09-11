import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Shadow, Spacing, Radius } from '../../constants/spacing';
import { useCart } from '../../hooks/useCart';

export default function FloatingCart() {
  const { items, count, total } = useCart();

  if (count === 0) return null;

  const shown = items.slice(0, 3);

  return (
    <Pressable
      style={styles.bar}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/cart' as any);
      }}
    >
      {/* Overlapping circle thumbnails */}
      <View style={styles.thumbs}>
        {shown.map((item, i) => (
          <View key={item.id} style={[styles.thumb, i > 0 && { marginLeft: -10 }]}>
            {item.image_url
              ? <Image source={{ uri: item.image_url }} style={styles.thumbImg} contentFit="cover" />
              : <Text style={styles.thumbEmoji}>{item.emoji}</Text>
            }
          </View>
        ))}
      </View>

      {/* Labels */}
      <View style={styles.center}>
        <Text style={styles.label}>View cart</Text>
        <Text style={styles.countText}>{count} Item{count > 1 ? 's' : ''}</Text>
      </View>

      {/* Arrow button */}
      <View style={styles.arrowCircle}>
        <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.sm,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },

  /* Thumbnails */
  thumbs: { flexDirection: 'row', alignItems: 'center' },
  thumb: {
    width: 34, height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg:   { width: 34, height: 34 },
  thumbEmoji: { fontSize: 16 },

  /* Text */
  center:    { paddingHorizontal: Spacing.xs },
  label:     { fontFamily: FontFamily.bold,    fontSize: FontSize.sm, color: '#fff' },
  countText: { fontFamily: FontFamily.regular, fontSize: 11,          color: 'rgba(255,255,255,0.85)' },

  /* Arrow */
  arrowCircle: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
});
