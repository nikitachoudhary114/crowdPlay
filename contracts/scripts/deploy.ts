import { network } from "hardhat";

const MIN_BALANCE_MATIC = 0.05;
const DEPLOY_GAS_LIMIT = 4_000_000n;

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
      `Insufficient MATIC. You have ${balanceMatic.toFixed(4)} but need at least ~${MIN_BALANCE_MATIC} MATIC for all 3 contracts.\n` +
        "Get free test MATIC: https://faucet.polygon.technology/ (select Polygon Amoy)\n"
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
    const CrowdToken = await ethers.deployContract("CrowdToken", [], { gasLimit: DEPLOY_GAS_LIMIT });
    await CrowdToken.waitForDeployment();
    crowdTokenAddress = await CrowdToken.getAddress();
    console.log("CrowdToken:", crowdTokenAddress);
  }

  console.log("Deploying QueueBoost…");
  const QueueBoost = await ethers.deployContract(
    "QueueBoost",
    [crowdTokenAddress, deployer.address],
    { gasLimit: DEPLOY_GAS_LIMIT }
  );
  await QueueBoost.waitForDeployment();
  const queueBoostAddress = await QueueBoost.getAddress();
  console.log("QueueBoost:", queueBoostAddress);

  const skipNft = process.env.DEPLOY_SKIP_NFT === "1" && process.env.NEXT_PUBLIC_NFT_MEMBERSHIP_ADDRESS;
  let membershipAddress = process.env.NEXT_PUBLIC_NFT_MEMBERSHIP_ADDRESS ?? "";

  if (skipNft) {
    console.log("Skipping CrowdMembership — using existing:", membershipAddress);
  } else {
    console.log("Deploying CrowdMembership…");
    const CrowdMembership = await ethers.deployContract("CrowdMembership", [], {
      gasLimit: DEPLOY_GAS_LIMIT,
    });
    await CrowdMembership.waitForDeployment();
    membershipAddress = await CrowdMembership.getAddress();
    console.log("CrowdMembership:", membershipAddress);
  }

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
