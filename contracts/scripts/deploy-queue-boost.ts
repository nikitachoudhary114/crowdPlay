/**
 * Redeploy only QueueBoost (e.g. after SUPER_PRIORITY update).
 * Requires NEXT_PUBLIC_CROWD_TOKEN_ADDRESS in .env
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
loadEnv({ path: path.join(projectRoot, ".env") });

const DEPLOY_GAS_LIMIT = 4_000_000n;

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
  const QueueBoost = await ethers.deployContract(
    "QueueBoost",
    [crowdToken, deployer.address],
    { gasLimit: DEPLOY_GAS_LIMIT }
  );
  await QueueBoost.waitForDeployment();
  const addr = await QueueBoost.getAddress();

  console.log("\n--- Update .env ---");
  console.log(`NEXT_PUBLIC_QUEUE_BOOST_ADDRESS="${addr}"`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
