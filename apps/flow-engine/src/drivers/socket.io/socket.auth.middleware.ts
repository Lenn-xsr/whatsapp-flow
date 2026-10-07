import { createHash, timingSafeEqual } from 'crypto';

const digest = (value: string): Buffer => createHash('sha256').update(value).digest();

/** The part of a socket.io socket the middleware reads. */
export interface HandshakeSocket {
  handshake: { auth: Record<string, unknown> };
}

/**
 * Builds a socket.io middleware that only accepts connections whose
 * handshake carries `auth: { token }` equal to the expected token.
 */
export function socketAuth(expectedToken: string) {
  const expected = digest(expectedToken);

  return (socket: HandshakeSocket, next: (error?: Error) => void): void => {
    const { token } = socket.handshake.auth;

    if (typeof token !== 'string' || !timingSafeEqual(digest(token), expected)) {
      next(new Error('Authentication error'));
      return;
    }

    next();
  };
}
