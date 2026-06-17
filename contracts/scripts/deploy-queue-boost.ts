/**
 * Redeploy only QueueBoost (e.g. after SUPER_PRIORITY update).
 * Requires NEXT_PUBLIC_CROWD_TOKEN_ADDRESS in .env
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";
import type { ContractFactory, Signer } from "ethers";

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
loadEnv({ path: path.join(projectRoot, ".env") });

async function deployEstimated(
  factory: ContractFactory,
  deployer: Signer,
  args: unknown[] = []
) {
  const deployTx = await factory.getDeployTransaction(...args);
  deployTx.from = await deployer.getAddress();
  const provider = deployer.provider;
  if (!provider) throw new Error("Deployer has no provider");
  const estimated = await provider.estimateGas(deployTx);
  const gasLimit = (estimated * 125n) / 100n;
  console.log(`  gas estimate: ${estimated} → limit: ${gasLimit}`);
  const contract = await factory.connect(deployer).deploy(...args, { gasLimit });
  await contract.waitForDeployment();
  return contract;
}

async function main() {
  const crowdToken = process.env.NEXT_PUBLIC_CROWD_TOKEN_ADDRESS;
  if (!crowdToken || crowdToken === "0x0000000000000000000000000000000000000000") {
    throw new Error("Set NEXT_PUBLIC_CROWD_TOKEN_ADDRESS in .env first");
  }

  const connection = await network.connect();
  const { ethers } = connection;
  const [deployer] = await ethers.getSigners();

  const balanceMatic = Number(ethers.formatEther(await ethers.provider.getBalance(deployer.address)));
  console.log("Deployer:", deployer.address, "| Balance:", balanceMatic.toFixed(4), "MATIC");

  if (balanceMatic < 0.02) {
    throw new Error("Need at least ~0.02 MATIC. Get Amoy faucet: https://faucet.polygon.technology/");
  }

  console.log("Deploying QueueBoost only…");
  const factory = await ethers.getContractFactory("QueueBoost");
  const contract = await deployEstimated(factory, deployer, [crowdToken, deployer.address]);
  const addr = await contract.getAddress();

  console.log("\n--- Update .env ---");
  console.log(`NEXT_PUBLIC_QUEUE_BOOST_ADDRESS="${addr}"`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
