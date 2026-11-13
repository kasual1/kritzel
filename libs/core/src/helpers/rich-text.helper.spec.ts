import { UpdrawRichTextHelper } from './rich-text.helper';

describe('UpdrawRichTextHelper.toPlainText', () => {
  const paragraph = (...content: unknown[]) => ({ type: 'paragraph', content });
  const text = (value: string) => ({ type: 'text', text: value });

  it('separates paragraphs with a line break', () => {
    expect(UpdrawRichTextHelper.toPlainText({ type: 'doc', content: [paragraph(text('Hello')), paragraph(text('World'))] })).toBe('Hello\nWorld');
  });

  it('turns hard breaks into line breaks and joins marks', () => {
    const doc = { type: 'doc', content: [paragraph(text('A'), { type: 'hard_break' }, text('B'), { type: 'text', text: 'C', marks: [{ type: 'bold' }] })] };
    expect(UpdrawRichTextHelper.toPlainText(doc)).toBe('A\nBC');
  });

  it('keeps empty paragraphs between text and drops trailing ones', () => {
    expect(UpdrawRichTextHelper.toPlainText({ type: 'doc', content: [paragraph(text('A')), paragraph(), paragraph(text('B')), paragraph()] })).toBe('A\n\nB');
  });

  it('returns an empty string for empty or broken content', () => {
    expect(UpdrawRichTextHelper.toPlainText(undefined)).toBe('');
    expect(UpdrawRichTextHelper.toPlainText({ type: 'doc', content: [paragraph()] })).toBe('');
    expect(UpdrawRichTextHelper.toPlainText('nonsense')).toBe('');
  });
});
