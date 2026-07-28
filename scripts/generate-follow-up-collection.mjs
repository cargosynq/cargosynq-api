import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "Follow Up");

const entities = [
  {
    name: "Orders",
    entity: "orders",
    idVar: "orderId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      ponumber: "PO-2026-001",
      readinessstatus: "PENDING",
      followupstatus: "INITIAL_NOT_SENT",
      expectedreadiness: "2026-12-01",
      isdg: false,
    },
    patch: { followupstatus: "COMPLETED", actualreadiness: "2026-11-30" },
  },
  {
    name: "Line Items",
    entity: "lineitems",
    idVar: "lineItemId",
    methods: ["post", "patch", "delete"],
    post: {
      ordersid: "{{orderId}}",
      description: "Widget A",
      quantity: 100,
      unitofmeasurement: "pcs",
      unitcost: 25.5,
      currency: "USD",
      hscode: "8471.30",
      countryoforigin: "CHN",
    },
    patch: { quantity: 150, unitcost: 24 },
  },
  {
    name: "Needs Attention",
    entity: "orders_needsattentions",
    idVar: "orderNeedsAttentionId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      ordersid: "{{orderId}}",
      organizationsid: "{{organizationId}}",
      reason: "Missing documentation",
      status: "created",
      code: "MISSING_DOCS",
    },
    patch: { status: "completed" },
  },
  {
    name: "Access",
    entity: "orders_access",
    idVar: "orderAccessId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      ordersid: "{{orderId}}",
      organizationsid: "{{organizationId}}",
      sharedbyorganizationsid: "{{organizationId}}",
      sharedby: "{{userId}}",
      accesstype: "VIEWER",
    },
    patch: { accesstype: "EDITOR" },
  },
  {
    name: "Activities",
    entity: "orders_activities",
    idVar: "orderActivityId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      ordersid: "{{orderId}}",
      entitytype: "orders",
      entityid: "{{orderId}}",
      actiontype: "UPDATE",
      changes: { followupstatus: "COMPLETED" },
      summary: "Updated follow-up status to completed",
    },
    patch: { summary: "Updated activity summary" },
  },
  {
    name: "References",
    entity: "orders_references",
    idVar: "orderReferenceId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      ordersid: "{{orderId}}",
      text: "REF-12345",
      type: "CUSTOMER_REFERENCE",
    },
    patch: { text: "REF-UPDATED" },
  },
  {
    name: "Documents",
    entity: "orders_documents",
    idVar: "orderDocumentId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      ordersid: "{{orderId}}",
      originalfilename: "invoice.pdf",
      storagebucket: "cargosynq-documents",
      storagekey: "orders/{{orderId}}/invoice.pdf",
      storageurl: "https://example.invalid/orders/invoice.pdf",
      size: 245678,
      mimetype: "application/pdf",
      md5hash: "5d41402abc4b2a76b9719d911017c592",
      isdeleted: false,
      documenttype: "INVOICE",
    },
    patch: { documenttype: "COMMERCIAL_INVOICE", isdeleted: false },
  },
  {
    name: "Remarks",
    entity: "orders_remarks",
    idVar: "orderRemarkId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      ordersid: "{{orderId}}",
      text: "Customer requested expedited shipping",
    },
    patch: { text: "Updated order remark" },
  },
  {
    name: "Remark Mentions",
    entity: "orders_remarks_mentions",
    idVar: "orderRemarkMentionId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      remarksid: "{{orderRemarkId}}",
      mentioneduserid: "{{userId}}",
      mentionedposition: 0,
    },
    patch: { mentionedposition: 1 },
  },
  {
    name: "Actions",
    entity: "orders_actions",
    idVar: "orderActionId",
    methods: ["list", "get", "post", "patch", "delete", "apply", "discard"],
    post: {
      organizationsid: "{{organizationId}}",
      ordersid: "{{orderId}}",
      entitytype: "orders",
      entityid: "{{orderId}}",
      actiontype: "patch",
      title: "Update order status",
      summary: "Mark the order as completed",
      proposedchanges: { followupstatus: "COMPLETED" },
      currentstate: { followupstatus: "ACTIVE" },
      status: "CREATED",
    },
    patch: { title: "Updated action title", proposedchanges: { followupstatus: "COMPLETED" } },
  },
  {
    name: "Features",
    entity: "orders_features",
    idVar: "orderFeatureId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      ordersid: "{{orderId}}",
      organizationsid: "{{organizationId}}",
      featuretype: "AUTO_FOLLOWUP",
      enabled: true,
      configuration: { cadenceDays: 3 },
    },
    patch: { enabled: false },
  },
  {
    name: "Branches",
    entity: "orders_branches",
    idVar: "orderBranchId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: { ordersid: "{{orderId}}", branchesid: "{{branchId}}" },
    patch: { branchesid: "{{branchId}}" },
  },
  {
    name: "Businesses",
    entity: "orders_businesses",
    idVar: "orderBusinessId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      ordersid: "{{orderId}}",
      businessesid: "{{businessId}}",
      type: "SUPPLIER",
    },
    patch: { type: "FOLLOWUP_BY" },
  },
  {
    name: "Units",
    entity: "orders_units",
    idVar: "orderUnitId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      ordersid: "{{orderId}}",
      unitnumber: "PKG-001",
      description: "Pallet 1",
      weight: 500,
      weightunit: "kg",
      length: 120,
      width: 80,
      height: 100,
      dimensionunit: "cm",
      packagetype: "PALLET",
      trackingcode: "TRACK123",
      isdg: false,
    },
    patch: { status: "READY", weight: 520 },
  },
];

const actionNames = {
  list: "List",
  get: "Get",
  post: "Create",
  patch: "Update",
  delete: "Delete",
  apply: "Apply",
  discard: "Discard",
};

function interpolateJson(value) {
  return JSON.stringify(value, null, 2)
    .replace(/"(\{\{[^"]+\}\})"/g, "$1")
    .split("\n")
    .map((line) => `      ${line}`)
    .join("\n");
}

function requestYaml(entity, action, sequence) {
  const method = {
    list: "GET",
    get: "GET",
    post: "POST",
    patch: "PATCH",
    delete: "DELETE",
    apply: "POST",
    discard: "POST",
  }[action];
  const suffix = action === "list" || action === "post"
    ? ""
    : `/{{${entity.idVar}}}${action === "apply" || action === "discard" ? `/${action}` : ""}`;
  const hasBody = action === "post" || action === "patch" || action === "apply";
  const body = action === "post"
    ? entity.post
    : action === "patch"
      ? entity.patch ?? { status: "UPDATED" }
      : { applyStrategy: "merge" };

  const params = action === "list"
    ? `  params:
    - name: limit
      value: "25"
      type: query
    - name: offset
      value: "0"
      type: query
`
    : "";
  const headers = hasBody
    ? `  headers:
    - name: Content-Type
      value: application/json
    - name: x-idempotency-key
      value: "{{idempotencyKey}}"
      disabled: true
`
    : "";
  const bodyYaml = hasBody
    ? `  body:
    type: json
    data: |-
${interpolateJson(body)}
`
    : "";

  return `info:
  name: ${actionNames[action]} ${entity.name}
  type: http
  seq: ${sequence}

http:
  method: ${method}
  url: "{{followupendpoint}}/${entity.entity}${suffix}"
${params}${headers}${bodyYaml}  auth:
    type: bearer
    token: "{{token}}"

settings:
  encodeUrl: true
  timeout: 0
  followRedirects: true
  maxRedirects: 5

docs: |-
  ${method} /${entity.entity}${action === "list" || action === "post" ? "" : "/{id}"}${action === "apply" || action === "discard" ? `/${action}` : ""}
  Defined by the cq-backend Follow Up/Orders module.
`;
}

await mkdir(root, { recursive: true });
await writeFile(
  path.join(root, "folder.yml"),
  "info:\n  name: Follow Up\n  type: folder\n  seq: 2\n",
);

let routeCount = 0;
for (const [entityIndex, entity] of entities.entries()) {
  const directory = path.join(root, entity.name);
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, "folder.yml"),
    `info:\n  name: ${entity.name}\n  type: folder\n  seq: ${entityIndex + 1}\n`,
  );
  for (const [methodIndex, method] of entity.methods.entries()) {
    const sequence = methodIndex + 1;
    const fileName = `${String(sequence).padStart(2, "0")} ${actionNames[method]}.yml`;
    await writeFile(path.join(directory, fileName), requestYaml(entity, method, sequence));
    routeCount += 1;
  }
}

console.log(`Generated ${routeCount} Follow Up requests across ${entities.length} entity folders.`);
