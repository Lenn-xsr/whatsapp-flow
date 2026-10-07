import { Schema, model } from 'mongoose';
import { StateStep } from '../../domain/state';

/** Document of the `flow_states` collection: one conversation in progress. */
export interface StateDocument {
  _id: string;
  flowId: string;
  number: string;
  steps: StateStep[];
  createdAt?: Date;
  updatedAt?: Date;
}

const StateSchema = new Schema<StateDocument>(
  {
    _id: { type: String, required: true },
    flowId: { type: String, required: true },
    number: { type: String, required: true },
    steps: [
      {
        _id: false,
        next: { type: String, required: true },
        // Empty for transitions the engine took without user input.
        response: { type: String, default: '' },
      },
    ],
  },
  {
    collection: 'flow_states',
    timestamps: true,
  },
);

StateSchema.index({ number: 1, flowId: 1 });

export const StateModel = model<StateDocument>('FlowState', StateSchema);
