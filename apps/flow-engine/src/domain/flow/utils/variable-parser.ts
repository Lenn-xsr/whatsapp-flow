const PLACEHOLDER = /\$\{(.*?)\}/g;

export class VariableParser {
  /**
   * Replaces `${name}` placeholders with the matching variable. Placeholders
   * without a variable become an empty string. When no variables are given
   * the content is returned untouched.
   */
  parseVars(content: string, vars?: Record<string, string>): string {
    if (!vars) return content;

    return content.replace(PLACEHOLDER, (_placeholder, name: string) => vars[name] ?? '');
  }
}
