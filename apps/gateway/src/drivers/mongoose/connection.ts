import mongoose from 'mongoose';
import { createLogger } from '@whatsapp-flow/shared';

const logger = createLogger('mongodb');

export const connectMongoDB = async (uri: string): Promise<void> => {
  try {
    await mongoose.connect(uri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Error connecting to MongoDB', error);
    throw error;
  }
};
