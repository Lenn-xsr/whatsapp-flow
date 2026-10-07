import { FlowSearchType } from '../types';

export type KeywordSearchType = Exclude<FlowSearchType, 'state' | 'default'>;

/** Search types that are fallbacks rather than keyword triggers. */
export const FALLBACK_SEARCH_TYPES: ReadonlyArray<FlowSearchType> = ['state', 'default'];

/** Keyword triggers: does the text the user sent match the configured keyword? */
export const KEYWORD_MATCHERS: Record<
  KeywordSearchType,
  (keyword: string, text: string) => boolean
> = {
  equals: (keyword, text) => text === keyword,
  contains: (keyword, text) => text.includes(keyword),
  startsWith: (keyword, text) => text.startsWith(keyword),
};

/** Fallback used when no keyword matches and no conversation is in progress. */
export function getFallbackSearchType(isFirstMessage: boolean): FlowSearchType {
  return isFirstMessage ? 'default' : 'state';
}
