import { keccak256, stringToBytes, type Address } from "viem";
import { polygonAmoy } from "viem/chains";
import { CONTRACT_ADDRESSES, CROWD_PRICES } from "@/lib/constants";
import type { BoostType } from "@/lib/razorpay-checkout";

export const SUPPORTED_CHAIN = polygonAmoy;
export const SUPPORTED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? polygonAmoy.id);

const ZERO = "0x0000000000000000000000000000000000000000";

export function contractsConfigured(): boolean {
  return (
    CONTRACT_ADDRESSES.CROWD_TOKEN !== ZERO &&
    CONTRACT_ADDRESSES.QUEUE_BOOST !== ZERO
  );
}

export function encodeRoomId(roomCode: string): `0x${string}` {
  return keccak256(stringToBytes(roomCode.toUpperCase()));
}

export function encodeQueueItemId(queueItemId: string): `0x${string}` {
  return keccak256(stringToBytes(queueItemId));
}

/** On-chain boost type strings accepted by QueueBoost.sol */
export const CONTRACT_BOOST_TYPES = {
  BOOST: "VOTE_BOOST",
  PRIORITY_BOOST: "QUEUE_JUMP",
  PLAY_NEXT: "PLAY_NEXT",
  SUPER_PRIORITY: "SUPER_PRIORITY",
} as const;

export function boostTypeToContractString(boostType: BoostType): string {
  return CONTRACT_BOOST_TYPES[boostType];
}

export function contractStringToBoostType(contractType: string): BoostType | null {
  const entry = Object.entries(CONTRACT_BOOST_TYPES).find(([, v]) => v === contractType);
  return entry ? (entry[0] as BoostType) : null;
}

export function crowdPriceForBoost(boostType: BoostType): number {
  const map: Record<BoostType, number> = {
    BOOST: CROWD_PRICES.VOTE_BOOST,
    PRIORITY_BOOST: CROWD_PRICES.QUEUE_JUMP,
    PLAY_NEXT: CROWD_PRICES.PLAY_NEXT,
    SUPER_PRIORITY: CROWD_PRICES.SUPER_PRIORITY,
  };
  return map[boostType];
}

export function crowdPriceKeyForBoost(boostType: BoostType): keyof typeof CROWD_PRICES {
  const map: Record<BoostType, keyof typeof CROWD_PRICES> = {
    BOOST: "VOTE_BOOST",
    PRIORITY_BOOST: "QUEUE_JUMP",
    PLAY_NEXT: "PLAY_NEXT",
    SUPER_PRIORITY: "SUPER_PRIORITY",
  };
  return map[boostType];
}

export const erc20Abi = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export const queueBoostAbi = [
  {
    name: "buyBoost",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "roomId", type: "bytes32" },
      { name: "itemId", type: "bytes32" },
      { name: "boostType", type: "string" },
      { name: "creator", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "playNext",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "roomId", type: "bytes32" },
      { name: "itemId", type: "bytes32" },
      { name: "creator", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "BoostPurchased",
    type: "event",
    inputs: [
      { name: "buyer", type: "address", indexed: true },
      { name: "roomId", type: "bytes32", indexed: true },
      { name: "itemId", type: "bytes32", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "boostType", type: "string", indexed: false },
    ],
  },
] as const;

export function getContractAddresses(): { crowdToken: Address; queueBoost: Address } {
  return {
    crowdToken: CONTRACT_ADDRESSES.CROWD_TOKEN as Address,
    queueBoost: CONTRACT_ADDRESSES.QUEUE_BOOST as Address,
  };
}
