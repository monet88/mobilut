import { ARTISTIC_LOOK_STYLES, getArtisticLookById, getStylesByFamily } from '@core/stylistic/artistic-look-model';
import { isArtisticLookActive } from '@core/render/artistic-look-transform';

describe('artistic-look-model', () => {
  it('exposes the expected artistic look styles', () => {
    expect(ARTISTIC_LOOK_STYLES).toHaveLength(7);
    expect(ARTISTIC_LOOK_STYLES.map((style) => style.id)).toEqual([
      'vintage-warm',
      'vintage-cool',
      'film-kodak',
      'film-fuji',
      'modern-crisp',
      'dramatic-dark',
      'soft-glow',
    ]);
  });

  it('looks up styles by id', () => {
    expect(getArtisticLookById('film-kodak')).toMatchObject({
      id: 'film-kodak',
      name: 'Film Kodak',
      family: 'film',
    });
  });

  it('returns undefined for an unknown id', () => {
    expect(getArtisticLookById('missing-style')).toBeUndefined();
  });

  it('filters styles by family', () => {
    expect(getStylesByFamily('vintage').map((style) => style.id)).toEqual([
      'vintage-warm',
      'vintage-cool',
    ]);
    expect(getStylesByFamily('modern')).toEqual([
      expect.objectContaining({ id: 'modern-crisp', family: 'modern' }),
    ]);
  });
});

describe('isArtisticLookActive', () => {
  it('returns false for null and invalid params', () => {
    expect(isArtisticLookActive(null)).toBe(false);
    expect(isArtisticLookActive({ styleId: 'missing-style', intensity: 1 })).toBe(false);
  });

  it('returns false at zero intensity and true above zero', () => {
    expect(isArtisticLookActive({ styleId: 'film-kodak', intensity: 0 })).toBe(false);
    expect(isArtisticLookActive({ styleId: 'film-kodak', intensity: 0.0001 })).toBe(true);
    expect(isArtisticLookActive({ styleId: 'film-kodak', intensity: 1 })).toBe(true);
  });

  it('treats negative intensity as inactive', () => {
    expect(isArtisticLookActive({ styleId: 'film-kodak', intensity: -1 })).toBe(false);
  });
});
