import mongoose from 'mongoose';
import StateRepositoryPort from '../../application/ports/state.repository.port';
import State, { StateStep } from '../../domain/state';
import { StateDocument, StateModel } from './state.model';

const toDomain = (document: StateDocument): State =>
  State.create({
    id: String(document._id),
    flowId: document.flowId,
    number: document.number,
    steps: (document.steps ?? []).map((step) => ({
      next: step.next,
      response: step.response ?? '',
    })),
  });

export default class StateRepositoryAdapter implements StateRepositoryPort {
  async findLatestState(number: string, flowIds: string[]): Promise<State | null> {
    const document = await StateModel.findOne({ number, flowId: { $in: flowIds } })
      .sort({ createdAt: -1 })
      .lean<StateDocument>();

    return document ? toDomain(document) : null;
  }

  async getOrCreateState(number: string, flowId: string): Promise<[State, boolean]> {
    const existing = await StateModel.findOne({ number, flowId }).lean<StateDocument>();
    if (existing) {
      return [toDomain(existing), false];
    }

    const created = await StateModel.create({
      _id: new mongoose.Types.ObjectId().toString(),
      number,
      flowId,
      steps: [],
    });

    return [toDomain(created.toObject()), true];
  }

  async pushStep(id: string, step: StateStep): Promise<void> {
    const result = await StateModel.updateOne({ _id: id }, { $push: { steps: step } });

    if (result.matchedCount === 0) {
      throw new Error('State not found');
    }
  }

  async deleteById(id: string): Promise<void> {
    await StateModel.deleteOne({ _id: id });
  }
}
