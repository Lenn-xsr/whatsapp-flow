import { FlowSearchType, FlowProps, FlowContent, SearchKey } from './types';
import { FALLBACK_SEARCH_TYPES, KEYWORD_MATCHERS, KeywordSearchType } from './utils/search';

/** A conversation flow: a graph of nodes plus the rules that select it. */
export default class Flow {
  private readonly props: FlowProps;

  constructor(props: FlowProps) {
    this.props = { ...props };
  }

  get id(): string {
    return this.props.id;
  }

  get author(): string {
    return this.props.author;
  }

  get name(): string {
    return this.props.name;
  }

  get number(): string {
    return this.props.number;
  }

  get search(): SearchKey[] {
    return [...this.props.search];
  }

  get content(): FlowContent {
    return { ...this.props.content };
  }

  hasSearchType(type: FlowSearchType): boolean {
    return this.props.search.some((item) => item.type === type);
  }

  /** Whether one of the keyword triggers of the flow matches the text. */
  matches(text: string): boolean {
    return this.props.search
      .filter((item) => !FALLBACK_SEARCH_TYPES.includes(item.type))
      .some((item) => {
        const matcher = KEYWORD_MATCHERS[item.type as KeywordSearchType];
        return matcher ? matcher(item.value, text) : false;
      });
  }

  static create(props: FlowProps): Flow {
    return new Flow(props);
  }
}
