# @whatsapp-flow/sdk

TypeScript client for the two services in this repository.

It is **not** a client for Meta's WhatsApp Cloud API. It talks to:

- the [gateway](../../apps/gateway/README.md) over HTTP, to send messages
  (`POST /message`) and check that it is up (`GET /health`);
- the [flow-engine](../../apps/flow-engine/README.md) over socket.io, to
  receive inbound messages your service wants to handle itself.

The gateway is the component that calls Meta. The SDK adds builder classes
that produce Cloud API message objects, which the gateway forwards as they
are.

The package is private to this workspace (`"private": true`) and is consumed
through `workspace:*`; it is not published to npm.

## Usage

```typescript
import { WhatsappClient, TextMessage } from '@whatsapp-flow/sdk';

const client = new WhatsappClient({
  sender: {
    name: 'support',
    number: '15550001111',            // business number, digits only
    numberID: '<phone-number-id>',    // its phone number ID in the Cloud API
    token: '<meta-access-token>',     // token allowed to send from it
    default: true,
  },
  rest: {
    url: 'http://localhost:3000',     // gateway
    token: '<gateway API_KEY>',
  },
  ws: {
    url: 'http://localhost:3001',     // flow-engine socket.io server
    token: '<flow-engine SOCKET_AUTH_TOKEN>',
  },
});

await client.initialize();

await client.messages.send('15550002222', {
  message: new TextMessage().setBody('Your order has shipped.'),
});
```

`initialize()` calls `GET /health` on the gateway and, when `ws` is
configured, connects to the flow-engine. `ws` is optional: without it the
client can only send, and `initialize()` is not required before
`messages.send()`.

The sender's `numberID` and `token` are sent to the gateway with every
message, because the gateway does not store Meta credentials.

### Several senders

```typescript
const client = new WhatsappClient({
  sender: [
    { name: 'support', number: '15550001111', numberID: '...', token: '...', default: true },
    { name: 'sales', number: '15550003333', numberID: '...', token: '...', default: false },
  ],
  rest: { url: 'http://localhost:3000', token: '<gateway API_KEY>' },
});

await client.messages.send('15550002222', { message, from: 'sales' });        // by name
await client.messages.send('15550002222', { message, from: '15550003333' });  // by number
await client.messages.send('15550002222', { message });                       // default sender
```

An unknown `from` falls back to the default sender.

### Receiving messages

```typescript
client.onMessage({ type: 'text', number: '15550001111', content: 'agent' }, async (message) => {
  console.log(`${message.author} wrote`, message.content);
  await message.reply(new TextMessage().setBody('An agent will be with you shortly.'));
});
```

The identifier says which inbound messages to receive:

| Field     | Meaning                                                                    |
| --------- | -------------------------------------------------------------------------- |
| `type`    | `text`, `interactive` (button or list reply) or `button` (template quick reply) |
| `number`  | Business number that received the message                                  |
| `content` | Prefix, compared case-insensitively with the text body, the id of the selected button or list row, or the template button text |

While a listener is registered, matching messages are delivered to it and
acknowledged, and the flow-engine does not run a flow for them. `message.reply`
sends from the number the user wrote to. Listeners are registered again
automatically after a reconnection. `message.content` is the raw Cloud API
message object.

## Message builders

Every builder serializes to `{ type, [type]: { ... } }`.

```typescript
import {
  TextMessage,
  ImageMessage,
  VideoMessage,
  AudioMessage,
  DocumentMessage,
  ButtonMessage,
  Button,
  SelectMenuMessage,
  InteractionMessageList,
  TemplateMessage,
  TemplateMessageComponent,
  TemplateParameterText,
} from '@whatsapp-flow/sdk';

new TextMessage().setBody('Hello');

new ImageMessage().setLink('https://example.com/photo.jpg').setCaption('Our storefront');
new VideoMessage().setLink('https://example.com/clip.mp4').setCaption('Demo');
new AudioMessage().setLink('https://example.com/note.mp3');
new DocumentMessage().setLink('https://example.com/invoice.pdf').setFilename('invoice.pdf');

new ButtonMessage({ text: 'Do you confirm?', button: [new Button('Yes', 'yes'), new Button('No', 'no')] })
  .setHeader('text', 'Order #1234')
  .setFooter('Reply within 24 hours');

new SelectMenuMessage({
  text: 'How can we help?',
  placeholder: 'Choose',
  list: new InteractionMessageList('Departments')
    .addRow('sales', 'Sales', 'Talk to the sales team')
    .addRow('support', 'Support'),
});

new TemplateMessage({ name: 'order_update', language: 'en_US' }).setComponents([
  new TemplateMessageComponent('body', [new TemplateParameterText('#1234')]),
]);
```

Media is referenced by public URL. The setters of the text and media builders
validate their input (URLs, empty values, the 4096 character text limit) and
throw `ValidationError`; values passed to a constructor are not validated. The builders do not check Meta's
other limits, such as the number of buttons or the length of their titles.

## Errors

All errors extend `WhatsAppSDKError` and carry a `code`.

| Class                         | When                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `ValidationError`             | Invalid configuration, phone number or builder input        |
| `SenderNotFoundError`         | No sender matches `from` and none is marked as default      |
| `APIError`                    | The gateway answered with an error; has `statusCode` and `response` |
| `ConnectionError`             | The socket is not connected or the connection was refused   |
| `InitializationError`         | `initialize()` failed; wraps the original error             |
| `UnsupportedMessageTypeError` | An option is not valid for the attachment type              |

## Logging

The SDK logs to the console at `info` level by default.

```typescript
import { setLogLevel, setLogger, LogLevel, SilentLogger } from '@whatsapp-flow/sdk';

setLogLevel(LogLevel.DEBUG);
setLogger(new SilentLogger());            // or any object with debug/info/warn/error
```

## Configuration

The SDK reads no environment variables. Everything is passed to the
`WhatsappClient` constructor.

## Commands

```bash
pnpm --filter @whatsapp-flow/sdk build
pnpm --filter @whatsapp-flow/sdk test
```
