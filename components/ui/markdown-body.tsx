import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';

interface Props {
  children: string;
  fontSize?: number;
}

export function MarkdownBody({ children, fontSize = 15 }: Props) {
  const theme = useAppTheme();
  const lh = fontSize * 1.6;

  const renderInline = (text: string, key: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
    let last = 0;
    let match;
    let i = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > last) {
        parts.push(
          <Text key={`${key}-t${i++}`} style={{ color: theme.text, fontSize, lineHeight: lh }}>
            {text.slice(last, match.index)}
          </Text>
        );
      }
      if (match[2]) {
        parts.push(
          <Text key={`${key}-b${i++}`} style={{ fontWeight: '700', color: theme.text, fontSize, lineHeight: lh }}>
            {match[2]}
          </Text>
        );
      } else if (match[3]) {
        parts.push(
          <Text key={`${key}-i${i++}`} style={{ fontStyle: 'italic', color: theme.text, fontSize, lineHeight: lh }}>
            {match[3]}
          </Text>
        );
      }
      last = match.index + match[0].length;
    }

    if (last < text.length) {
      parts.push(
        <Text key={`${key}-t${i++}`} style={{ color: theme.text, fontSize, lineHeight: lh }}>
          {text.slice(last)}
        </Text>
      );
    }

    return parts.length > 0 ? parts : (
      <Text style={{ color: theme.text, fontSize, lineHeight: lh }}>{text}</Text>
    );
  };

  const lines = (children || '').split('\n');

  const nodes: React.ReactNode[] = [];
  let i = 0;

  for (const raw of lines) {
    const line = raw;

    // checklist done: - [x]
    if (/^- \[x\] /i.test(line)) {
      const content = line.replace(/^- \[x\] /i, '');
      nodes.push(
        <View key={i} style={styles.listRow}>
          <Text style={[styles.checkbox, { color: theme.tint, fontSize }]}>☑ </Text>
          <Text style={{ color: theme.textSecondary, fontSize, lineHeight: lh, textDecorationLine: 'line-through' }}>
            {content}
          </Text>
        </View>
      );
    }
    // checklist empty: - [ ]
    else if (/^- \[ \] /.test(line)) {
      const content = line.replace(/^- \[ \] /, '');
      nodes.push(
        <View key={i} style={styles.listRow}>
          <Text style={[styles.checkbox, { color: theme.textSecondary, fontSize }]}>☐ </Text>
          <Text style={{ color: theme.text, fontSize, lineHeight: lh }}>{renderInline(content, `${i}`)}</Text>
        </View>
      );
    }
    // bullet: - item
    else if (/^- /.test(line)) {
      const content = line.replace(/^- /, '');
      nodes.push(
        <View key={i} style={styles.listRow}>
          <Text style={{ color: theme.tint, fontSize, lineHeight: lh }}>• </Text>
          <Text style={{ color: theme.text, fontSize, lineHeight: lh }}>{renderInline(content, `${i}`)}</Text>
        </View>
      );
    }
    // blank line
    else if (line.trim() === '') {
      nodes.push(<View key={i} style={{ height: fontSize * 0.4 }} />);
    }
    // normal paragraph
    else {
      nodes.push(
        <Text key={i} style={{ color: theme.text, fontSize, lineHeight: lh }}>
          {renderInline(line, `${i}`)}
        </Text>
      );
    }

    i++;
  }

  return <View style={styles.container}>{nodes}</View>;
}

const styles = StyleSheet.create({
  container: { gap: 2 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: { lineHeight: 24 },
});
