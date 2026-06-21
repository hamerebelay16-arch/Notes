import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface TagPickerProps {
  tags: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
}

export function TagPicker({ tags, suggestions, onChange }: TagPickerProps) {
  const theme = useAppTheme();
  const [input, setInput] = useState('');

  const addTag = (raw: string) => {
    const name = raw.trim();
    if (!name || tags.some((t) => t.toLowerCase() === name.toLowerCase())) return;
    onChange([...tags, name]);
    setInput('');
  };

  const removeTag = (name: string) => {
    onChange(tags.filter((t) => t !== name));
  };

  const toggleSuggestion = (name: string) => {
    if (tags.includes(name)) {
      removeTag(name);
    } else {
      onChange([...tags, name]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Tags</Text>

      {tags.length > 0 && (
        <View style={styles.chips}>
          {tags.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => removeTag(tag)}
              style={[styles.tagChip, { backgroundColor: theme.tintMuted, borderColor: theme.tint }]}>
              <Text style={[styles.tagLabel, { color: theme.tint }]} numberOfLines={1}>
                {tag}
              </Text>
              <Ionicons name="close-circle" size={16} color={theme.tint} />
            </Pressable>
          ))}
        </View>
      )}

      <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Add a tag…"
          placeholderTextColor={theme.placeholder}
          style={[styles.input, { color: theme.text }]}
          returnKeyType="done"
          onSubmitEditing={() => addTag(input)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          onPress={() => addTag(input)}
          disabled={!input.trim()}
          style={[styles.addBtn, { opacity: input.trim() ? 1 : 0.35 }]}>
          <Ionicons name="add-circle" size={24} color={theme.tint} />
        </Pressable>
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          <Text style={[styles.suggestionsLabel, { color: theme.textSecondary }]}>
            From your categories
          </Text>
          <View style={styles.chips}>
            {suggestions.map((name) => {
              const isSelected = tags.includes(name);
              return (
                <Pressable
                  key={name}
                  onPress={() => toggleSuggestion(name)}
                  style={[
                    styles.suggestionChip,
                    {
                      backgroundColor: isSelected ? theme.tintMuted : theme.surface,
                      borderColor: isSelected ? theme.tint : theme.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.suggestionLabel,
                      { color: isSelected ? theme.tint : theme.textSecondary },
                    ]}>
                    {name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {tags.length === 0 && suggestions.length === 0 && (
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          Type a tag above, or create categories from Home to use as quick picks.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    maxWidth: '100%',
  },
  tagLabel: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.sm,
  },
  addBtn: {
    padding: Spacing.xs,
  },
  suggestions: {
    gap: Spacing.sm,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  suggestionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
  },
});
