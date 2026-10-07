import { DispatchMessageUseCase } from '../../src/application/usecases/dispatch-message.usecase';
import { FakeMessageListeners } from '../support/fakes';
import { BUSINESS } from '../support/flows';
import { buttonReply, listReply, templateButton, text } from '../support/messages';

describe('DispatchMessageUseCase', () => {
  let listeners: FakeMessageListeners;
  let dispatch: DispatchMessageUseCase;

  beforeEach(() => {
    listeners = new FakeMessageListeners();
    dispatch = new DispatchMessageUseCase(listeners);
  });

  it('offers a text message by its lower-cased body and the number it was sent to', async () => {
    const message = text('HELP me');

    await dispatch.execute(message);

    expect(listeners.offered).toEqual([
      { identifier: { type: 'text', number: BUSINESS, content: 'help me' }, message },
    ]);
  });

  it('offers a button or list reply by the id of the selected option', async () => {
    await dispatch.execute(buttonReply('Yes', 'confirm-yes'));
    await dispatch.execute(listReply('Support', 'row-support'));

    expect(listeners.offered.map(({ identifier }) => identifier)).toEqual([
      { type: 'interactive', number: BUSINESS, content: 'confirm-yes' },
      { type: 'interactive', number: BUSINESS, content: 'row-support' },
    ]);
  });

  it('offers a template quick reply by its text', async () => {
    await dispatch.execute(templateButton('Stop promotions'));

    expect(listeners.offered[0]?.identifier).toEqual({
      type: 'button',
      number: BUSINESS,
      content: 'Stop promotions',
    });
  });

  it('reports whether a listener took the message', async () => {
    listeners.subscriptions = ['help'];

    expect(await dispatch.execute(text('help'))).toBe(true);
    expect(await dispatch.execute(text('something else'))).toBe(false);
  });

  it('does not bother the listeners with a message that has no content', async () => {
    expect(await dispatch.execute(text(''))).toBe(false);
    expect(listeners.offered).toHaveLength(0);
  });
});
