import { ProxmoxClient } from "./proxmox-client.js";

import { vmList, vmStatus, vmConfig, vmStart, vmStop, vmShutdown, vmCreate, vmDelete, vmSnapshot, vmClone, vmMigrate, vmResizeDisk, vmReset, vmResume, vmSuspend, vmReboot, vmUpdateConfig, vmTemplate, vmMoveDisk, vmPendingChanges, vmSnapshotList, vmSnapshotRollback, vmSnapshotDelete, vmAgentExec, vmAgentExecStatus, vmAgentPing, vmAgentInfo, vmAgentGetHostName, vmAgentGetNetworkInterfaces, vmAgentGetOSInfo, vmAgentGetTime, vmAgentGetUsers, vmAgentGetVcpus, vmAgentFileRead, vmAgentFileWrite, vmAgentSetUserPassword } from "./tools/vm.js";
import { lxcList, lxcStatus, lxcStart, lxcStop, lxcShutdown, lxcCreate, lxcDelete, lxcSnapshot, lxcReset, lxcResume, lxcSuspend, lxcReboot, lxcUpdateConfig, lxcTemplate, lxcResize, lxcTemplateList, lxcPendingChanges, lxcSnapshotList, lxcSnapshotRollback, lxcSnapshotDelete, lxcMigrate } from "./tools/lxc.js";
import { nodeList, nodeStatus, nodeServices, nodeServiceRestart, nodeServiceStatus, nodeServiceStart, nodeServiceStop, nodeJournal, nodeDns, nodeTime, nodeExecute, nodeConfig, nodeReboot, nodeStop, nodeAptUpdate, nodeSubscription, nodeHardware, nodeNetworkList } from "./tools/node.js";
import { storageList, storageContent, storageCreate, storageDetail, storageDelete, storageScan, storageUpload, storageRemoveVolume, poolList, poolCreate, poolDelete } from "./tools/storage.js";
import { clusterStatus, clusterResources, clusterNextId, clusterVersion, clusterLog, clusterOptions, clusterUpdateOptions, clusterConfig, checkPermissions } from "./tools/cluster.js";
import { backupList, backupCreate, backupDelete } from "./tools/backup.js";
import { firewallRules, firewallRuleAdd, firewallRulesDelete, firewallOptions, firewallOptionsUpdate, firewallAliases, firewallAliasCreate, firewallAliasDelete, firewallIpsetList, firewallIpsetCreate, firewallIpsetDelete } from "./tools/firewall.js";
import { taskList, taskStatus, taskLog } from "./tools/task.js";
import { userList, userCreate, userDetail, userDelete, groupList, groupCreate, groupDelete, roleList, roleCreate, roleDelete, aclList, aclUpdate, tokenList, tokenCreate, tokenDelete, domainList } from "./tools/access.js";
import { haStatus, haResourcesList, haResourceCreate, haResourceDelete, haGroupsList, haGroupCreate, haGroupDelete } from "./tools/ha.js";
import { replicationList, replicationCreate, replicationDelete, replicationRun, replicationLog } from "./tools/replication.js";
import { apiCall, apiUploadFile } from "./tools/raw.js";

export default async function (pi) {
  const client = new ProxmoxClient();

  const tools = [
    // VMs
    vmList(client),
    vmStatus(client),
    vmConfig(client),
    vmStart(client),
    vmStop(client),
    vmShutdown(client),
    vmReset(client),
    vmResume(client),
    vmSuspend(client),
    vmReboot(client),
    vmCreate(client),
    vmDelete(client),
    vmUpdateConfig(client),
    vmTemplate(client),
    vmMoveDisk(client),
    vmPendingChanges(client),
    vmSnapshot(client),
    vmSnapshotList(client),
    vmSnapshotRollback(client),
    vmSnapshotDelete(client),
    vmClone(client),
    vmMigrate(client),
    vmResizeDisk(client),

    // VM QEMU Guest Agent
    vmAgentExec(client),
    vmAgentExecStatus(client),
    vmAgentPing(client),
    vmAgentInfo(client),
    vmAgentGetHostName(client),
    vmAgentGetNetworkInterfaces(client),
    vmAgentGetOSInfo(client),
    vmAgentGetTime(client),
    vmAgentGetUsers(client),
    vmAgentGetVcpus(client),
    vmAgentFileRead(client),
    vmAgentFileWrite(client),
    vmAgentSetUserPassword(client),

    // LXC
    lxcList(client),
    lxcStatus(client),
    lxcStart(client),
    lxcStop(client),
    lxcShutdown(client),
    lxcReset(client),
    lxcResume(client),
    lxcSuspend(client),
    lxcReboot(client),
    lxcCreate(client),
    lxcDelete(client),
    lxcUpdateConfig(client),
    lxcTemplate(client),
    lxcTemplateList(client),
    lxcResize(client),
    lxcPendingChanges(client),
    lxcSnapshot(client),
    lxcSnapshotList(client),
    lxcSnapshotRollback(client),
    lxcSnapshotDelete(client),
    lxcMigrate(client),

    // Nodes
    nodeList(client),
    nodeStatus(client),
    nodeConfig(client),
    nodeServices(client),
    nodeServiceStatus(client),
    nodeServiceStart(client),
    nodeServiceStop(client),
    nodeServiceRestart(client),
    nodeJournal(client),
    nodeDns(client),
    nodeTime(client),
    nodeHardware(client),
    nodeNetworkList(client),
    nodeExecute(client),
    nodeReboot(client),
    nodeStop(client),
    nodeAptUpdate(client),
    nodeSubscription(client),

    // Storage
    storageList(client),
    storageContent(client),
    storageCreate(client),
    storageDetail(client),
    storageDelete(client),
    storageScan(client),
    storageUpload(client),
    storageRemoveVolume(client),
    poolList(client),
    poolCreate(client),
    poolDelete(client),

    // Cluster
    clusterStatus(client),
    clusterResources(client),
    clusterNextId(client),
    clusterVersion(client),
    clusterLog(client),
    clusterOptions(client),
    clusterUpdateOptions(client),
    clusterConfig(client),
    checkPermissions(client),

    // Backup
    backupList(client),
    backupCreate(client),
    backupDelete(client),

    // Firewall
    firewallRules(client),
    firewallRuleAdd(client),
    firewallRulesDelete(client),
    firewallOptions(client),
    firewallOptionsUpdate(client),
    firewallAliases(client),
    firewallAliasCreate(client),
    firewallAliasDelete(client),
    firewallIpsetList(client),
    firewallIpsetCreate(client),
    firewallIpsetDelete(client),

    // Access Control
    userList(client),
    userCreate(client),
    userDetail(client),
    userDelete(client),
    groupList(client),
    groupCreate(client),
    groupDelete(client),
    roleList(client),
    roleCreate(client),
    roleDelete(client),
    aclList(client),
    aclUpdate(client),
    tokenList(client),
    tokenCreate(client),
    tokenDelete(client),
    domainList(client),

    // High Availability
    haStatus(client),
    haResourcesList(client),
    haResourceCreate(client),
    haResourceDelete(client),
    haGroupsList(client),
    haGroupCreate(client),
    haGroupDelete(client),

    // Storage Replication
    replicationList(client),
    replicationCreate(client),
    replicationDelete(client),
    replicationRun(client),
    replicationLog(client),

    // Tasks
    taskList(client),
    taskStatus(client),
    taskLog(client),

    // Universal API coverage
    apiCall(client),
    apiUploadFile(client),
  ];

  for (const tool of tools) {
    pi.registerTool(tool);
  }
}
