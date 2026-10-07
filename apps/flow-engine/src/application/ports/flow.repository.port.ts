import Flow from '../../domain/flow';

export default interface FlowRepositoryPort {
  /** Flows that answer for a business phone number. */
  getByNumber(number: string): Promise<Flow[]>;
}
