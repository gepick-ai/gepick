import { beforeEach, describe, expect, it } from 'vitest';
import { QuickPickItem, filterItems, findMatches } from '@gepick/core/common';

describe('quick-input-service', () => {
  describe('#findMatches', () => {
    it('should return the proper highlights when matches are found', () => {
      expect(findMatches('abc', 'a')).deep.equal([{ start: 0, end: 1 }]);
      expect(findMatches('abc', 'ab')).deep.equal([{ start: 0, end: 1 }, { start: 1, end: 2 }]);
      expect(findMatches('abc', 'ac')).deep.equal([{ start: 0, end: 1 }, { start: 2, end: 3 }]);
      expect(findMatches('abc', 'abc')).deep.equal([{ start: 0, end: 1 }, { start: 1, end: 2 }, { start: 2, end: 3 }]);
    });

    it('should fail when out of order', () => {
      expect(findMatches('abc', 'ba')).equal(undefined);
    });

    it('should return `undefined` when no matches are found', () => {
      expect(findMatches('abc', 'f')).equal(undefined);
    });

    it('should return `undefined` when no filter is present', () => {
      expect(findMatches('abc', '')).equal(undefined);
    });
  });

  describe('#filterItems', () => {
    let items: QuickPickItem[] = [];

    beforeEach(() => {
      items = [
        { label: 'a' },
        { label: 'abc', description: 'v' },
        { label: 'def', description: 'd', detail: 'y' },
        { label: 'z', description: 'z', detail: 'z' },
      ];
    });

    it('should return the full list when no filter is present', () => {
      const result = filterItems(items, '');
      expect(result).deep.equal(items);
    });

    it('should filter items based on the label', () => {
      const expectation: QuickPickItem = {
        label: 'abc',
        highlights: {
          label: [
            { start: 0, end: 1 },
            { start: 1, end: 2 },
            { start: 2, end: 3 },
          ],
        },
      };
      const result = filterItems(items, 'abc').filter(QuickPickItem.is);
      expect(result).length(1);
      expect(result[0].label).equal(expectation.label);
      expect(result[0].highlights?.label).deep.equal(expectation.highlights?.label);
    });

    it('should filter items based on `description` if `label` does not match', () => {
      const expectation: QuickPickItem = {
        label: 'abc',
        description: 'v',
        highlights: {
          description: [
            { start: 0, end: 1 },
          ],
        },
      };
      const result = filterItems(items, 'v').filter(QuickPickItem.is);
      expect(result).length(1);
      expect(result[0].label).equal(expectation.label);
      expect(result[0].description).equal(expectation.description);
      expect(result[0].highlights?.label).equal(undefined);
      expect(result[0].highlights?.description).deep.equal(expectation.highlights?.description);
    });

    it('should filter items based on `detail` if `label` and `description` does not match', () => {
      const expectation: QuickPickItem = {
        label: 'def',
        description: 'd',
        detail: 'y',
        highlights: {
          detail: [
            { start: 0, end: 1 },
          ],
        },
      };
      const result = filterItems(items, 'y').filter(QuickPickItem.is);
      expect(result).length(1);
      expect(result[0].label).equal(expectation.label);
      expect(result[0].description).equal(expectation.description);
      expect(result[0].detail).equal(expectation.detail);
      expect(result[0].highlights?.label).equal(undefined);
      expect(result[0].highlights?.description).equal(undefined);
      expect(result[0].highlights?.detail).deep.equal(expectation.highlights?.detail);
    });

    it('should return multiple highlights if it matches multiple properties', () => {
      const expectation: QuickPickItem = {
        label: 'z',
        description: 'z',
        detail: 'z',
        highlights: {
          label: [
            { start: 0, end: 1 },
          ],
          description: [
            { start: 0, end: 1 },
          ],
          detail: [
            { start: 0, end: 1 },
          ],
        },
      };
      const result = filterItems(items, 'z').filter(QuickPickItem.is);
      expect(result).length(1);

      expect(result[0].label).equal(expectation.label);
      expect(result[0].description).equal(expectation.description);
      expect(result[0].detail).equal(expectation.detail);

      expect(result[0].highlights?.label).deep.equal(expectation.highlights?.label);
      expect(result[0].highlights?.description).deep.equal(expectation.highlights?.description);
      expect(result[0].highlights?.detail).deep.equal(expectation.highlights?.detail);
    });

    it('should reset highlights upon subsequent searches', () => {
      const expectation: QuickPickItem = {
        label: 'abc',
        highlights: {
          label: [
            { start: 0, end: 1 },
            { start: 1, end: 2 },
            { start: 2, end: 3 },
          ],
        },
      };
      let result = filterItems(items, 'abc').filter(QuickPickItem.is);
      expect(result).length(1);
      expect(result[0].label).equal(expectation.label);
      expect(result[0].highlights?.label).deep.equal(expectation.highlights?.label);

      result = filterItems(items, '').filter(QuickPickItem.is);
      expect(result[0].highlights?.label).equal(undefined);
    });

    it('should return an empty list when no matches are found', () => {
      expect(filterItems(items, 'yyy')).deep.equal([]);
    });
  });
});
