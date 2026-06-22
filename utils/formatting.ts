export function insertFormatting(
  text: string,
  selection: { start: number; end: number },
  type: 'bold' | 'italic' | 'checklist' | 'bullet'
): { nextText: string; nextSelection: { start: number; end: number } } {
  const { start, end } = selection;
  const selectedText = text.substring(start, end);

  let insertBefore = '';
  let insertAfter = '';

  switch (type) {
    case 'bold':
      insertBefore = '**';
      insertAfter = '**';
      break;
    case 'italic':
      insertBefore = '*';
      insertAfter = '*';
      break;
    case 'checklist':
      insertBefore = '\n- [ ] ';
      break;
    case 'bullet':
      insertBefore = '\n- ';
      break;
  }

  const nextText =
    text.substring(0, start) +
    insertBefore +
    selectedText +
    insertAfter +
    text.substring(end);

  const newStart = start + insertBefore.length;
  const newEnd = newStart + selectedText.length;

  return { nextText, nextSelection: { start: newStart, end: newEnd } };
}
