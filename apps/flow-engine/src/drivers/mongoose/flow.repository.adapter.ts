import FlowRepositoryPort from '../../application/ports/flow.repository.port';
import Flow from '../../domain/flow';
import { FlowMapper } from './flow.mapper';
import { FlowDocument, FlowModel } from './flow.model';

export default class FlowRepositoryAdapter implements FlowRepositoryPort {
  async getByNumber(number: string): Promise<Flow[]> {
    const documents = await FlowModel.find({ number }).lean<FlowDocument[]>();
    return documents.map((document) => FlowMapper.toDomain(document));
  }
}
