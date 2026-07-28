# CargoSynq API Collections

This repository contains shared [Bruno](https://www.usebruno.com/) API collections for CargoSynq services. Requests are stored as version-controlled OpenCollection YAML files, so changes can be reviewed and shared through the normal Git workflow.

## Available collections

- `Follow Up/` — Orders and related entities
- `Shipments/` — Shipments, units, charges, warehouse receipts, and related entities
- `WMS/` — Warehouse management endpoints
- `WMS/Supplementary/` — WMS document upload, download, and extraction endpoints

The checked-in `development` environment points to the deployed development APIs.

## Prerequisites

- Bruno 3 or newer, which supports OpenCollection YAML
- Access to the CargoSynq development environment
- A valid CargoSynq Cognito bearer token

Download Bruno from the [official website](https://www.usebruno.com/downloads).

## Open the collection in Bruno

### Option 1: Clone with Git

```bash
git clone https://github.com/cargosynq/cargosynq-api.git
```

In Bruno:

1. Select **Open Collection**.
2. Choose the cloned `cargosynq-api` directory.
3. Select the `development` environment from the environment menu.

Open the repository root—not an individual module folder—so Bruno can find `opencollection.yml` and the shared environment.

### Option 2: Fetch from Git in Bruno

Use Bruno's **Fetch Collection** or Git import option with:

```text
https://github.com/cargosynq/cargosynq-api.git
```

## Configure authentication

All APIs use the shared `token` environment variable.

1. Open the `development` environment in Bruno.
2. Set `token` to a valid Cognito access token.
3. Enter only the token value. Do not add the `Bearer` prefix; requests add it through their bearer-auth configuration.

The variable is marked as secret and its value must never be committed. If Bruno offers to save a real token into a tracked file, decline or reset the value before committing.

## Configure request variables

The development environment contains reusable IDs such as:

- `orderId` and `orderUnitId`
- `shipmentId` and `shipmentUnitId`
- `receiptId`, `unitId`, and `picklistId`
- `organizationId`, `businessId`, `placeId`, and `userId`

Replace the example value `1` with IDs that exist in the development environment before running a request. Request bodies and URLs reference these variables using Bruno syntax:

```text
{{shipmentId}}
```

Service base URLs are also environment variables:

| Variable | Service |
| --- | --- |
| `followupEndpoint` | Follow Up / Orders |
| `shipmentsEndpoint` | Shipments |
| `endpoint` | WMS |
| `supplementaryEndpoint` | WMS supplementary API |

## Run a request

1. Select the `development` environment.
2. Set a valid `token`.
3. Update the IDs used by the request.
4. Review the URL and example body.
5. Select **Send**.

List requests include editable pagination parameters. Example POST and PATCH bodies are based on the corresponding `cq-backend` schemas and documentation, but they are templates—review their values before sending.

## Write operations and idempotency

Most POST, PATCH, DELETE, apply, discard, and custom workflow operations are asynchronous. A successful request normally returns a message or idempotency ID before background processing finishes.

Requests that accept `x-idempotency-key` include the header in a disabled state. To use it:

1. Set `idempotencyKey` in the environment to a new UUID.
2. Enable the `x-idempotency-key` header on the request.
3. Use a different UUID for a logically new operation.

Never reuse an idempotency key for a different payload.

## Safety

The collection calls real development services.

- GET requests are read-only.
- POST and PATCH requests change development data.
- DELETE, apply, discard, transfer, and extraction requests can have significant side effects.
- Example IDs may point to real records after you change the environment values.

Always review the selected environment, URL, identifiers, request body, and HTTP method before sending a write request.

## Repository structure

```text
cargosynq-api/
├── opencollection.yml
├── environments/
│   └── development.yml
├── Follow Up/
├── Shipments/
├── WMS/
│   └── Supplementary/
└── scripts/
```

Each module is divided into entity folders. A request file contains its method, URL, headers, authentication, example body, and short documentation.

## Updating the generated collections

The repository includes dependency-free Node.js generators:

```bash
node scripts/generate-follow-up-collection.mjs
node scripts/generate-shipments-collection.mjs
node scripts/generate-wms-collection.mjs
```

The generators overwrite their corresponding generated module requests. After running one:

1. Compare its routes with the relevant deployed API Gateway.
2. Review example bodies against current backend schemas.
3. Open the collection in Bruno and inspect representative requests.
4. Check the Git diff before committing.

`WMS/Supplementary` is maintained separately from the generated core WMS collection.

## Contributing

1. Pull the latest `main` branch.
2. Create a branch for your changes.
3. Add or update requests and environment placeholders.
4. Do not commit tokens, credentials, customer data, or working idempotency keys.
5. Validate the collection in Bruno.
6. Open a pull request describing the API routes and environment changes.

Keep request names and folders focused on business entities, use shared environment variables for URLs and IDs, and provide safe example payloads rather than real operational data.
