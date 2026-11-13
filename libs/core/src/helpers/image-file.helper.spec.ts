import { UpdrawImageFileHelper } from './image-file.helper';

describe('UpdrawImageFileHelper', () => {
  it('identifies GIF MIME types case-insensitively', () => {
    expect(UpdrawImageFileHelper.isGifFile({ name: 'image.bin', type: 'IMAGE/GIF' })).toBe(true);
  });

  it('uses a case-insensitive GIF extension when the MIME type is empty', () => {
    expect(UpdrawImageFileHelper.isGifFile({ name: 'animation.GIF', type: '' })).toBe(true);
  });

  it('does not override a non-GIF MIME type based on the filename', () => {
    expect(UpdrawImageFileHelper.isGifFile({ name: 'image.gif', type: 'image/png' })).toBe(false);
  });

  it('rejects non-GIF files', () => {
    expect(UpdrawImageFileHelper.isGifFile({ name: 'image.png', type: 'image/png' })).toBe(false);
  });
});