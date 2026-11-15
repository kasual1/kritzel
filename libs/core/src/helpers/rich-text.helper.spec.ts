import { UpmadeRichTextHelper } from './rich-text.helper';

describe('UpmadeRichTextHelper.toPlainText', () => {
  const paragraph = (...content: unknown[]) => ({ type: 'paragraph', content });
  const text = (value: string) => ({ type: 'text', text: value });

  it('separates paragraphs with a line break', () => {
    expect(UpmadeRichTextHelper.toPlainText({ type: 'doc', content: [paragraph(text('Hello')), paragraph(text('World'))] })).toBe('Hello\nWorld');
  });

  it('turns hard breaks into line breaks and joins marks', () => {
    const doc = { type: 'doc', content: [paragraph(text('A'), { type: 'hard_break' }, text('B'), { type: 'text', text: 'C', marks: [{ type: 'bold' }] })] };
    expect(UpmadeRichTextHelper.toPlainText(doc)).toBe('A\nBC');
  });

  it('keeps empty paragraphs between text and drops trailing ones', () => {
    expect(UpmadeRichTextHelper.toPlainText({ type: 'doc', content: [paragraph(text('A')), paragraph(), paragraph(text('B')), paragraph()] })).toBe('A\n\nB');
  });

  it('returns an empty string for empty or broken content', () => {
    expect(UpmadeRichTextHelper.toPlainText(undefined)).toBe('');
    expect(UpmadeRichTextHelper.toPlainText({ type: 'doc', content: [paragraph()] })).toBe('');
    expect(UpmadeRichTextHelper.toPlainText('nonsense')).toBe('');
  });
});
