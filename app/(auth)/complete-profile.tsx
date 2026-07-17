import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import { AppDispatch } from '../../store';
import { setProfile, selectPendingAction } from '../../store/authSlice';
import { api } from '../../lib/api';
import { finishLogin } from '../../lib/authFlow';

export default function CompleteProfile() {
  const { name: googleName } = useLocalSearchParams<{ name?: string }>();
  const [name,    setName]    = useState(googleName || '');
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const pendingAction = useSelector(selectPendingAction);

  const isValid = name.trim().length > 0 && phone.length === 10;

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError('');
    try {
      const res = await api.put<{ id: string; phone: string; name: string }>('/api/users/profile', {
        name: name.trim(),
        phone,
      });
      dispatch(setProfile({ name: res.name, phone: res.phone }));
      await finishLogin(dispatch, pendingAction);
    } catch (e: any) {
      setError(e.message || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.heading}>Just one more step</Text>
            <Text style={styles.sub}>Tell us your name and phone number so we can deliver your order.</Text>

            <View style={styles.form}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={t => { setName(t); setError(''); }}
                  autoFocus={!googleName}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.prefix}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="9999999999"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={t => { setPhone(t.replace(/\D/g, '')); setError(''); }}
                  autoFocus={!!googleName}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              </View>

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <Pressable
                style={[styles.submitBtn, (!isValid || loading) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
              >
                {loading
                  ? <ActivityIndicator color={Colors.textInverse} size="small" />
                  : <Text style={styles.submitBtnText}>Continue</Text>
                }
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },

  card: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xl,
  },
  heading: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  sub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },

  form: { gap: Spacing.md },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  prefix: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    padding: 0,
    outlineStyle: 'none',
  } as any,

  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.danger,
    textAlign: 'center',
  },

  submitBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.55 },
  submitBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.textInverse,
    letterSpacing: 0.2,
  },
});
