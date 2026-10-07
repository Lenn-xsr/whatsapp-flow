import { Schema, model } from 'mongoose';
import { FlowContent, SearchKey } from '../../domain/flow';

/** Document of the `flows` collection. Mirrors the domain `FlowProps`. */
export interface FlowDocument {
  _id: string;
  author: string;
  name: string;
  number: string;
  search: SearchKey[];
  content: FlowContent;
}

const FlowSchema = new Schema<FlowDocument>(
  {
    _id: { type: String, required: true },
    author: { type: String, required: true },
    name: { type: String, required: true },
    number: { type: String, required: true, index: true },
    search: [
      {
        _id: false,
        type: { type: String, required: true },
        // Not required: fallback triggers (`default`, `state`) have no keyword.
        value: { type: String, default: '' },
      },
    ],
    content: {
      nodes: [
        {
          _id: false,
          id: { type: Number, required: true },
          name: { type: String, required: true },
          x: { type: Number, required: true },
          y: { type: Number, required: true },
          extra: { type: Schema.Types.Mixed, required: true },
        },
      ],
      links: [
        {
          _id: false,
          nodes: [
            {
              _id: false,
              id: { type: Number, required: true },
              componentIndex: { type: Number, required: true },
            },
          ],
        },
      ],
    },
  },
  { collection: 'flows' },
);

export const FlowModel = model<FlowDocument>('Flow', FlowSchema);
