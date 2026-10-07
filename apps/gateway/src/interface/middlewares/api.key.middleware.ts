import { createHash, timingSafeEqual } from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';

const BEARER_PREFIX = 'Bearer ';

const digest = (value: string): Buffer => createHash('sha256').update(value).digest();

/**
 * Builds a preHandler that only lets through requests carrying
 * `Authorization: Bearer <apiKey>`.
 */
export function apiKeyAuth(apiKey: string) {
  const expected = digest(apiKey);

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const header = request.headers.authorization;
    const provided = header?.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length) : '';

    // Hashing both sides gives equal-length buffers for a constant-time comparison.
    if (!provided || !timingSafeEqual(digest(provided), expected)) {
      await reply.status(401).send({ error: 'Unauthorized' });
    }
  };
}
