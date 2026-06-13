import { ProxmoxClient } from "../dist/proxmox-client.js";

export function createClient() {
  return new ProxmoxClient();
}

export function autoRun(runFn, metaUrl) {
  const url = metaUrl.replace(/\\/g, "/");
  const arg = process.argv[1]?.replace(/\\/g, "/");
  if (arg && url.endsWith(arg.split("/").pop())) {
    runFn().then(failed => { if (failed > 0) process.exit(1); });
  }
}

export function suite(name) {
  const s = {
    name,
    passed: 0,
    failed: 0,
    async test(description, fn) {
      try {
        await fn();
        this.passed++;
        console.log(`  \u2713 ${description}`);
      } catch (err) {
        this.failed++;
        console.log(`  \u2717 ${description}: ${err.message}`);
      }
    },
    print() {
      console.log(`\n${this.name}: ${this.passed} passed, ${this.failed} failed`);
      return this.failed;
    },
  };
  return s;
}
