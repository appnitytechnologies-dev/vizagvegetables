import { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, Pressable, TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';
import { INDIAN_STATES } from '../../lib/addressTypes';

export default function StatePicker({ visible, selected, onSelect, onClose }: {
  visible:  boolean;
  selected: string;
  onSelect: (state: string) => void;
  onClose:  () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = INDIAN_STATES.filter(s =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.container} edges={['top', 'bottom']}>
        <View style={s.header}>
          <Text style={s.title}>Select State</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </Pressable>
        </View>

        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search state…"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              style={[s.item, item === selected && s.itemActive]}
              onPress={() => { onSelect(item); onClose(); setSearch(''); }}
            >
              <Text style={[s.itemText, item === selected && s.itemTextActive]}>
                {item}
              </Text>
              {item === selected && (
                <Ionicons name="checkmark" size={18} color={Colors.primary} />
              )}
            </Pressable>
          )}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: Colors.border }} />
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title:      { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    margin: Spacing.lg, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  searchInput:    { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary },
  item:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md + 2, backgroundColor: Colors.surface },
  itemActive:     { backgroundColor: Colors.primaryLight },
  itemText:       { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary },
  itemTextActive: { fontFamily: FontFamily.semiBold, color: Colors.primary },
});
