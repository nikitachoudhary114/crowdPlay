import { network } from "hardhat";
import type { ContractFactory, Signer } from "ethers";

const MIN_BALANCE_MATIC = 0.03;

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
  const gasLimit = (estimated * 125n) / 100n; // 25% buffer
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas ?? 30_000_000_000n;
  const costMatic = Number(gasLimit * gasPrice) / 1e18;

  console.log(`  gas estimate: ${estimated} → limit: ${gasLimit} (~${costMatic.toFixed(4)} MATIC)`);

  const contract = await factory.connect(deployer).deploy(...args, { gasLimit });
  await contract.waitForDeployment();
  return contract;
}

async function main() {
  const connection = await network.connect();
  const { ethers } = connection;
  const [deployer] = await ethers.getSigners();

  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceMatic = Number(ethers.formatEther(balance));

  console.log("Deploying with:", deployer.address);
  console.log("Balance:", balanceMatic.toFixed(4), "MATIC\n");

  if (balanceMatic < MIN_BALANCE_MATIC) {
    console.error(
      `Insufficient MATIC. You have ${balanceMatic.toFixed(4)} — get more from:\n` +
        "https://faucet.polygon.technology/ (Polygon Amoy)\n"
    );
    process.exitCode = 1;
    return;
  }

  const existingToken = process.env.NEXT_PUBLIC_CROWD_TOKEN_ADDRESS;
  const skipToken = process.env.DEPLOY_SKIP_TOKEN === "1" && existingToken;

  let crowdTokenAddress: string;

  if (skipToken) {
    crowdTokenAddress = existingToken;
    console.log("Skipping CrowdToken — using existing:", crowdTokenAddress);
  } else {
    console.log("Deploying CrowdToken…");
    const CrowdToken = await ethers.getContractFactory("CrowdToken");
    const token = await deployEstimated(CrowdToken, deployer);
    crowdTokenAddress = await token.getAddress();
    console.log("CrowdToken:", crowdTokenAddress);
  }

  console.log("Deploying QueueBoost…");
  const QueueBoostFactory = await ethers.getContractFactory("QueueBoost");
  const queueBoost = await deployEstimated(QueueBoostFactory, deployer, [
    crowdTokenAddress,
    deployer.address,
  ]);
  const queueBoostAddress = await queueBoost.getAddress();
  console.log("QueueBoost:", queueBoostAddress);

  const skipNft = process.env.DEPLOY_SKIP_NFT === "1" && process.env.NEXT_PUBLIC_NFT_MEMBERSHIP_ADDRESS;
  let membershipAddress = process.env.NEXT_PUBLIC_NFT_MEMBERSHIP_ADDRESS ?? "";

  if (skipNft) {
    console.log("Skipping CrowdMembership — using existing:", membershipAddress);
  } else {
    console.log("Deploying CrowdMembership…");
    const MembershipFactory = await ethers.getContractFactory("CrowdMembership");
    const membership = await deployEstimated(MembershipFactory, deployer);
    membershipAddress = await membership.getAddress();
    console.log("CrowdMembership:", membershipAddress);
  }

  const remaining = Number(ethers.formatEther(await ethers.provider.getBalance(deployer.address)));
  console.log("\nRemaining balance:", remaining.toFixed(4), "MATIC");
  console.log("\n--- Add to .env ---");
  console.log(`NEXT_PUBLIC_CROWD_TOKEN_ADDRESS="${crowdTokenAddress}"`);
  console.log(`NEXT_PUBLIC_QUEUE_BOOST_ADDRESS="${queueBoostAddress}"`);
  console.log(`NEXT_PUBLIC_NFT_MEMBERSHIP_ADDRESS="${membershipAddress}"`);
  console.log(`NEXT_PUBLIC_PLATFORM_TREASURY_ADDRESS="${deployer.address}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
