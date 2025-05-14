import { describe, expect, it } from "vitest";
import { LanguageModel, LanguageModelSelector, isModelMatching } from "../language-model";

describe('isModelMatching', () => {
  it('returns false with one of two parameter mismatches', () => {
    expect(
      isModelMatching(
                <LanguageModelSelector>{
                  name: 'XXX',
                  family: 'YYY',
                },
                <LanguageModel>{
                  name: 'gpt-4o',
                  family: 'YYY',
                },
      ),
    ).eql(false);
  });
  it('returns false with two parameter mismatches', () => {
    expect(
      isModelMatching(
                <LanguageModelSelector>{
                  name: 'XXX',
                  family: 'YYY',
                },
                <LanguageModel>{
                  name: 'gpt-4o',
                  family: 'ZZZ',
                },
      ),
    ).eql(false);
  });
  it('returns true with one parameter match', () => {
    expect(
      isModelMatching(
                <LanguageModelSelector>{
                  name: 'gpt-4o',
                },
                <LanguageModel>{
                  name: 'gpt-4o',
                },
      ),
    ).eql(true);
  });
  it('returns true with two parameter matches', () => {
    expect(
      isModelMatching(
                <LanguageModelSelector>{
                  name: 'gpt-4o',
                  family: 'YYY',
                },
                <LanguageModel>{
                  name: 'gpt-4o',
                  family: 'YYY',
                },
      ),
    ).eql(true);
  });
  it('returns true if there are no parameters in selector', () => {
    expect(
      isModelMatching(
                <LanguageModelSelector>{},
                <LanguageModel>{
                  name: 'gpt-4o',
                  family: 'YYY',
                },
      ),
    ).eql(true);
  });
});
