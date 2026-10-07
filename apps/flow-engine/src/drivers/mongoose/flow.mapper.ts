import Flow from '../../domain/flow';
import { FlowDocument } from './flow.model';

export class FlowMapper {
  static toDomain(document: FlowDocument): Flow {
    return Flow.create({
      id: String(document._id),
      author: document.author,
      name: document.name,
      number: document.number,
      search: (document.search ?? []).map((item) => ({
        type: item.type,
        value: item.value ?? '',
      })),
      content: {
        nodes: document.content?.nodes ?? [],
        links: document.content?.links ?? [],
      },
    });
  }
}
