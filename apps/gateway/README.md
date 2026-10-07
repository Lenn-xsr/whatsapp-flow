# @whatsapp-flow/gateway

The only service that talks to Meta. It receives WhatsApp Cloud API webhooks,
verifies their signature, stores every message in MongoDB, publishes inbound
messages to RabbitMQ, and exposes an HTTP endpoint that sends messages out
through the Cloud API.

## HTTP API

| Method | Path                    | Authentication       | Purpose                                   |
| ------ | ----------------------- | -------------------- | ----------------------------------------- |
| `GET`  | `/health`               | none                 | Liveness probe, returns `{ "status": "ok" }` |
| `POST` | `/webhook`              | `X-Hub-Signature-256` | Receives notifications from Meta          |
| `POST` | `/message`              | API key              | Sends a message to a WhatsApp user        |
| `GET`  | `/messages/:author/:to` | API key              | Lists stored messages                     |

API key means the header `Authorization: Bearer <API_KEY>`.

### `POST /webhook`

The signature is an HMAC of the raw request body keyed with the Meta app
secret. `X-Hub-Signature-256` (`sha256=<hex>`) is used when present, otherwise
the legacy `X-Hub-Signature` (`sha1=<hex>`).

- `401` when the signature is missing, malformed or does not match.
- `200` for a valid notification. Every user message it contains is stored
  and published. Notifications without user messages, such as delivery
  statuses, are acknowledged and ignored.
- `500` when storing or publishing fails, so that Meta retries.

Each inbound message is published to the durable direct exchange `messages`
with routing key `message.received`, as persistent JSON:

```json
{
  "id": "665f1c2e9b1d4a0012ab34cd",
  "author": "15550002222",
  "to": "15550001111",
  "date": "2024-01-01T10:00:00.000Z",
  "message": { "from": "15550002222", "type": "text", "text": { "body": "hi" } }
}
```

`author` is the user's number, `to` is the business number
(`metadata.display_phone_number`), and `message` is the message object exactly
as Meta sent it. The gateway also declares the queue `messages.inbound` and
binds it, so nothing is lost if the flow-engine has not started yet.

### `POST /message`

```json
{
  "author": "15550001111",
  "number": "15550002222",
  "id": "<phone-number-id>",
  "token": "<meta-access-token>",
  "message": { "type": "text", "text": { "body": "Hello!" } }
}
```

| Field     | Meaning                                                        |
| --------- | -------------------------------------------------------------- |
| `author`  | Business number the message is sent from (used for storage)    |
| `number`  | Recipient                                                      |
| `id`      | Phone number ID of the sender in the Cloud API                 |
| `token`   | Meta access token allowed to send from that number             |
| `message` | Cloud API message object without `messaging_product` and `to`  |

The gateway adds `messaging_product: "whatsapp"` and `to`, calls
`POST {WHATSAPP_API_URL}/{id}/messages` with the token, and stores the message
once the API accepts it.

- `200` `{ "status": "Message sent", "id": "<stored id>" }`
- `400` when a field is missing or `message` is not an object
- `401` without a valid API key
- `502` when the Cloud API rejects the message; nothing is stored

### `GET /messages/:author/:to`

Returns up to 100 messages written by `author` to `to`, newest first, each as
`{ id, author, to, date, message }`. Inbound messages have the user as author;
outbound messages have the business number as author.

## Configuration

Copy `.env.example` to `.env`.

| Variable           | Required | Default                            | Purpose                                              |
| ------------------ | -------- | ---------------------------------- | ---------------------------------------------------- |
| `MONGODB_URI`      | yes      |                                    | MongoDB connection string                            |
| `RABBITMQ_URL`     | yes      |                                    | RabbitMQ connection string                           |
| `API_KEY`          | yes      |                                    | Key expected in `Authorization: Bearer`              |
| `META_APP_SECRET`  | yes      |                                    | App secret used to verify webhook signatures         |
| `PORT`             | no       | `3000`                             | HTTP port                                            |
| `HOST`             | no       | `0.0.0.0`                          | Interface to listen on                               |
| `CORS_ORIGIN`      | no       | `*`                                | Allowed CORS origin                                  |
| `WHATSAPP_API_URL` | no       | `https://graph.facebook.com/v23.0` | Graph API base URL including the version             |
| `ENV_SOURCE`       | no       | `dotenv`                           | `dotenv` or `gcp-secret-manager` (see `packages/shared`) |

## Running

From the repository root, with MongoDB and RabbitMQ up (`docker compose up -d`):

```bash
pnpm dev:gateway                              # watch mode
pnpm build && pnpm --filter @whatsapp-flow/gateway start
pnpm turbo run test --filter=@whatsapp-flow/gateway
```

### Docker

The image is built from the repository root, which is the build context:

```bash
docker build -f apps/gateway/Dockerfile -t whatsapp-flow-gateway .
docker run --env-file apps/gateway/.env -p 3000:3000 whatsapp-flow-gateway
```

The container has no `.env` file; configuration comes from its environment.
Inside a container `localhost` is the container itself, so the connection
strings must point at hosts reachable from it.

## Layout

```
src/
  domain/message.ts            the stored message
  application/
    ports/                     repository, broker, WhatsApp API, signature validator
    usecases/                  receive / record / list messages, send a message
  drivers/
    amqp/                      RabbitMQ publisher
    mongoose/                  message model and repository
    security/                  X-Hub signature validation
    whatsapp/                  Cloud API client
  interface/
    http/server.ts             Fastify server and routes
    controllers/               request handling
    mappers/                   webhook payload -> messages, message -> JSON
    middlewares/               API key check
  config/env.ts                typed configuration
  main.ts                      wiring
```

Limitations that affect this service, including the missing webhook
verification endpoint, are listed in the [root README](../../README.md#limitations).
