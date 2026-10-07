# @whatsapp-flow/shared

Code used by both the gateway and the flow-engine. It is an internal
workspace package and is not published.

## What is in it

- **RabbitMQ contract** (`broker.ts`): the exchange, routing key and queue
  names both services declare, and the `InboundMessageEvent` type of the
  messages exchanged.
- **Environment loading** (`env.ts`): `loadEnvironment()` fills `process.env`
  before a service reads its configuration, plus the helpers `requireEnv`,
  `optionalEnv` and `portEnv`.
- **Logger** (`logger.ts`): `createLogger(scope)` returns a console logger that
  prefixes each line with its scope.

## Environment sources

`ENV_SOURCE` selects where variables come from:

| Value                | Behavior                                                                 |
| -------------------- | ------------------------------------------------------------------------ |
| `dotenv` (default)   | Loads the `.env` file of the current working directory, if there is one. |
| `gcp-secret-manager` | Reads every secret of the Google Cloud project named by `GOOGLE_CLOUD_PROJECT`. The secret id, upper-cased, becomes the variable name and the latest version its value. |

With `gcp-secret-manager`, `ENV_SOURCE` and `GOOGLE_CLOUD_PROJECT` must be set
in the real environment, and credentials are resolved by the Google client
library (Application Default Credentials). This loader is tested against a
fake client only.

## Commands

```bash
pnpm --filter @whatsapp-flow/shared build
pnpm --filter @whatsapp-flow/shared test
```
