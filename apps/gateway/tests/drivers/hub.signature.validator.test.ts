import { createHmac } from 'crypto';
import HubSignatureValidator from '../../src/drivers/security/hub.signature.validator';

const SECRET = 'app-secret';
const payload = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });

const sign = (algorithm: 'sha1' | 'sha256', body: string, secret = SECRET): string =>
  `${algorithm}=${createHmac(algorithm, secret).update(body).digest('hex')}`;

describe('HubSignatureValidator', () => {
  const validator = new HubSignatureValidator(SECRET);

  it('accepts a SHA-256 signature of the payload', () => {
    expect(validator.isValidSignature(payload, sign('sha256', payload))).toBe(true);
  });

  it('accepts a legacy SHA-1 signature of the payload', () => {
    expect(validator.isValidSignature(payload, sign('sha1', payload))).toBe(true);
  });

  it('accepts an upper-case hex digest', () => {
    const signature = sign('sha256', payload);
    const upperCased = `sha256=${signature.slice('sha256='.length).toUpperCase()}`;

    expect(validator.isValidSignature(payload, upperCased)).toBe(true);
  });

  it('rejects a signature made with another secret', () => {
    expect(validator.isValidSignature(payload, sign('sha256', payload, 'other-secret'))).toBe(
      false,
    );
  });

  it('rejects a signature made for another payload', () => {
    const tampered = payload.replace('whatsapp_business_account', 'page');

    expect(validator.isValidSignature(tampered, sign('sha256', payload))).toBe(false);
  });

  it.each([
    ['a missing signature', undefined],
    ['an empty signature', ''],
    ['a signature without algorithm', 'deadbeef'],
    ['an unsupported algorithm', 'md5=d41d8cd98f00b204e9800998ecf8427e'],
    ['a truncated digest', 'sha256=abc123'],
    ['a digest that is not hex', `sha256=${'z'.repeat(64)}`],
    ['an empty digest', 'sha256='],
  ])('rejects %s without throwing', (_case, signature) => {
    expect(validator.isValidSignature(payload, signature)).toBe(false);
  });

  it('signs multi-byte characters by their UTF-8 bytes', () => {
    const body = JSON.stringify({ text: 'naïve café, 日本語' });

    expect(validator.isValidSignature(body, sign('sha256', body))).toBe(true);
  });
});
