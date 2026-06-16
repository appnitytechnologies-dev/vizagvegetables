import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { FontFamily, FontSize } from '../constants/typography';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { useCart } from '../hooks/useCart';
import { api } from '../lib/api';
import { UserAddress, formatAddress } from '../lib/addressTypes';
import StatePicker from '../components/ui/StatePicker';
import StepperBar from '../components/StepperBar';
import Divider from '../components/ui/Divider';

const LABEL_ICON: Record<string, string> = { Home: '🏠', Office: '🏢', Other: '📍' };

const SLOTS = [
  { id: 'morning',  label: '6 AM – 9 AM',  icon: '🌅', sub: 'Early morning' },
  { id: 'forenoon', label: '9 AM – 12 PM', icon: '☀️', sub: 'Morning' },
  { id: 'evening',  label: '4 PM – 7 PM',  icon: '🌇', sub: 'Evening' },
];

/* ─── New address inline form ────────────────────────── */
type NewAddrForm = {
  label: 'Home' | 'Office' | 'Other';
  name: string; phone: string; house_no: string; area: string;
  landmark: string; city: string; state: string; pincode: string;
  save: boolean;
};
const EMPTY: NewAddrForm = {
  label: 'Home', name: '', phone: '', house_no: '', area: '',
  landmark: '', city: 'Visakhapatnam', state: 'Andhra Pradesh', pincode: '', save: true,
};
type Errors = Partial<Record<keyof NewAddrForm, string>>;

function NewAddressForm({
  form, setForm, errors, setErrors,
}: {
  form: NewAddrForm;
  setForm: React.Dispatch<React.SetStateAction<NewAddrForm>>;
  errors: Errors;
  setErrors: React.Dispatch<React.SetStateAction<Errors>>;
}) {
  const [showStatePicker, setShowStatePicker] = useState(false);
  const set = (key: keyof NewAddrForm, val: any) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  return (
    <View style={{ gap: Spacing.md }}>
      {/* Label chips */}
      <View style={newForm.row}>
        {(['Home', 'Office', 'Other'] as const).map(l => (
          <Pressable key={l}
            style={[newForm.labelChip, form.label === l && newForm.labelChipActive]}
            onPress={() => set('label', l)}>
            <Text style={newForm.labelIcon}>{LABEL_ICON[l]}</Text>
            <Text style={[newForm.labelText, form.label === l && newForm.labelTextActive]}>{l}</Text>
          </Pressable>
        ))}
      </View>

      {/* Name + Phone */}
      <View style={newForm.row}>
        <View style={{ flex: 1 }}>
          <Text style={newForm.label}>Full Name</Text>
          <TextInput style={[newForm.input, errors.name && newForm.inputErr]}
            placeholder="Ravi Kumar" placeholderTextColor={Colors.textMuted}
            value={form.name} onChangeText={v => set('name', v)} />
          {!!errors.name && <Text style={newForm.err}>{errors.name}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={newForm.label}>Mobile</Text>
          <TextInput style={[newForm.input, errors.phone && newForm.inputErr]}
            placeholder="9876543210" placeholderTextColor={Colors.textMuted}
            value={form.phone} onChangeText={v => set('phone', v.replace(/\D/g, ''))}
            keyboardType="phone-pad" maxLength={10} />
          {!!errors.phone && <Text style={newForm.err}>{errors.phone}</Text>}
        </View>
      </View>

      {/* House */}
      <View>
        <Text style={newForm.label}>House / Flat / Building</Text>
        <TextInput style={[newForm.input, errors.house_no && newForm.inputErr]}
          placeholder="Flat 4B, Sunrise Apts" placeholderTextColor={Colors.textMuted}
          value={form.house_no} onChangeText={v => set('house_no', v)} />
        {!!errors.house_no && <Text style={newForm.err}>{errors.house_no}</Text>}
      </View>

      {/* Area */}
      <View>
        <Text style={newForm.label}>Area / Street / Locality</Text>
        <TextInput style={[newForm.input, errors.area && newForm.inputErr]}
          placeholder="MVP Colony, Near Park" placeholderTextColor={Colors.textMuted}
          value={form.area} onChangeText={v => set('area', v)} />
        {!!errors.area && <Text style={newForm.err}>{errors.area}</Text>}
      </View>

      {/* Landmark */}
      <View>
        <Text style={newForm.label}>Landmark <Text style={{ color: Colors.textMuted, fontFamily: FontFamily.regular }}>(optional)</Text></Text>
        <TextInput style={newForm.input}
          placeholder="Near Government Hospital" placeholderTextColor={Colors.textMuted}
          value={form.landmark} onChangeText={v => set('landmark', v)} />
      </View>

      {/* Pincode + City */}
      <View style={newForm.row}>
        <View style={{ flex: 1 }}>
          <Text style={newForm.label}>Pincode</Text>
          <TextInput style={[newForm.input, errors.pincode && newForm.inputErr]}
            placeholder="530026" placeholderTextColor={Colors.textMuted}
            value={form.pincode} onChangeText={v => set('pincode', v.replace(/\D/g, ''))}
            keyboardType="number-pad" maxLength={6} />
          {!!errors.pincode && <Text style={newForm.err}>{errors.pincode}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={newForm.label}>City / Town</Text>
          <TextInput style={[newForm.input, errors.city && newForm.inputErr]}
            placeholder="Visakhapatnam" placeholderTextColor={Colors.textMuted}
            value={form.city} onChangeText={v => set('city', v)} />
          {!!errors.city && <Text style={newForm.err}>{errors.city}</Text>}
        </View>
      </View>

      {/* State picker */}
      <View>
        <Text style={newForm.label}>State</Text>
        <Pressable style={[newForm.input, newForm.stateRow, errors.state && newForm.inputErr]}
          onPress={() => setShowStatePicker(true)}>
          <Text style={form.state ? newForm.stateVal : newForm.statePlaceholder}>
            {form.state || 'Select State'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
        </Pressable>
        {!!errors.state && <Text style={newForm.err}>{errors.state}</Text>}
      </View>

      <StatePicker visible={showStatePicker} selected={form.state}
        onSelect={v => set('state', v)} onClose={() => setShowStatePicker(false)} />

      {/* Save to address book */}
      <Pressable style={newForm.saveRow} onPress={() => set('save', !form.save)}>
        <View style={[newForm.checkbox, form.save && newForm.checkboxActive]}>
          {form.save && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <Text style={newForm.saveLabel}>Save to my address book</Text>
      </Pressable>
    </View>
  );
}

/* ─── Main screen ────────────────────────────────────── */
export default function CheckoutAddress() {
  const { items, total } = useCart();
  const count = items.length;
  const [addresses,    setAddresses]    = useState<UserAddress[]>([]);
  const [loadingAddrs, setLoadingAddrs] = useState(true);
  const [selectedId,   setSelectedId]  = useState<string | null>(null);
  const [useNew,       setUseNew]       = useState(false);
  const [newForm,      setNewForm]      = useState<NewAddrForm>(EMPTY);
  const [formErrors,   setFormErrors]   = useState<Errors>({});
  const [slot,         setSlot]         = useState(SLOTS[1].label);
  const [error,        setError]        = useState('');

  /* Load saved addresses */
  useEffect(() => {
    api.get<UserAddress[]>('/api/addresses')
      .then(data => {
        setAddresses(data);
        const def = data.find(a => a.is_default) ?? data[0];
        if (def) { setSelectedId(def.id); setUseNew(false); }
        else     { setUseNew(true); }
      })
      .catch(() => setUseNew(true))
      .finally(() => setLoadingAddrs(false));
  }, []);

  /* Validate new address form */
  const validateNew = (): boolean => {
    const e: Errors = {};
    if (!newForm.name.trim())    e.name     = 'Required';
    if (!newForm.phone.trim())   e.phone    = 'Required';
    else if (!/^[6-9]\d{9}$/.test(newForm.phone.trim())) e.phone = 'Valid 10-digit number';
    if (!newForm.house_no.trim()) e.house_no = 'Required';
    if (!newForm.area.trim())    e.area     = 'Required';
    if (!newForm.city.trim())    e.city     = 'Required';
    if (!newForm.state.trim())   e.state    = 'Required';
    if (!newForm.pincode.trim()) e.pincode  = 'Required';
    else if (!/^\d{6}$/.test(newForm.pincode.trim())) e.pincode = 'Valid 6-digit pincode';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = async () => {
    setError('');
    let deliveryAddress = '';

    if (useNew) {
      if (!validateNew()) return;
      // Build address string
      const f = newForm;
      const parts = [f.house_no.trim(), f.area.trim()];
      if (f.landmark.trim()) parts.push(f.landmark.trim());
      parts.push(`${f.city.trim()}, ${f.state.trim()} – ${f.pincode.trim()}`);
      deliveryAddress = parts.join(', ');

      // Optionally save to address book
      if (f.save) {
        try {
          const created = await api.post<UserAddress>('/api/addresses', {
            label: f.label, name: f.name, phone: f.phone,
            house_no: f.house_no, area: f.area,
            landmark: f.landmark || undefined,
            city: f.city, state: f.state, pincode: f.pincode,
          });
          setAddresses(prev => [created, ...prev]);
          setSelectedId(created.id);
        } catch { /* non-fatal */ }
      }
    } else {
      const addr = addresses.find(a => a.id === selectedId);
      if (!addr) { setError('Please select a delivery address'); return; }
      deliveryAddress = formatAddress(addr);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/checkout-payment',
      params: { address: deliveryAddress, slot },
    } as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>My Cart{count > 0 ? ` (${count})` : ''}</Text>
        <View style={{ width: 32 }} />
      </View>
      <Divider />
      <StepperBar step={2} />
      <Divider />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: Spacing.xxl, gap: Spacing.lg, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Delivery Address section ── */}
          <Text style={styles.sectionTitle}>Delivery Address</Text>

          {loadingAddrs ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading addresses…</Text>
            </View>
          ) : (
            <>
              {/* Saved address cards */}
              {addresses.map(addr => {
                const isSelected = !useNew && selectedId === addr.id;
                return (
                  <Pressable
                    key={addr.id}
                    style={[styles.addrCard, isSelected && styles.addrCardSelected]}
                    onPress={() => { setSelectedId(addr.id); setUseNew(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <View style={styles.addrCardLeft}>
                      <View style={[styles.radio, isSelected && styles.radioActive]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.addrCardTopRow}>
                          <View style={styles.labelChip}>
                            <Text style={styles.labelIcon}>{LABEL_ICON[addr.label]}</Text>
                            <Text style={styles.labelText}>{addr.label.toUpperCase()}</Text>
                          </View>
                          {addr.is_default && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultText}>DEFAULT</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.addrName}>{addr.name}  <Text style={styles.addrPhone}>{addr.phone}</Text></Text>
                        <Text style={styles.addrText}>{formatAddress(addr)}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}

              {/* Use new address toggle */}
              <Pressable
                style={[styles.addrCard, useNew && styles.addrCardSelected]}
                onPress={() => { setUseNew(true); setSelectedId(null); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <View style={styles.addrCardLeft}>
                  <View style={[styles.radio, useNew && styles.radioActive]}>
                    {useNew && <View style={styles.radioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addrName}>
                      {addresses.length === 0 ? 'Enter delivery address' : '+ Use a different address'}
                    </Text>
                  </View>
                </View>
              </Pressable>

              {/* New address form — visible only when useNew */}
              {useNew && (
                <View style={styles.newFormBox}>
                  <NewAddressForm
                    form={newForm}
                    setForm={setNewForm}
                    errors={formErrors}
                    setErrors={setFormErrors}
                  />
                </View>
              )}
            </>
          )}

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Delivery Slot section ── */}
          <Text style={[styles.sectionTitle, { marginTop: Spacing.sm }]}>Delivery Slot</Text>
          <View style={styles.slotsCol}>
            {SLOTS.map(s => (
              <Pressable
                key={s.id}
                style={[styles.slotCard, slot === s.label && styles.slotCardActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSlot(s.label); }}
              >
                <Text style={styles.slotIcon}>{s.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.slotLabel, slot === s.label && styles.slotLabelActive]}>{s.label}</Text>
                  <Text style={styles.slotSub}>{s.sub}</Text>
                </View>
                {slot === s.label && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <Pressable style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueText}>Continue to Payment — ₹{total}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────── */
const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.surface },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn:    { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title:      { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },

  loadingBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.lg, backgroundColor: Colors.background, borderRadius: Radius.md },
  loadingText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted },

  addrCard: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.lg,
    backgroundColor: Colors.surface, ...Shadow.sm,
  },
  addrCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryPale },
  addrCardLeft:   { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  radio:          { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  radioActive:    { borderColor: Colors.primary },
  radioDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  addrCardTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  labelChip:      { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  labelIcon:      { fontSize: 11 },
  labelText:      { fontFamily: FontFamily.semiBold, fontSize: 10, color: Colors.primary },
  defaultBadge:   { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  defaultText:    { fontFamily: FontFamily.bold, fontSize: 10, color: '#fff', letterSpacing: 0.5 },
  addrName:       { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary, marginBottom: 2 },
  addrPhone:      { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted },
  addrText:       { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  newFormBox:  { backgroundColor: Colors.background, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  errorBox:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.dangerLight, borderRadius: Radius.md, padding: Spacing.md },
  errorText:   { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.danger },

  slotsCol:      { gap: Spacing.sm },
  slotCard:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg, backgroundColor: Colors.surface, ...Shadow.sm },
  slotCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryPale },
  slotIcon:      { fontSize: 24 },
  slotLabel:     { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  slotLabelActive: { color: Colors.primary },
  slotSub:       { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  bottomBar:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  continueBtn:  { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.lg, alignItems: 'center' },
  continueText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.textInverse },
});

const newForm = StyleSheet.create({
  row:               { flexDirection: 'row', gap: Spacing.md },
  label:             { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary, marginBottom: 5 },
  input:             { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary, backgroundColor: Colors.surface },
  inputErr:          { borderColor: Colors.danger },
  err:               { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.danger, marginTop: 3 },
  stateRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stateVal:          { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary },
  statePlaceholder:  { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted },
  labelChip:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.surface },
  labelChipActive:   { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  labelIcon:         { fontSize: 15 },
  labelText:         { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  labelTextActive:   { color: Colors.primary },
  saveRow:           { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  checkbox:          { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive:    { borderColor: Colors.primary, backgroundColor: Colors.primary },
  saveLabel:         { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
});
