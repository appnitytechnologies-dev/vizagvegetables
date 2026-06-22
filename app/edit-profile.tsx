import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, ScrollView,
  Modal, Alert, Image, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { selectAuth, updateUserName } from '../store/authSlice';
import { AppDispatch } from '../store';
import { api } from '../lib/api';
import Divider from '../components/ui/Divider';

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

function FormField({
  label, value, onChangeText, placeholder, keyboardType, icon, editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  icon: string;
  editable?: boolean;
}) {
  const inputRef = useRef<TextInput>(null);
  return (
    <Pressable style={field.wrap} onPress={() => editable && inputRef.current?.focus()}>
      <View style={field.iconWrap}>
        <Ionicons name={icon as any} size={18} color={Colors.primary} />
      </View>
      <View style={field.inner}>
        <Text style={field.label}>{label}</Text>
        <TextInput
          ref={inputRef}
          style={[field.input, !editable && { color: Colors.textMuted }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          keyboardType={keyboardType ?? 'default'}
          returnKeyType="next"
          editable={editable}
        />
      </View>
      {!editable && (
        <Ionicons name="lock-closed-outline" size={14} color={Colors.textMuted} />
      )}
    </Pressable>
  );
}

const field = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  inner: { flex: 1 },
  label: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 2 },
  input: {
    fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary,
    paddingVertical: 0,
  },
});

export default function EditProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const auth     = useSelector(selectAuth);

  const [name,          setName]          = useState(auth.name || '');
  const [email,         setEmail]         = useState('');
  const [profileImage,  setProfileImage]  = useState<string | null>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  /* Load email from API on mount */
  useState(() => {
    api.get<{ name?: string; email?: string; phone: string }>('/api/users/profile')
      .then(data => { if (data.email) setEmail(data.email); })
      .catch(() => {});
  });

  const requestPermission = async (type: 'camera' | 'library') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
  };

  const pickFromGallery = async () => {
    setShowImageMenu(false);
    const granted = await requestPermission('library');
    if (!granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const pickFromCamera = async () => {
    setShowImageMenu(false);
    const granted = await requestPermission('camera');
    if (!granted) {
      Alert.alert('Permission required', 'Please allow camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const removePhoto = () => { setShowImageMenu(false); setProfileImage(null); };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.put('/api/users/profile', { name: name.trim(), email: email.trim() });
      await AsyncStorage.setItem('user_name', name.trim());
      dispatch(updateUserName(name.trim()));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      setError(e.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initials = getInitials(name) || 'U';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textInverse} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable onPress={handleSave} style={styles.saveBtn} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Text style={styles.saveBtnText}>Save</Text>
          }
        </Pressable>
      </View>

      {/* Avatar in header extension */}
      <View style={styles.avatarSection}>
        <Pressable
          style={styles.avatarWrap}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowImageMenu(true); }}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
          <View style={styles.cameraOverlay}>
            <Ionicons name="camera" size={16} color={Colors.textInverse} />
          </View>
        </Pressable>
        <Text style={styles.avatarHint}>Tap to change photo</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>PERSONAL INFO</Text>
            <Divider />
            <FormField
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              icon="person-outline"
            />
            <Divider />
            <FormField
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email (optional)"
              keyboardType="email-address"
              icon="mail-outline"
            />
            <Divider />
            {/* Phone is read-only — tied to OTP */}
            <FormField
              label="Phone Number"
              value={auth.phone ? `+91 ${auth.phone}` : ''}
              onChangeText={() => {}}
              placeholder="Phone number"
              keyboardType="phone-pad"
              icon="call-outline"
              editable={false}
            />
          </View>

          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.noteText}>
              Phone number is linked to your OTP login and cannot be changed here.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Image Picker Bottom Sheet */}
      <Modal visible={showImageMenu} transparent animationType="slide" onRequestClose={() => setShowImageMenu(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowImageMenu(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Profile Photo</Text>

            <Pressable style={styles.sheetOption} onPress={pickFromCamera}>
              <View style={styles.sheetIconWrap}>
                <Ionicons name="camera-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.sheetOptionText}>Take Photo</Text>
            </Pressable>
            <Divider />
            <Pressable style={styles.sheetOption} onPress={pickFromGallery}>
              <View style={styles.sheetIconWrap}>
                <Ionicons name="image-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.sheetOptionText}>Choose from Gallery</Text>
            </Pressable>
            {profileImage && (
              <>
                <Divider />
                <Pressable style={styles.sheetOption} onPress={removePhoto}>
                  <View style={[styles.sheetIconWrap, { backgroundColor: Colors.dangerLight }]}>
                    <Ionicons name="trash-outline" size={22} color={Colors.danger} />
                  </View>
                  <Text style={[styles.sheetOptionText, { color: Colors.danger }]}>Remove Photo</Text>
                </Pressable>
              </>
            )}

            <Pressable style={styles.cancelBtn} onPress={() => setShowImageMenu(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textInverse },
  saveBtn: {
    backgroundColor: Colors.textInverse, borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    minWidth: 60, alignItems: 'center',
  },
  saveBtnText: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.primary },

  avatarSection: { backgroundColor: Colors.primary, alignItems: 'center', paddingBottom: Spacing.xxl },
  avatarWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden', position: 'relative',
  },
  avatarImage: { width: 88, height: 88, borderRadius: 44 },
  avatarText: { fontFamily: FontFamily.bold, fontSize: 28, color: Colors.textInverse },
  cameraOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 6, alignItems: 'center',
  },
  avatarHint: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.75)', marginTop: Spacing.sm },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.dangerLight, borderRadius: Radius.md, margin: Spacing.xxl, padding: Spacing.md },
  errorText: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.danger },

  card: {
    marginHorizontal: Spacing.xxl, marginTop: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm,
  },
  cardTitle: {
    fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.textMuted,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm, letterSpacing: 0.8,
  },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    marginHorizontal: Spacing.xxl, marginTop: Spacing.md, padding: Spacing.md,
    backgroundColor: Colors.background, borderRadius: Radius.md,
  },
  noteText: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    paddingBottom: Spacing.xxl,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.sm },
  sheetTitle: {
    fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary,
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
  },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg,
  },
  sheetIconWrap: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  sheetOptionText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textPrimary },
  cancelBtn: {
    marginHorizontal: Spacing.xxl, marginTop: Spacing.md,
    backgroundColor: Colors.background, borderRadius: Radius.lg,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  cancelText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textSecondary },
});
