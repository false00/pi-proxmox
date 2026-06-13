import { suite, createClient, autoRun } from "./helpers.mjs";

export async function run() {
  const s = suite("Storage Upload");
  const client = createClient();

  const nodes = await client.get("/nodes");
  const nodeName = nodes[0].node;

  let uploadResult;
  await s.test("upload README.md as ISO to local storage", async () => {
    const url = "https://raw.githubusercontent.com/false00/pi-proxmox/master/README.md";
    const downloadResp = await fetch(url, { dispatcher: client._dispatcher });
    if (!downloadResp.ok) throw new Error(`Download failed: ${downloadResp.status}`);

    const buffer = await downloadResp.arrayBuffer();
    const formData = new FormData();
    formData.append("content", "iso");
    formData.append("filename", new Blob([buffer]), "pi-test-upload.iso");

    uploadResult = await client.upload(`/nodes/${nodeName}/storage/local/upload`, formData);
    if (typeof uploadResult !== "string" || !uploadResult.startsWith("UPID:")) {
      throw new Error(`Expected UPID string, got ${JSON.stringify(uploadResult).slice(0, 100)}`);
    }
    console.log(`    (uploaded ${buffer.byteLength} bytes)`);
  });

  await s.test("verify uploaded file in storage content", async () => {
    const items = await client.get(`/nodes/${nodeName}/storage/local/content`, { content: "iso" });
    const found = items.find(v => v.volid && v.volid.includes("pi-test-upload"));
    if (!found) {
      // Upload is async — wait briefly and retry
      await new Promise(r => setTimeout(r, 3000));
      const retry = await client.get(`/nodes/${nodeName}/storage/local/content`, { content: "iso" });
      const found2 = retry.find(v => v.volid && v.volid.includes("pi-test-upload"));
      if (!found2) throw new Error("Uploaded file not found in storage content");
      console.log(`    (found: ${found2.volid})`);
      return;
    }
    console.log(`    (found: ${found.volid})`);
  });

  await s.test("remove uploaded file", async () => {
    await client.delete(`/nodes/${nodeName}/storage/local/content/local:iso/pi-test-upload.iso`);
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const items = await client.get(`/nodes/${nodeName}/storage/local/content`, { content: "iso" });
      if (!items.find(v => v.volid && v.volid.includes("pi-test-upload"))) {
        console.log("    (file removed)");
        return;
      }
    }
    throw new Error("File not removed (timed out)");
  });

  return s.print();
}

autoRun(run, import.meta.url);
