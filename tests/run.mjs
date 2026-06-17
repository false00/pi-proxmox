import { run as auth } from "./auth.test.mjs";
import { run as pagination } from "./pagination.test.mjs";
import { run as vmAgent } from "./vm-agent.test.mjs";
import { run as execute } from "./execute.test.mjs";
import { run as lxc } from "./lxc.test.mjs";
import { run as vm } from "./vm.test.mjs";
import { run as upload } from "./upload.test.mjs";
import { run as runtime } from "./runtime.test.mjs";
import { run as pkg } from "./package.test.mjs";

let totalFailed = 0;

totalFailed += await auth();
totalFailed += await pagination();
totalFailed += await vmAgent();
totalFailed += await execute();
totalFailed += await lxc();
totalFailed += await vm();
totalFailed += await upload();
totalFailed += await runtime();
totalFailed += await pkg();

console.log(`\n${totalFailed > 0 ? "FAILED" : "ALL PASSED"}`);
if (totalFailed > 0) process.exit(1);
