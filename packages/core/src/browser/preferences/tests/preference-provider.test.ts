import { describe, expect, it } from "vitest";
import { PreferenceProvider } from "../preference-provider-contribution";

describe("preferenceProvider", () => {
  it('should preserve extra source fields on merge', () => {
    const result = PreferenceProvider.merge({ configurations: [], compounds: [] }, { configurations: [] });
    expect(result).deep.equals({ configurations: [], compounds: [] });
  });

  it('should preserve extra target fields on merge', () => {
    const result = PreferenceProvider.merge({ configurations: [] }, { configurations: [], compounds: [] });
    expect(result).deep.equals({ configurations: [], compounds: [] });
  });

  it('should merge array values', () => {
    const result = PreferenceProvider.merge(
      { configurations: [{ name: 'test1', request: 'launch' }], compounds: [] },
      { configurations: [{ name: 'test2' }] },
    );
    expect(result).deep.equals({ configurations: [{ name: 'test1', request: 'launch' }, { name: 'test2' }], compounds: [] });
  });
});
