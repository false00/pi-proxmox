import { run as auth } from "./auth.test.mjs";
import { run as pagination } from "./pagination.test.mjs";
import { run as vmAgent } from "./vm-agent.test.mjs";
import { run as execute } from "./execute.test.mjs";
import { run as lxc } from "./lxc.test.mjs";

let totalFailed = 0;

totalFailed += await auth();
totalFailed += await pagination();
totalFailed += await vmAgent();
totalFailed += await execute();
totalFailed += await lxc();

console.log(`\n${totalFailed > 0 ? "FAILED" : "ALL PASSED"}`);
if (totalFailed > 0) process.exit(1);
