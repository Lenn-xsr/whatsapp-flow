import { VariableParser } from '../../src/domain/flow';

describe('VariableParser', () => {
  const parser = new VariableParser();

  it('replaces a placeholder with its variable', () => {
    expect(parser.parseVars('Hello ${name}!', { name: 'Ana' })).toBe('Hello Ana!');
  });

  it('replaces every occurrence of every placeholder', () => {
    const content = '${greeting} ${name}. Yes, ${name}, ${greeting}!';

    expect(parser.parseVars(content, { greeting: 'Hi', name: 'Ana' })).toBe(
      'Hi Ana. Yes, Ana, Hi!',
    );
  });

  it('replaces a placeholder without variable with nothing', () => {
    expect(parser.parseVars('Order ${order} is ready', { name: 'Ana' })).toBe('Order  is ready');
  });

  it('leaves the content untouched when there are no variables at all', () => {
    expect(parser.parseVars('Hello ${name}!')).toBe('Hello ${name}!');
  });

  it('leaves text without placeholders unchanged', () => {
    expect(parser.parseVars('It costs $5 {roughly}', { name: 'Ana' })).toBe(
      'It costs $5 {roughly}',
    );
  });

  it('inserts values literally, even when they look like replacement patterns', () => {
    expect(parser.parseVars('Total: ${total}', { total: '$& $1 $$' })).toBe('Total: $& $1 $$');
  });

  it('does not expand placeholders that come from a variable value', () => {
    expect(parser.parseVars('${a}', { a: '${b}', b: 'nested' })).toBe('${b}');
  });
});
