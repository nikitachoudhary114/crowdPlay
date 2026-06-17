import { createPublicClient, http, parseEventLogs, type Address, type Hash } from "viem";
import { prisma } from "@/lib/db";
import {
  SUPPORTED_CHAIN,
  encodeQueueItemId,
  encodeRoomId,
  boostTypeToContractString,
  contractsConfigured,
  getContractAddresses,
  queueBoostAbi,
} from "@/lib/contracts";
import type { BoostType } from "@/lib/razorpay-checkout";

function getPublicClient() {
  const rpcUrl = process.env.POLYGON_AMOY_RPC_URL ?? "https://rpc-amoy.polygon.technology";
  return createPublicClient({
    chain: SUPPORTED_CHAIN,
    transport: http(rpcUrl),
  });
}

export async function verifyBoostTransaction(params: {
  txHash: Hash;
  buyerAddress: Address;
  roomCode: string;
  queueItemId: string;
  boostType: BoostType;
}) {
  if (!contractsConfigured()) {
    throw new Error("Crypto payments are not configured");
  }

  const expectedContractType = boostTypeToContractString(params.boostType);

  const existing = await prisma.boost.findFirst({ where: { txHash: params.txHash } });
  if (existing) throw new Error("Transaction already used");

  const client = getPublicClient();
  const receipt = await client.getTransactionReceipt({ hash: params.txHash });
  if (!receipt || receipt.status !== "success") {
    throw new Error("Transaction failed or not found");
  }

  const { queueBoost } = getContractAddresses();
  const roomId = encodeRoomId(params.roomCode);
  const itemId = encodeQueueItemId(params.queueItemId);

  const logs = parseEventLogs({
    abi: queueBoostAbi,
    logs: receipt.logs,
    eventName: "BoostPurchased",
  });

  const match = logs.find(
    (log) =>
      log.address.toLowerCase() === queueBoost.toLowerCase() &&
      log.args.buyer?.toLowerCase() === params.buyerAddress.toLowerCase() &&
      log.args.roomId === roomId &&
      log.args.itemId === itemId &&
      log.args.boostType === expectedContractType
  );

  if (!match) {
    throw new Error("Boost transaction does not match this room or song");
  }

  return {
    amount: Number(match.args.amount) / 1e18,
    contractBoostType: match.args.boostType as string,
  };
}
