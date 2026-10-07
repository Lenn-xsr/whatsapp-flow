import { SearchKey, getFallbackSearchType } from '../../src/domain/flow';
import { flow, textNode } from '../support/flows';

const flowWith = (...search: SearchKey[]) => flow([textNode(0, 'hi')], [], { search });

describe('Flow triggers', () => {
  describe('equals', () => {
    const subject = flowWith({ type: 'equals', value: 'menu' });

    it('matches when the user sent exactly the keyword', () => {
      expect(subject.matches('menu')).toBe(true);
    });

    it.each(['menu please', 'the menu', 'men', 'Menu', ''])('does not match "%s"', (text) => {
      expect(subject.matches(text)).toBe(false);
    });
  });

  describe('contains', () => {
    const subject = flowWith({ type: 'contains', value: 'price' });

    it.each(['price', 'what is the price?', 'pricelist'])('matches "%s"', (text) => {
      expect(subject.matches(text)).toBe(true);
    });

    it('does not match a message that is only part of the keyword', () => {
      expect(subject.matches('pri')).toBe(false);
    });

    it('does not match an empty message', () => {
      expect(subject.matches('')).toBe(false);
    });
  });

  describe('startsWith', () => {
    const subject = flowWith({ type: 'startsWith', value: 'order' });

    it.each(['order', 'order 1234'])('matches "%s"', (text) => {
      expect(subject.matches(text)).toBe(true);
    });

    it.each(['my order', 'ord', ''])('does not match "%s"', (text) => {
      expect(subject.matches(text)).toBe(false);
    });
  });

  it('matches when any of several keywords matches', () => {
    const subject = flowWith({ type: 'equals', value: 'hi' }, { type: 'equals', value: 'hello' });

    expect(subject.matches('hello')).toBe(true);
    expect(subject.matches('hey')).toBe(false);
  });

  it('never matches text through the fallback triggers', () => {
    const subject = flowWith({ type: 'default', value: '' }, { type: 'state', value: '' });

    expect(subject.matches('')).toBe(false);
    expect(subject.matches('default')).toBe(false);
    expect(subject.matches('state')).toBe(false);
  });

  it('reports which trigger types it has', () => {
    const subject = flowWith({ type: 'default', value: '' }, { type: 'equals', value: 'menu' });

    expect(subject.hasSearchType('default')).toBe(true);
    expect(subject.hasSearchType('equals')).toBe(true);
    expect(subject.hasSearchType('state')).toBe(false);
  });
});

describe('getFallbackSearchType', () => {
  it('uses the default flow for the first message of a user', () => {
    expect(getFallbackSearchType(true)).toBe('default');
  });

  it('uses the state flow for later messages', () => {
    expect(getFallbackSearchType(false)).toBe('state');
  });
});
