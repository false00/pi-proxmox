import { suite, createClient, autoRun } from "./helpers.mjs";
import { apiCall, apiUploadFile } from "../dist/tools/raw.js";

export async function run() {
  const s = suite("Raw API Coverage");
  const client = createClient();
  const rawTool = apiCall(client);
  const uploadTool = apiUploadFile(client);

  const nodes = await client.get("/nodes");
  const nodeName = nodes[0].node;
  const groupid = `pi-raw-${Date.now()}`;
  const uploadName = `pi-raw-upload-${Date.now()}.iso`;

  let groupCreated = false;
  let aclAdded = false;
  let uploadedVolid = null;

  await s.test("raw API GET supports relative paths", async () => {
    const result = await rawTool.execute("raw-get-version", {
      method: "GET",
      path: "version",
    }, null, null);
    const payload = JSON.parse(result.content[0].text);
    if (!payload?.version) throw new Error("Missing version field");
  });

  await s.test("raw API GET supports query params", async () => {
    const result = await rawTool.execute("raw-get-resources", {
      method: "GET",
      path: "/cluster/resources",
      params: JSON.stringify({ type: "vm" }),
    }, null, null);
    const payload = JSON.parse(result.content[0].text);
    if (!Array.isArray(payload)) throw new Error("Expected array payload");
  });

  await s.test("raw API POST creates a temporary group", async () => {
    await rawTool.execute("raw-post-group", {
      method: "POST",
      path: "/access/groups",
      params: JSON.stringify({ groupid, comment: "pi raw api coverage test" }),
    }, null, null);

    const groups = await client.get("/access/groups");
    if (!groups.find(g => g.groupid === groupid)) throw new Error("Temporary group not found");
    groupCreated = true;
  });

  await s.test("raw API PUT updates ACL entries", async () => {
    if (!groupCreated) throw new Error("Temporary group was not created");

    await rawTool.execute("raw-put-acl", {
      method: "PUT",
      path: "/access/acl",
      params: JSON.stringify({
        path: "/",
        roles: "PVEAuditor",
        groups: groupid,
        propagate: 0,
      }),
    }, null, null);
    aclAdded = true;
  });

  await s.test("raw API DELETE removes the temporary group after ACL cleanup", async () => {
    if (!groupCreated) throw new Error("Temporary group was not created");

    if (aclAdded) {
      await rawTool.execute("raw-put-acl-delete", {
        method: "PUT",
        path: "/access/acl",
        params: JSON.stringify({
          path: "/",
          roles: "PVEAuditor",
          groups: groupid,
          delete: 1,
        }),
      }, null, null);
      aclAdded = false;
    }

    await rawTool.execute("raw-delete-group", {
      method: "DELETE",
      path: `/access/groups/${groupid}`,
    }, null, null);

    const groups = await client.get("/access/groups");
    if (groups.find(g => g.groupid === groupid)) throw new Error("Temporary group still exists");
    groupCreated = false;
  });

  await s.test("raw upload tool can hit official upload endpoints", async () => {
    const result = await uploadTool.execute("raw-upload", {
      path: `/nodes/${nodeName}/storage/local/upload`,
      file_path: "README.md",
      filename: uploadName,
      fields: JSON.stringify({ content: "iso" }),
    }, null, null);

    const payload = JSON.parse(result.content[0].text);
    if (!payload || payload.filename !== uploadName) throw new Error("Unexpected upload payload");

    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const items = await client.get(`/nodes/${nodeName}/storage/local/content`, { content: "iso" });
      const found = items.find(v => v.volid && v.volid.includes(uploadName));
      if (found) {
        uploadedVolid = found.volid;
        return;
      }
    }

    throw new Error("Uploaded file not found in storage content");
  });

  await s.test("raw API validation errors are surfaced", async () => {
    let thrown;
    try {
      await rawTool.execute("raw-invalid", {
        method: "PATCH",
        path: "/version",
      }, null, null);
    } catch (err) {
      thrown = err;
    }

    if (!thrown) throw new Error("Expected validation error");
    const payload = JSON.parse(thrown.message);
    if (payload.category !== "validation") throw new Error(`Expected validation category, got ${payload.category}`);
  });

  try {
    return s.print();
  } finally {
    try {
      if (!uploadedVolid) {
        const items = await client.get(`/nodes/${nodeName}/storage/local/content`, { content: "iso" });
        const found = items.find(v => v.volid && v.volid.includes(uploadName));
        if (found) uploadedVolid = found.volid;
      }
      if (uploadedVolid) {
        await client.delete(`/nodes/${nodeName}/storage/local/content/${uploadedVolid}`);
      }
    } catch {}

    try {
      if (aclAdded) {
        await client.put("/access/acl", {
          path: "/",
          roles: "PVEAuditor",
          groups: groupid,
          delete: 1,
        });
      }
    } catch {}

    try {
      if (groupCreated) {
        await client.delete(`/access/groups/${groupid}`);
      }
    } catch {}
  }
}

autoRun(run, import.meta.url);
