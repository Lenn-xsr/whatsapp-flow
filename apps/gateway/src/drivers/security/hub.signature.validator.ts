import { createHmac, timingSafeEqual } from 'crypto';
import SignatureValidatorPort from '../../application/ports/signature.validator.port';

const SUPPORTED_ALGORITHMS = ['sha256', 'sha1'];

/**
 * Validates the `X-Hub-Signature-256` (`sha256=<hex>`) and legacy
 * `X-Hub-Signature` (`sha1=<hex>`) headers Meta adds to webhook deliveries:
 * an HMAC of the raw request body keyed with the app secret.
 */
export default class HubSignatureValidator implements SignatureValidatorPort {
  constructor(private readonly secret: string) {}

  isValidSignature(payload: string, signature: string | undefined): boolean {
    if (!signature) return false;

    const separator = signature.indexOf('=');
    if (separator === -1) return false;

    const algorithm = signature.slice(0, separator);
    const digest = signature.slice(separator + 1);

    if (!SUPPORTED_ALGORITHMS.includes(algorithm)) return false;
    if (!/^[0-9a-f]+$/i.test(digest)) return false;

    const expected = createHmac(algorithm, this.secret).update(payload, 'utf8').digest();
    const received = Buffer.from(digest, 'hex');

    // timingSafeEqual throws on different lengths, so compare them first.
    return received.length === expected.length && timingSafeEqual(expected, received);
  }
}
