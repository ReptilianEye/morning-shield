import React, { type ComponentRef, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatTime24 } from '@/store/useMorningStore';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const ITEM_HEIGHT = 42;

export interface TimePickerModalProps {
  visible: boolean;
  title: string;
  initialHour: number;
  initialMinute: number;
  onCancel: () => void;
  onConfirm: (hour: number, minute: number) => void;
}

export function TimePickerModal({
  visible,
  title,
  initialHour,
  initialMinute,
  onCancel,
  onConfirm,
}: TimePickerModalProps) {
  const theme = useTheme();
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const hourScrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const minuteScrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      hourScrollRef.current?.scrollTo({
        y: Math.max(0, (initialHour - 1) * ITEM_HEIGHT),
        animated: false,
      });
      minuteScrollRef.current?.scrollTo({
        y: Math.max(0, (initialMinute - 1) * ITEM_HEIGHT),
        animated: false,
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [visible, initialHour, initialMinute]);

  const nudgeHour = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    setHour((prev) => {
      const next = (prev + delta + 24) % 24;
      hourScrollRef.current?.scrollTo({
        y: Math.max(0, (next - 1) * ITEM_HEIGHT),
        animated: true,
      });
      return next;
    });
  };

  const nudgeMinute = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    setMinute((prev) => {
      const next = (prev + delta + 60) % 60;
      minuteScrollRef.current?.scrollTo({
        y: Math.max(0, (next - 1) * ITEM_HEIGHT),
        animated: true,
      });
      return next;
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}>
          <View style={styles.headerRow}>
            <View>
              <ThemedText type="eyebrow" themeColor="accent">
                SET TIME
              </ThemedText>
              <ThemedText type="subtitle">{title}</ThemedText>
            </View>
            <View style={[styles.previewBadge, { backgroundColor: theme.accentSoft }]}>
              <ThemedText type="subtitle" style={[styles.previewText, { color: theme.accent }]}>
                {formatTime24(hour, minute)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.columnsRow}>
            {/* Hour Column */}
            <View style={styles.columnWrap}>
              <View style={styles.columnHeader}>
                <ThemedText type="eyebrow" themeColor="textSecondary">
                  Hour
                </ThemedText>
                <View style={styles.nudgePair}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Previous hour"
                    onPress={() => nudgeHour(-1)}
                    style={({ pressed }) => [
                      styles.nudgeBtn,
                      { backgroundColor: theme.backgroundSelected },
                      pressed && styles.pressed,
                    ]}>
                    <SymbolView
                      name={{ ios: 'minus' }}
                      size={11}
                      tintColor={theme.text}
                      fallback={<ThemedText type="smallBold">−</ThemedText>}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Next hour"
                    onPress={() => nudgeHour(1)}
                    style={({ pressed }) => [
                      styles.nudgeBtn,
                      { backgroundColor: theme.backgroundSelected },
                      pressed && styles.pressed,
                    ]}>
                    <SymbolView
                      name={{ ios: 'plus' }}
                      size={11}
                      tintColor={theme.text}
                      fallback={<ThemedText type="smallBold">+</ThemedText>}
                    />
                  </Pressable>
                </View>
              </View>

              <ScrollView
                ref={hourScrollRef}
                style={[styles.wheelBox, { backgroundColor: theme.background }]}
                showsVerticalScrollIndicator={false}>
                {HOURS.map((h) => {
                  const selected = h === hour;
                  return (
                    <Pressable
                      key={h}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setHour(h);
                      }}
                      style={[
                        styles.wheelItem,
                        selected && { backgroundColor: theme.accentSoft },
                      ]}>
                      <ThemedText
                        type="bigger"
                        style={[
                          styles.wheelText,
                          selected && { color: theme.accent },
                        ]}>
                        {String(h).padStart(2, '0')}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <ThemedText type="title" themeColor="textSecondary" style={styles.colon}>
              :
            </ThemedText>

            {/* Minute Column */}
            <View style={styles.columnWrap}>
              <View style={styles.columnHeader}>
                <ThemedText type="eyebrow" themeColor="textSecondary">
                  Minute
                </ThemedText>
                <View style={styles.nudgePair}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Previous minute"
                    onPress={() => nudgeMinute(-1)}
                    style={({ pressed }) => [
                      styles.nudgeBtn,
                      { backgroundColor: theme.backgroundSelected },
                      pressed && styles.pressed,
                    ]}>
                    <SymbolView
                      name={{ ios: 'minus' }}
                      size={11}
                      tintColor={theme.text}
                      fallback={<ThemedText type="smallBold">−</ThemedText>}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Next minute"
                    onPress={() => nudgeMinute(1)}
                    style={({ pressed }) => [
                      styles.nudgeBtn,
                      { backgroundColor: theme.backgroundSelected },
                      pressed && styles.pressed,
                    ]}>
                    <SymbolView
                      name={{ ios: 'plus' }}
                      size={11}
                      tintColor={theme.text}
                      fallback={<ThemedText type="smallBold">+</ThemedText>}
                    />
                  </Pressable>
                </View>
              </View>

              <ScrollView
                ref={minuteScrollRef}
                style={[styles.wheelBox, { backgroundColor: theme.background }]}
                showsVerticalScrollIndicator={false}>
                {MINUTES.map((m) => {
                  const selected = m === minute;
                  return (
                    <Pressable
                      key={m}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setMinute(m);
                      }}
                      style={[
                        styles.wheelItem,
                        selected && { backgroundColor: theme.accentSoft },
                      ]}>
                      <ThemedText
                        type="bigger"
                        style={[
                          styles.wheelText,
                          selected && { color: theme.accent },
                        ]}>
                        {String(m).padStart(2, '0')}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: theme.backgroundSelected },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold">Cancel</ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onConfirm(hour, minute);
              }}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={styles.confirmText}>
                Confirm
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  previewText: {
    fontVariant: ['tabular-nums'],
  },
  columnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  columnWrap: {
    flex: 1,
    gap: 8,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nudgePair: {
    flexDirection: 'row',
    gap: 6,
  },
  nudgeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelBox: {
    height: 196,
    borderRadius: 16,
    padding: 6,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: {
    fontVariant: ['tabular-nums'],
  },
  colon: {
    marginTop: 26,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.78,
  },
});
