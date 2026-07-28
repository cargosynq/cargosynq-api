import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "Shipments");

const entities = [
  {
    name: "Shipments", entity: "shipments", idVar: "shipmentId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      shipmentnumber: "SHP-2026-001", trackingcode: "TRK-ABC123", status: "PENDING",
      mode: "SEA", incoterms: "FOB", estimateddeparture: "2026-08-01",
      estimatedarrival: "2026-09-01", originlocationid: "{{originLocationId}}",
      destinationlocationid: "{{destinationLocationId}}",
    },
    patch: { status: "IN_TRANSIT", actualdeparture: "2026-08-02" },
    custom: [
      { name: "Create From Orders", method: "POST", path: "/shipments/from-orders",
        body: {
          shipmentnumber: "SHP-2026-001",
          status: "DRAFT",
          orders: [{
            id: "{{orderId}}",
            orders_units: [{ id: "{{orderUnitId}}" }],
            lineitems: [{ id: "{{lineItemId}}" }],
          }],
          copyBusinesses: true,
          copyReferences: true,
        } },
      { name: "Transfer Units", method: "POST", path: "/shipments/{{shipmentId}}/transfer-units",
        body: { shipments_units: [{ id: "{{shipmentUnitId}}" }] } },
    ],
  },
  {
    name: "Access", entity: "shipments_access", idVar: "shipmentAccessId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: { shipmentsid: "{{shipmentId}}", organizationsid: "{{organizationId}}", accesstype: "SHARED" },
    patch: { accesstype: "SHARED" },
  },
  {
    name: "References", entity: "shipments_references", idVar: "shipmentReferenceId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: { shipmentsid: "{{shipmentId}}", referencetype: "BOOKING", referencevalue: "BOOK-12345" },
    patch: { referencevalue: "BOOK-UPDATED" },
  },
  {
    name: "Businesses", entity: "shipments_businesses", idVar: "shipmentBusinessId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: { shipmentsid: "{{shipmentId}}", businessesid: "{{businessId}}", businesstype: "SHIPPER" },
    patch: { businesstype: "CONSIGNEE" },
  },
  {
    name: "Places", entity: "shipments_places", idVar: "shipmentPlaceId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: { shipmentsid: "{{shipmentId}}", placesid: "{{placeId}}", placetype: "ORIGIN" },
    patch: { placetype: "DESTINATION" },
  },
  {
    name: "Units", entity: "shipments_units", idVar: "shipmentUnitId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      shipmentsid: "{{shipmentId}}", ordersunitsid: "{{orderUnitId}}", unitnumber: "CONT-001",
      unittype: "CONTAINER", quantity: 1, weight: 15000, weightunit: "KG",
      volume: 33.2, volumeunit: "CBM", length: 1200, width: 235, height: 239,
      dimensionunit: "CM", description: "40ft container",
    },
    patch: { weight: 15200, description: "Updated container weight" },
    custom: [
      { name: "Create From Orders", method: "POST", path: "/shipments_units/from-orders",
        body: {
          orders_units: [{
            id: "{{orderUnitId}}",
            shipments_units_references: [{
              referencetype: "CUSTOM",
              referencevalue: "EXTRA-REF-1",
            }],
            warehouse_receipts: [{
              placesid: "{{placeId}}",
              status: "AVAILABLE",
              receivedat: "2026-07-28T10:00:00.000Z",
            }],
          }],
        } },
    ],
  },
  {
    name: "Unit References", entity: "shipments_units_references", idVar: "shipmentUnitReferenceId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: { shipmentsunitsid: "{{shipmentUnitId}}", referencetype: "CONTAINER", referencevalue: "MSCU1234567" },
    patch: { referencevalue: "MSCU7654321" },
  },
  {
    name: "Unit Documents", entity: "shipments_units_documents", idVar: "shipmentUnitDocumentId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      shipmentsunitsid: "{{shipmentUnitId}}", originalfilename: "unit-document.pdf",
      storagebucket: "cargosynq-documents", storagekey: "shipments/units/unit-document.pdf",
      storageurl: "https://example.invalid/unit-document.pdf", size: 1024,
      mimetype: "application/pdf", md5hash: "replace-with-md5-hash",
      isdeleted: false, documenttype: "COMMERCIAL_INVOICE",
    },
    patch: { documenttype: "PACKING_LIST", isdeleted: false },
  },
  {
    name: "Unit Transfers", entity: "shipments_units_transfers", idVar: "shipmentUnitTransferId",
    methods: ["list", "get"],
  },
  {
    name: "Line Items", entity: "shipments_lineitems", idVar: "shipmentLineItemId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      shipmentsid: "{{shipmentId}}", orderslineitemsid: "{{lineItemId}}",
      description: "Widget A - Blue", quantity: 100, unitofmeasurement: "pcs",
      unitcost: 25.5, currency: "USD", hscode: "8471.30.01", countryoforigin: "CHN",
    },
    patch: { quantity: 120, unitcost: 24 },
  },
  {
    name: "Charges", entity: "shipments_charges", idVar: "shipmentChargeId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      shipmentsid: "{{shipmentId}}", businessesid: "{{businessId}}", placesid: "{{placeId}}",
      chargetype: "freight", chargecode: "OFT", description: "Ocean Freight",
      buycost: "1000.00", buycurrency: "USD", buyquantity: "1", buyunit: "CONTAINER",
      sellprice: "1200.00", sellcurrency: "USD", sellquantity: "1", sellunit: "CONTAINER",
    },
    patch: { sellprice: "1300.00", sellquantity: "1" },
  },
  {
    name: "Documents", entity: "shipments_documents", idVar: "shipmentDocumentId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      shipmentsid: "{{shipmentId}}", documenttype: "BILL_OF_LADING", filename: "bol.pdf",
      s3bucket: "cargosynq-documents", s3key: "shipments/{{shipmentId}}/bol.pdf",
      filesize: 1024, mimetype: "application/pdf",
    },
    patch: { documenttype: "MASTER_BILL" },
  },
  {
    name: "Remarks", entity: "shipments_remarks", idVar: "shipmentRemarkId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: { shipmentsid: "{{shipmentId}}", remark: "Please review this shipment", mentions: [{ usersid: "{{userId}}" }] },
    patch: { remark: "Updated shipment remark" },
  },
  {
    name: "Remark Mentions", entity: "shipments_remarks_mentions", idVar: "shipmentRemarkMentionId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: { remarksid: "{{shipmentRemarkId}}", usersid: "{{userId}}" },
    patch: { usersid: "{{userId}}" },
  },
  {
    name: "Activities", entity: "shipments_activities", idVar: "shipmentActivityId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: { shipmentsid: "{{shipmentId}}", activitytype: "STATUS_CHANGE", description: "Shipment entered transit", metadata: { status: "IN_TRANSIT" } },
    patch: { description: "Updated activity description" },
  },
  {
    name: "Needs Attention", entity: "shipments_needsattentions", idVar: "shipmentNeedsAttentionId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: { shipmentsid: "{{shipmentId}}", organizationsid: "{{organizationId}}", reason: "Missing document", status: "ACTIVE", code: "MISSING_DOCS" },
    patch: { status: "RESOLVED" },
  },
  {
    name: "Features", entity: "shipments_features", idVar: "shipmentFeatureId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: { shipmentsid: "{{shipmentId}}", organizationsid: "{{organizationId}}", featuretype: "TRACKING", enabled: true, configuration: { provider: "example" } },
    patch: { enabled: false },
  },
  {
    name: "Actions", entity: "shipments_actions", idVar: "shipmentActionId",
    methods: ["list", "get", "post", "patch", "delete", "apply", "discard"],
    post: {
      organizationsid: "{{organizationId}}", shipmentsid: "{{shipmentId}}",
      entitytype: "shipments", entityid: "{{shipmentId}}", actiontype: "patch",
      title: "Update shipment status", proposedchanges: { status: "DELIVERED" },
      currentstate: { status: "IN_TRANSIT" }, status: "CREATED",
    },
    patch: { title: "Updated shipment action" },
  },
  {
    name: "Warehouse Receipts", entity: "warehouse_receipts", idVar: "warehouseReceiptId",
    methods: ["list", "get", "post", "patch", "delete"],
    post: {
      shipmentsunitsid: "{{shipmentUnitId}}", placesid: "{{placeId}}",
      inboundshipmentsid: "{{shipmentId}}", status: "AVAILABLE",
      receivedat: "2026-07-28T10:00:00.000Z",
    },
    patch: { status: "RESERVED", releasedshipmentsid: "{{targetShipmentId}}" },
  },
  {
    name: "Warehouse Receipt Access", entity: "warehouse_receipts_access", idVar: "warehouseReceiptAccessId",
    methods: ["list", "post", "delete"],
    post: { warehousereceiptsid: "{{warehouseReceiptId}}", organizationsid: "{{organizationId}}", accesstype: "SHARED" },
  },
  {
    name: "Unit Manifest", entity: "shipments_units_manifest", idVar: "shipmentUnitManifestId",
    methods: ["list", "get", "post", "delete"],
    post: { shipmentsunitsid: "{{shipmentUnitId}}", sourceunitid: "{{sourceShipmentUnitId}}", quantity: 1 },
  },
];

const labels = { list: "List", get: "Get", post: "Create", patch: "Update", delete: "Delete", apply: "Apply", discard: "Discard" };
const methods = { list: "GET", get: "GET", post: "POST", patch: "PATCH", delete: "DELETE", apply: "POST", discard: "POST" };

function jsonBody(value) {
  return JSON.stringify(value, null, 2)
    .replace(/"(\{\{[^"]+\}\})"/g, "$1")
    .split("\n").map((line) => `      ${line}`).join("\n");
}

function yamlRequest({ name, method, url, body, sequence }) {
  const hasBody = body !== undefined;
  const isList = method === "GET" && !url.includes("{{");
  return `info:
  name: ${name}
  type: http
  seq: ${sequence}

http:
  method: ${method}
  url: "{{shipmentsEndpoint}}${url}"
${isList ? `  params:
    - name: limit
      value: "25"
      type: query
    - name: offset
      value: "0"
      type: query
` : ""}${hasBody ? `  headers:
    - name: Content-Type
      value: application/json
    - name: x-idempotency-key
      value: "{{idempotencyKey}}"
      disabled: true
  body:
    type: json
    data: |-
${jsonBody(body)}
` : ""}  auth:
    type: bearer
    token: "{{token}}"

settings:
  encodeUrl: true
  timeout: 0
  followRedirects: true
  maxRedirects: 5

docs: |-
  ${method} ${url.replace(/\{\{[^}]+\}\}/g, "{id}")}
  Defined by the cq-backend Shipments module.
`;
}

await mkdir(root, { recursive: true });
await writeFile(path.join(root, "folder.yml"), "info:\n  name: Shipments\n  type: folder\n  seq: 3\n");

let routeCount = 0;
for (const [entityIndex, entity] of entities.entries()) {
  const directory = path.join(root, entity.name);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "folder.yml"), `info:\n  name: ${entity.name}\n  type: folder\n  seq: ${entityIndex + 1}\n`);
  let sequence = 1;
  for (const action of entity.methods) {
    const suffix = action === "list" || action === "post" ? "" : `/{{${entity.idVar}}}${action === "apply" || action === "discard" ? `/${action}` : ""}`;
    const body = action === "post" ? entity.post : action === "patch" ? entity.patch : action === "apply" ? { applyStrategy: "merge" } : undefined;
    await writeFile(path.join(directory, `${String(sequence).padStart(2, "0")} ${labels[action]}.yml`), yamlRequest({
      name: `${labels[action]} ${entity.name}`, method: methods[action], url: `/${entity.entity}${suffix}`, body, sequence,
    }));
    sequence += 1;
    routeCount += 1;
  }
  for (const custom of entity.custom ?? []) {
    await writeFile(path.join(directory, `${String(sequence).padStart(2, "0")} ${custom.name}.yml`), yamlRequest({
      name: custom.name, method: custom.method, url: custom.path, body: custom.body, sequence,
    }));
    sequence += 1;
    routeCount += 1;
  }
}

console.log(`Generated ${routeCount} Shipments requests across ${entities.length} resource folders.`);
