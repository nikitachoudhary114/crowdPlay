"use client";

import { useAccount, useSwitchChain, useWriteContract } from "wagmi";
import { createPublicClient, http, parseEther, type Address, type Hash } from "viem";
import type { BoostType } from "@/lib/razorpay-checkout";
import {
  boostTypeToContractString,
  crowdPriceKeyForBoost,
  encodeQueueItemId,
  encodeRoomId,
  erc20Abi,
  queueBoostAbi,
  SUPPORTED_CHAIN,
  SUPPORTED_CHAIN_ID,
} from "@/lib/contracts";

export function useCryptoBoost() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  async function ensureChain() {
    if (chainId !== SUPPORTED_CHAIN_ID) {
      await switchChainAsync({ chainId: SUPPORTED_CHAIN_ID });
    }
  }

  async function payBoost(params: {
    roomCode: string;
    queueItemId: string;
    boostType: BoostType;
  }): Promise<Hash> {
    if (!address) throw new Error("Connect your wallet first");

    const contractType = boostTypeToContractString(params.boostType);

    const prepRes = await fetch(
      `/api/payments/crypto?roomCode=${encodeURIComponent(params.roomCode)}`
    );
    const prep = await prepRes.json();
    if (!prepRes.ok) throw new Error(prep.error ?? "Could not prepare crypto payment");
    if (!prep.configured) throw new Error("Crypto payments are not configured on this server");

    await ensureChain();

    const priceKey = crowdPriceKeyForBoost(params.boostType);
    const price = parseEther(String(prep.prices[priceKey]));

    const client = createPublicClient({
      chain: SUPPORTED_CHAIN,
      transport: http(),
    });

    const allowance = await client.readContract({
      address: prep.crowdToken as Address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [address, prep.queueBoost as Address],
    });

    if (allowance < price) {
      const approveHash = await writeContractAsync({
        address: prep.crowdToken as Address,
        abi: erc20Abi,
        functionName: "approve",
        args: [prep.queueBoost as Address, price],
        chainId: SUPPORTED_CHAIN_ID,
      });
      await client.waitForTransactionReceipt({ hash: approveHash });
    }

    const roomId = encodeRoomId(params.roomCode);
    const itemId = encodeQueueItemId(params.queueItemId);
    const creator = prep.creatorAddress as Address;

    if (params.boostType === "PLAY_NEXT") {
      return writeContractAsync({
        address: prep.queueBoost as Address,
        abi: queueBoostAbi,
        functionName: "playNext",
        args: [roomId, itemId, creator],
        chainId: SUPPORTED_CHAIN_ID,
      });
    }

    return writeContractAsync({
      address: prep.queueBoost as Address,
      abi: queueBoostAbi,
      functionName: "buyBoost",
      args: [roomId, itemId, contractType, creator],
      chainId: SUPPORTED_CHAIN_ID,
    });
  }

  return { payBoost, isConnected, address, chainId };
}
