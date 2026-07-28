import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "WMS");

const entities = [
  {
    name: "Positions",
    entity: "wms_positions",
    idVar: "positionId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      placesid: "{{placeId}}",
      code: "A-03-02",
      description: "Aisle A, Rack 3, Shelf 2",
      positiontype: "STORAGE",
      isactive: true,
    },
    patch: { description: "Updated position description", isactive: true },
  },
  {
    name: "Receipts",
    entity: "wms_receipts",
    idVar: "receiptId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      placesid: "{{placeId}}",
      vehicleplate: "AB-123-CD",
      drivername: "John Driver",
      carrier: "Example Carrier",
      notes: "3 pallets, 12 boxes",
    },
    patch: { status: "PROCESSING", notes: "Receipt is being processed" },
  },
  {
    name: "Receipt Access",
    entity: "wms_receipts_access",
    idVar: "receiptAccessId",
    methods: ["list", "post", "delete"],
    post: {
      wmsreceiptsid: "{{receiptId}}",
      organizationsid: "{{organizationId}}",
      sharedbyorganizationsid: "{{organizationId}}",
      sharedby: "{{userId}}",
      accesstype: "READ_WRITE",
    },
  },
  {
    name: "Receipt Documents",
    entity: "wms_receipts_documents",
    idVar: "receiptsDocumentId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      wmsreceiptsid: "{{receiptId}}",
      originalfilename: "delivery-note.pdf",
      storagebucket: "cargosynq-wms-receipts-documents-dev",
      storagekey: "wms-receipts/{{receiptId}}/delivery-note.pdf",
      storageurl: "https://example.invalid/delivery-note.pdf",
      size: 1024,
      mimetype: "application/pdf",
      md5hash: "replace-with-md5-hash",
      isdeleted: false,
      documenttype: "DELIVERY_NOTE",
    },
    patch: { documenttype: "COMMERCIAL_INVOICE", isdeleted: false },
  },
  {
    name: "Receipt References",
    entity: "wms_receipts_references",
    idVar: "receiptReferenceId",
    methods: ["list", "post", "delete"],
    post: {
      wmsreceiptsid: "{{receiptId}}",
      referencetype: "BARCODE",
      referencevalue: "1Z999AA10123456784",
    },
  },
  {
    name: "Receipt Actions",
    entity: "wms_receipts_actions",
    idVar: "receiptActionId",
    methods: ["list", "get", "post", "patch", "delete", "apply", "discard"],
    post: {
      wmsreceiptsid: "{{receiptId}}",
      entitytype: "wms_receipts",
      entityid: "{{receiptId}}",
      actiontype: "patch",
      title: "Mark receipt as completed",
      summary: "All units have been processed",
      proposedchanges: { status: "COMPLETED" },
      currentstate: { status: "PROCESSING" },
    },
    patch: { title: "Updated action title", proposedchanges: { status: "COMPLETED" } },
  },
  {
    name: "Units",
    entity: "wms_units",
    idVar: "unitId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: { wmsreceiptsid: "{{receiptId}}", placesid: "{{placeId}}" },
    patch: {
      length: 60,
      width: 40,
      height: 30,
      dimensionunit: "cm",
      weight: 12.5,
      weightunit: "kg",
      packagetype: "BOX",
      conditionreceived: "GOOD",
      isdg: false,
      isbonded: false,
      status: "IN_STOCK",
    },
  },
  {
    name: "Unit Access",
    entity: "wms_units_access",
    idVar: "unitAccessId",
    methods: ["list", "post", "delete"],
    post: {
      wmsunitsid: "{{unitId}}",
      organizationsid: "{{organizationId}}",
      sharedbyorganizationsid: "{{organizationId}}",
      sharedby: "{{userId}}",
      accesstype: "READ_WRITE",
    },
  },
  {
    name: "Unit Documents",
    entity: "wms_units_documents",
    idVar: "unitsDocumentId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      wmsunitsid: "{{unitId}}",
      originalfilename: "unit-photo.jpg",
      storagebucket: "cargosynq-wms-receipts-documents-dev",
      storagekey: "wms-units/{{unitId}}/unit-photo.jpg",
      storageurl: "https://example.invalid/unit-photo.jpg",
      size: 1024,
      mimetype: "image/jpeg",
      md5hash: "replace-with-md5-hash",
      isdeleted: false,
      documenttype: "PHOTO",
    },
    patch: { documenttype: "LABEL", isdeleted: false },
  },
  {
    name: "Unit References",
    entity: "wms_units_references",
    idVar: "unitReferenceId",
    methods: ["list", "post", "delete"],
    post: {
      wmsunitsid: "{{unitId}}",
      referencetype: "BARCODE",
      referencevalue: "BOX-EXT-12345",
    },
  },
  {
    name: "Unit Actions",
    entity: "wms_units_actions",
    idVar: "unitActionId",
    methods: ["list", "get", "post", "patch", "delete", "apply", "discard"],
    post: {
      wmsunitsid: "{{unitId}}",
      entitytype: "wms_units",
      entityid: "{{unitId}}",
      actiontype: "patch",
      title: "Update unit condition",
      summary: "Record the condition found during handling",
      proposedchanges: { conditionreceived: "DAMAGED" },
      currentstate: { conditionreceived: "GOOD" },
    },
    patch: { title: "Updated action title", proposedchanges: { conditionreceived: "DAMAGED" } },
  },
  {
    name: "Picklists",
    entity: "wms_picklists",
    idVar: "picklistId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      placesid: "{{placeId}}",
      status: "OPEN",
      priority: "NORMAL",
      assignedto: "{{userId}}",
      notes: "Example picklist",
    },
    patch: { status: "PICKING", priority: "HIGH" },
  },
  {
    name: "Picklist Access",
    entity: "wms_picklists_access",
    idVar: "picklistAccessId",
    methods: ["list", "post", "delete"],
    post: {
      wmspicklistsid: "{{picklistId}}",
      organizationsid: "{{organizationId}}",
      sharedbyorganizationsid: "{{organizationId}}",
      sharedby: "{{userId}}",
      accesstype: "READ_WRITE",
    },
  },
  {
    name: "Picklist Units",
    entity: "wms_picklists_units",
    idVar: "picklistUnitId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      wmspicklistsid: "{{picklistId}}",
      wmsunitsid: "{{unitId}}",
      status: "PENDING",
      wmspositionsid: "{{positionId}}",
      notes: "Example picklist unit",
    },
    patch: { status: "PICKED", pickedby: "{{userId}}" },
  },
  {
    name: "Picklist Documents",
    entity: "wms_picklists_documents",
    idVar: "picklistDocumentId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      wmspicklistsid: "{{picklistId}}",
      originalfilename: "picklist.pdf",
      storagebucket: "cargosynq-wms-receipts-documents-dev",
      storagekey: "wms-picklists/{{picklistId}}/picklist.pdf",
      storageurl: "https://example.invalid/picklist.pdf",
      size: 1024,
      mimetype: "application/pdf",
      md5hash: "replace-with-md5-hash",
      isdeleted: false,
      documenttype: "PICKLIST",
    },
    patch: { documenttype: "PROOF_OF_DISPATCH", isdeleted: false },
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
      ? entity.patch ?? { notes: "Updated from Bruno" }
      : { applyStrategy: "merge" };

  const headers = hasBody
    ? `  headers:
    - name: Content-Type
      value: application/json
    - name: x-idempotency-key
      value: "{{idempotencyKey}}"
      disabled: true
`
    : "";

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
  url: "{{endpoint}}/${entity.entity}${suffix}"
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
  Defined by cq-backend and protected by the WMS Cognito authorizer.
`;
}

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

console.log(`Generated ${routeCount} WMS requests across ${entities.length} entity folders.`);
