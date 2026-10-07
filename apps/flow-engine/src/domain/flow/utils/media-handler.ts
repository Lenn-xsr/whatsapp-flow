import { MediaOutput, MediaType } from '../types';

/**
 * Resolves the media referenced by a flow. Text nodes store a media id; the
 * file is expected at `<mediaBaseUrl>/<flowId>/<mediaId>`, publicly readable
 * so Meta can download it.
 */
export class MediaHandler {
  constructor(
    private readonly flowId: string,
    private readonly mediaBaseUrl?: string,
  ) {}

  handleMedia(mediaType: MediaType, mediaId: string): MediaOutput {
    if (!this.mediaBaseUrl) {
      throw new Error(
        `Flow ${this.flowId} sends ${mediaType} "${mediaId}" but no media base URL is configured`,
      );
    }

    const base = this.mediaBaseUrl.replace(/\/+$/, '');

    return {
      kind: 'media',
      mediaType,
      url: `${base}/${encodeURIComponent(this.flowId)}/${encodeURIComponent(mediaId)}`,
    };
  }
}
