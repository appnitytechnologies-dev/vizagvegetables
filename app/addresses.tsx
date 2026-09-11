import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { api } from '../lib/api';
import { UserAddress, formatAddress } from '../lib/addressTypes';
import StatePicker from '../components/ui/StatePicker';
import Divider from '../components/ui/Divider';

type FormData = Omit<UserAddress, 'id' | 'is_default'>;

const LABELS: UserAddress['label'][] = ['Home', 'Office', 'Other'];
const LABEL_ICON: Record<string, string> = { Home: '🏠', Office: '🏢', Other: '📍' };

const EMPTY_FORM: FormData = {
  label: 'Home', name: '', phone: '',
  house_no: '', area: '', landmark: '',
  city: 'Visakhapatnam', state: 'Andhra Pradesh', pincode: '',
};

type Mode = 'list' | 'add' | 'edit';

/* ─── Standalone field — must live OUTSIDE AddressForm to avoid remount-on-render ── */
function Field({
  label, field, placeholder, keyboardType = 'default', maxLength, optional = false,
  form, errors, set,
}: {
  label: string; field: keyof FormData; placeholder: string;
  keyboardType?: any; maxLength?: number; optional?: boolean;
  form: FormData;
  errors: Partial<Record<keyof FormData, string>>;
  set: (key: keyof FormData, val: string) => void;
}) {
  return (
    <View style={form_.fieldWrap}>
      <Text style={form_.label}>
        {label} {optional && <Text style={form_.optional}>(optional)</Text>}
      </Text>
      <TextInput
        style={[form_.input, errors[field] ? form_.inputError : null]}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={String(form[field] ?? '')}
        onChangeText={v => set(field, v)}
        keyboardType={keyboardType}
        maxLength={maxLength}
        returnKeyType="next"
      />
      {!!errors[field] && <Text style={form_.error}>{errors[field]}</Text>}
    </View>
  );
}

/* ─── Address form ───────────────────────────────────── */
function AddressForm({
  initial, onSave, onCancel, saving,
}: {
  initial: FormData;
  onSave: (data: FormData) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm]             = useState<FormData>(initial);
  const [errors, setErrors]         = useState<Partial<Record<keyof FormData, string>>>({});
  const [showStatePicker, setShowStatePicker] = useState(false);

  const set = (key: keyof FormData, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim())     e.name     = 'Required';
    if (!form.phone.trim())    e.phone    = 'Required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = 'Enter valid 10-digit number';
    if (!form.house_no.trim()) e.house_no = 'Required';
    if (!form.area.trim())     e.area     = 'Required';
    if (!form.city.trim())     e.city     = 'Required';
    if (!form.state.trim())    e.state    = 'Required';
    if (!form.pincode.trim())  e.pincode  = 'Required';
    else if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Enter valid 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (validate()) onSave(form);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: Spacing.xxl, gap: Spacing.md, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Label selector */}
        <View style={form_.fieldWrap}>
          <Text style={form_.label}>Address Type</Text>
          <View style={form_.labelRow}>
            {LABELS.map(l => (
              <Pressable
                key={l}
                style={[form_.labelChip, form.label === l && form_.labelChipActive]}
                onPress={() => set('label', l)}
              >
                <Text style={form_.labelChipIcon}>{LABEL_ICON[l]}</Text>
                <Text style={[form_.labelChipText, form.label === l && form_.labelChipTextActive]}>{l}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Row: Name + Phone */}
        <View style={form_.row}>
          <View style={{ flex: 1 }}>
            <Field label="Full Name" field="name" placeholder="Ravi Kumar" form={form} errors={errors} set={set} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Mobile" field="phone" placeholder="9876543210"
              keyboardType="phone-pad" maxLength={10} form={form} errors={errors} set={set} />
          </View>
        </View>

        <Field label="House / Flat / Building" field="house_no" placeholder="Flat 4B, Sunrise Apartments" form={form} errors={errors} set={set} />
        <Field label="Area / Street / Locality" field="area" placeholder="MVP Colony, Near Park" form={form} errors={errors} set={set} />
        <Field label="Landmark" field="landmark" placeholder="Near Government Hospital" optional form={form} errors={errors} set={set} />

        {/* Row: Pincode + City */}
        <View style={form_.row}>
          <View style={{ flex: 1 }}>
            <Field label="Pincode" field="pincode" placeholder="530026" keyboardType="number-pad" maxLength={6} form={form} errors={errors} set={set} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="City / Town" field="city" placeholder="Visakhapatnam" form={form} errors={errors} set={set} />
          </View>
        </View>

        {/* State picker */}
        <View style={form_.fieldWrap}>
          <Text style={form_.label}>State</Text>
          <Pressable
            style={[form_.input, form_.statePicker, errors.state ? form_.inputError : null]}
            onPress={() => setShowStatePicker(true)}
          >
            <Text style={form.state ? form_.stateText : form_.statePlaceholder}>
              {form.state || 'Select State'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
          </Pressable>
          {!!errors.state && <Text style={form_.error}>{errors.state}</Text>}
        </View>

        <StatePicker
          visible={showStatePicker}
          selected={form.state}
          onSelect={v => set('state', v)}
          onClose={() => setShowStatePicker(false)}
        />

        {/* Buttons */}
        <View style={form_.btnRow}>
          <Pressable style={form_.cancelBtn} onPress={onCancel}>
            <Text style={form_.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={[form_.saveBtn, saving && form_.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={form_.saveText}>Save Address</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const dlg = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  box: {
    width: 300, backgroundColor: Colors.surface,
    borderRadius: Radius.xl, padding: Spacing.xxl,
    alignItems: 'center', gap: Spacing.md,
    ...Shadow.sm,
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  body: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  bold: { fontFamily: FontFamily.semiBold, color: Colors.textPrimary },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm, width: '100%' },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.full, paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textSecondary },
  deleteBtn: {
    flex: 1, backgroundColor: Colors.danger,
    borderRadius: Radius.full, paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  deleteText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: '#fff' },
});

/* ─── Address card ───────────────────────────────────── */
function AddressCard({
  address, onEdit, onDelete, onSetDefault,
}: {
  address: UserAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const confirmDelete = () => setShowConfirm(true);

  const showMenu = () => {
    const options = address.is_default
      ? ['Edit', 'Delete', 'Cancel']
      : ['Edit', 'Set as Default', 'Delete', 'Cancel'];
    const destructiveIndex = options.indexOf('Delete');
    const cancelIndex = options.indexOf('Cancel');
    Alert.alert(address.label, formatAddress(address), options.map((opt, i) => ({
      text: opt,
      style: i === destructiveIndex ? 'destructive' : i === cancelIndex ? 'cancel' : 'default',
      onPress: () => {
        if (opt === 'Edit') onEdit();
        else if (opt === 'Delete') confirmDelete();
        else if (opt === 'Set as Default') onSetDefault();
      },
    })));
  };

  return (
    <>
      {/* Delete confirmation modal */}
      <Modal visible={showConfirm} transparent animationType="fade" onRequestClose={() => setShowConfirm(false)}>
        <Pressable style={dlg.overlay} onPress={() => setShowConfirm(false)}>
          <Pressable style={dlg.box} onPress={e => e.stopPropagation()}>
            <View style={dlg.iconWrap}>
              <Ionicons name="trash-outline" size={28} color={Colors.danger} />
            </View>
            <Text style={dlg.title}>Delete Address</Text>
            <Text style={dlg.body}>Remove your <Text style={dlg.bold}>{address.label}</Text> address? This action cannot be undone.</Text>
            <View style={dlg.btnRow}>
              <Pressable style={dlg.cancelBtn} onPress={() => setShowConfirm(false)}>
                <Text style={dlg.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={dlg.deleteBtn} onPress={() => { setShowConfirm(false); onDelete(); }}>
                <Text style={dlg.deleteText}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={card.container}>
        <View style={card.top}>
          <View style={card.labelRow}>
            <View style={card.labelChip}>
              <Text style={card.labelIcon}>{LABEL_ICON[address.label]}</Text>
              <Text style={card.labelText}>{address.label.toUpperCase()}</Text>
            </View>
            {address.is_default && (
              <View style={card.defaultBadge}>
                <Text style={card.defaultText}>DEFAULT</Text>
              </View>
            )}
          </View>
          <Pressable onPress={showMenu} style={card.menuBtn} hitSlop={8}>
            <Ionicons name="ellipsis-vertical" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>

        <Text style={card.name}>{address.name}  <Text style={card.phone}>{address.phone}</Text></Text>
        <Text style={card.addressText}>{formatAddress(address)}</Text>

        <View style={{ marginVertical: Spacing.sm }}><Divider /></View>
        <View style={card.actions}>
          <Pressable style={card.actionBtn} onPress={onEdit}>
            <Ionicons name="pencil-outline" size={14} color={Colors.primary} />
            <Text style={card.actionText}>Edit</Text>
          </Pressable>
          {!address.is_default && (
            <Pressable style={card.actionBtn} onPress={onSetDefault}>
              <Ionicons name="star-outline" size={14} color={Colors.primary} />
              <Text style={card.actionText}>Set Default</Text>
            </Pressable>
          )}
          <Pressable style={card.actionBtn} onPress={confirmDelete}>
            <Ionicons name="trash-outline" size={14} color={Colors.danger} />
            <Text style={[card.actionText, { color: Colors.danger }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

/* ─── Main screen ────────────────────────────────────── */
export default function Addresses() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [mode,      setMode]      = useState<Mode>('list');
  const [editId,    setEditId]    = useState<string | null>(null);
  const [initForm,  setInitForm]  = useState<FormData>(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await api.get<UserAddress[]>('/api/addresses');
      setAddresses(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load addresses');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Add ── */
  const startAdd = () => {
    setInitForm(EMPTY_FORM);
    setEditId(null);
    setMode('add');
  };

  /* ── Edit ── */
  const startEdit = (a: UserAddress) => {
    setInitForm({
      label: a.label, name: a.name, phone: a.phone,
      house_no: a.house_no, area: a.area, landmark: a.landmark || '',
      city: a.city, state: a.state, pincode: a.pincode,
    });
    setEditId(a.id);
    setMode('edit');
  };

  /* ── Save (add or edit) ── */
  const handleSave = async (data: FormData) => {
    setSaving(true);
    try {
      if (mode === 'add') {
        const created = await api.post<UserAddress>('/api/addresses', data);
        setAddresses(prev => {
          const list = created.is_default
            ? prev.map(a => ({ ...a, is_default: false }))
            : prev;
          return [created, ...list];
        });
      } else if (editId) {
        const updated = await api.put<UserAddress>(`/api/addresses/${editId}`, data);
        setAddresses(prev => prev.map(a => a.id === editId ? updated : a));
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMode('list');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save address');
    } finally { setSaving(false); }
  };

  /* ── Set default ── */
  const handleSetDefault = async (id: string) => {
    try {
      await api.put(`/api/addresses/${id}/default`, {});
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update');
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/addresses/${id}`);
      setAddresses(prev => {
        const remaining = prev.filter(a => a.id !== id);
        // If deleted was default and there are others, promote the first
        const hadDefault = prev.find(a => a.id === id)?.is_default;
        if (hadDefault && remaining.length > 0) {
          remaining[0] = { ...remaining[0], is_default: true };
        }
        return remaining;
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete');
    }
  };

  /* ─── Render ─────────────────────────────────────── */
  if (mode === 'add' || mode === 'edit') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Pressable onPress={() => setMode('list')} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>{mode === 'add' ? 'Add New Address' : 'Edit Address'}</Text>
          <View style={{ width: 36 }} />
        </View>
        <Divider />
        <AddressForm
          initial={initForm}
          onSave={handleSave}
          onCancel={() => setMode('list')}
          saving={saving}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile' as any)} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Manage Addresses</Text>
        <View style={{ width: 36 }} />
      </View>
      <Divider />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.xxl, gap: Spacing.lg, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {addresses.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>📍</Text>
              <Text style={styles.emptyTitle}>No saved addresses</Text>
              <Text style={styles.emptySub}>Add your home or office address for faster checkout</Text>
            </View>
          ) : (
            addresses.map(a => (
              <AddressCard
                key={a.id}
                address={a}
                onEdit={() => startEdit(a)}
                onDelete={() => handleDelete(a.id)}
                onSetDefault={() => handleSetDefault(a.id)}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Add new address button */}
      {!loading && (
        <View style={styles.fab}>
          <Pressable style={styles.addBtn} onPress={startAdd}>
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.addText}>ADD NEW ADDRESS</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xxl },
  errorText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.danger, textAlign: 'center' },
  retryBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl, borderRadius: Radius.full, backgroundColor: Colors.primary },
  retryText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: '#fff' },
  emptyBox: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxxl },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  emptySub: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  fab: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: Radius.full, paddingVertical: Spacing.md + 2,
  },
  addText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: '#fff', letterSpacing: 0.5 },
});

const card = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, ...Shadow.sm,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  labelChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  labelIcon: { fontSize: 12 },
  labelText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.primary },
  defaultBadge: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  defaultText: { fontFamily: FontFamily.bold, fontSize: 10, color: '#fff', letterSpacing: 0.5 },
  menuBtn: { padding: 4 },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary, marginBottom: 2 },
  phone: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted },
  addressText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
});

const form_ = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md },
  fieldWrap: { gap: 6 },
  label: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  optional: { fontFamily: FontFamily.regular, color: Colors.textMuted },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    fontFamily: FontFamily.regular, fontSize: FontSize.sm,
    color: Colors.textPrimary, backgroundColor: Colors.surface,
  },
  inputError: { borderColor: Colors.danger },
  error: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.danger },
  statePicker: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: Spacing.md,
  },
  stateText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary },
  statePlaceholder: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted },
  labelRow: { flexDirection: 'row', gap: Spacing.sm },
  labelChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.surface,
  },
  labelChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  labelChipIcon: { fontSize: 16 },
  labelChipText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  labelChipTextActive: { color: Colors.primary },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.full, paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textSecondary },
  saveBtn: {
    flex: 2, backgroundColor: Colors.primary,
    borderRadius: Radius.full, paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: '#fff' },
});
