export default interface SignatureValidatorPort {
  /**
   * Tells whether `signature` (the value of an `X-Hub-Signature` header) was
   * produced for `payload` with the secret shared with the sender.
   */
  isValidSignature(payload: string, signature: string | undefined): boolean;
}
