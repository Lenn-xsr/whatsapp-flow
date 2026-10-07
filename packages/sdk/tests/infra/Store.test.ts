import { Store } from '../../src/infra/Store';
import { MessageIdentifier, WebsocketMessage } from '../../src/types';

const identifier: MessageIdentifier = { type: 'text', number: '15550001111', content: 'help' };

const messageFor = (matched: MessageIdentifier): WebsocketMessage => ({
  id: 'message-1',
  author: '15550002222',
  to: '15550001111',
  content: { type: 'text', text: { body: 'help me please' } },
  identifier: matched,
});

describe('Store', () => {
  it('runs the callback registered for the identifier carried by the message', () => {
    const store = new Store();
    const callback = jest.fn();
    store.addState(identifier, callback);

    const message = messageFor(identifier);

    expect(store.executeState(message)).toBe(true);
    expect(callback).toHaveBeenCalledWith(message);
  });

  it('matches identifiers regardless of property order and content casing', () => {
    const store = new Store();
    const callback = jest.fn();
    store.addState(identifier, callback);

    const sameIdentifier = { content: 'HELP', number: '15550001111', type: 'text' as const };

    expect(store.executeState(messageFor(sameIdentifier))).toBe(true);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('reports when no callback is registered for the identifier', () => {
    const store = new Store();
    store.addState(identifier, jest.fn());

    const other = { ...identifier, number: '15550009999' };

    expect(store.executeState(messageFor(other))).toBe(false);
  });

  it('replaces the callback when the same identifier is registered twice', () => {
    const store = new Store();
    const first = jest.fn();
    const second = jest.fn();
    store.addState(identifier, first);
    store.addState(identifier, second);

    store.executeState(messageFor(identifier));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(store.identifiers()).toEqual([identifier]);
  });
});
