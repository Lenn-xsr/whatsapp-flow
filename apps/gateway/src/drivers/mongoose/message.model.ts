import { InferSchemaType, Schema, model } from 'mongoose';

const MessageSchema = new Schema({
  _id: { type: String, required: true },
  author: { type: String, required: true },
  to: { type: String, required: true },
  date: { type: Date, required: true },
  message: { type: Schema.Types.Mixed, required: true },
});

// Serves "latest messages from author to recipient".
MessageSchema.index({ author: 1, to: 1, date: -1 });

export type MessageModelType = InferSchemaType<typeof MessageSchema>;

export const MessageModel = model('Message', MessageSchema);
