# @whatsapp-flow/flow-engine

Consumes the inbound messages the gateway publishes to RabbitMQ and answers
them by walking a conversation flow. It also runs a socket.io server so that
other services can subscribe to specific messages and handle them instead of
a flow.

It never calls Meta: history is read from, and answers are sent through, the
[gateway](../gateway/README.md).

## What happens to a message

1. **Repetition guard.** The user's recent messages are fetched from the
   gateway. If the five most recent text messages are identical, the message
   is ignored.
2. **External listeners.** If a socket.io client subscribed to this message,
   it is delivered there. When the client acknowledges within five seconds the
   message is done. Without a subscriber, or without an acknowledgement, the
   engine continues.
3. **Flow.** A flow is selected, the user's conversation advances, and the
   resulting messages are sent one at a time, in order.

The flow format, the selection rules and the state model are described in the
[root README](../../README.md#how-a-conversation-is-modeled).
[`examples/welcome-flow.json`](examples/welcome-flow.json) is a complete flow
document; a test loads it through the Mongoose schema and runs it.

Messages are consumed one at a time and acknowledged to RabbitMQ after they
were handled. Message types the engine does not understand are acknowledged
and skipped. A message whose handling throws is rejected without requeue.

## socket.io protocol

Clients connect with `auth: { token: <SOCKET_AUTH_TOKEN> }`. All frames use
the `message` event. The [SDK](../../packages/sdk/README.md) implements this
protocol.

| Direction        | Frame                                                                  | Meaning |
| ---------------- | ---------------------------------------------------------------------- | ------- |
| client to server | `{ "type": "listen_to_message", "payload": { "type", "number", "content" } }` | Subscribe to inbound messages of that `type` (`text`, `interactive` or `button`) received by the business `number`, whose content starts with `content` (case-insensitive). |
| server to client | `{ "id", "author", "to", "content", "identifier" }`                    | A matching message. `content` is the raw Cloud API message object, `identifier` the subscription that matched. |
| client to server | `{ "type": "message_received", "payload": { "id" } }`                  | The message was handled; no flow should answer it. |

What "content" means depends on the message type: the lower-cased body of a
text message, the id of the selected button or list row of an interactive
reply, or the text of a template quick-reply button.

Subscriptions are kept in memory and dropped when the socket disconnects.

## Configuration

Copy `.env.example` to `.env`.

| Variable                   | Required | Default | Purpose                                                    |
| -------------------------- | -------- | ------- | ---------------------------------------------------------- |
| `MONGODB_URI`              | yes      |         | MongoDB connection string (collections `flows`, `flow_states`) |
| `RABBITMQ_URL`             | yes      |         | RabbitMQ connection string                                 |
| `SOCKET_AUTH_TOKEN`        | yes      |         | Token socket.io clients must present                       |
| `GATEWAY_URL`              | yes      |         | Base URL of the gateway                                    |
| `GATEWAY_API_KEY`          | yes      |         | The gateway's `API_KEY`                                    |
| `WHATSAPP_SENDER_NUMBER`   | yes      |         | Business number the flows answer from, digits only         |
| `WHATSAPP_PHONE_NUMBER_ID` | yes      |         | Phone number ID of that number in the Cloud API            |
| `WHATSAPP_ACCESS_TOKEN`    | yes      |         | Meta access token allowed to send from that number         |
| `SOCKET_PORT`              | no       | `3001`  | Port of the socket.io server                               |
| `CORS_ORIGIN`              | no       | `*`     | Allowed origin for socket.io                               |
| `MEDIA_BASE_URL`           | no       |         | Media of a flow resolves to `<MEDIA_BASE_URL>/<flow id>/<media id>`. Required only by flows that send audio, video or images. |
| `TEMPLATE_LANGUAGE`        | no       | `en_US` | Language code sent with template messages                  |
| `ENV_SOURCE`               | no       | `dotenv` | `dotenv` or `gcp-secret-manager` (see `packages/shared`)  |

## Running

From the repository root, with MongoDB, RabbitMQ and the gateway up:

```bash
pnpm dev:flow-engine                          # watch mode
pnpm build && pnpm --filter @whatsapp-flow/flow-engine start
pnpm turbo run test --filter=@whatsapp-flow/flow-engine
```

### Docker

The image is built from the repository root, which is the build context:

```bash
docker build -f apps/flow-engine/Dockerfile -t whatsapp-flow-engine .
docker run --env-file apps/flow-engine/.env -p 3001:3001 whatsapp-flow-engine
```

The container has no `.env` file; configuration comes from its environment.
Inside a container `localhost` is the container itself, so the connection
strings must point at hosts reachable from it.

## Layout

```
src/
  domain/
    flow/                      the flow graph
      flow.model.ts            flow entity and keyword triggers
      flow.service.ts          turns nodes into stages, replays state
      flow-navigation.service.ts   which node follows which
      processors/              text, interaction and delay nodes
      utils/                   triggers, ${variable} substitution, media URLs
    message/                   inbound message
    state.ts                   conversation state
  application/
    ports/                     repositories, history, listeners, sender
    services/                  flow selection, conversation progress
    usecases/                  handle an inbound message, dispatch, run a flow
  drivers/
    amqp/                      RabbitMQ consumer
    gateway/                   history client, sender (through the SDK)
    mongoose/                  flow and state models and repositories
    socket.io/                 server, protocol, subscription registry
  config/env.ts                typed configuration
  main.ts                      wiring
```

Limitations that affect this service are listed in the
[root README](../../README.md#limitations).
