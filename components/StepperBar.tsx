import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius } from '../constants/spacing';

const STEPS = ['Cart', 'Address', 'Payment'];

export default function StepperBar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <View style={styles.row}>
      {STEPS.map((label, idx) => {
        const num = idx + 1;
        const done = num < step;
        const active = num === step;
        return (
          <View key={label} style={styles.item}>
            {idx > 0 && (
              <View style={[styles.line, done && styles.lineDone]} />
            )}
            <View style={[styles.circle, (done || active) && styles.circleDone]}>
              <Text style={[styles.num, (done || active) && styles.numDone]}>{num}</Text>
            </View>
            <Text style={[styles.label, (done || active) && styles.labelDone]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl, paddingHorizontal: Spacing.xxl },
  item: { flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1 },
  line: { position: 'absolute', top: 16, left: '-50%', right: '50%', height: 2, backgroundColor: Colors.border, zIndex: 0 },
  lineDone: { backgroundColor: Colors.primary },
  circle: { width: 32, height: 32, borderRadius: Radius.full, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, zIndex: 1, marginBottom: 4 },
  circleDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  num: { fontFamily: FontFamily.numBold, fontSize: FontSize.sm, color: Colors.textMuted },
  numDone: { color: Colors.textInverse },
  label: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.textMuted },
  labelDone: { color: Colors.textPrimary, fontFamily: FontFamily.semiBold },
});
