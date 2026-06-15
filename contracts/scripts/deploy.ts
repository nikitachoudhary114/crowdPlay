import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC\n");

  const CrowdToken = await ethers.deployContract("CrowdToken");
  await CrowdToken.waitForDeployment();
  const crowdTokenAddress = await CrowdToken.getAddress();
  console.log("CrowdToken:", crowdTokenAddress);

  const QueueBoost = await ethers.deployContract("QueueBoost", [
    crowdTokenAddress,
    deployer.address,
  ]);
  await QueueBoost.waitForDeployment();
  const queueBoostAddress = await QueueBoost.getAddress();
  console.log("QueueBoost:", queueBoostAddress);

  const CrowdMembership = await ethers.deployContract("CrowdMembership");
  await CrowdMembership.waitForDeployment();
  const membershipAddress = await CrowdMembership.getAddress();
  console.log("CrowdMembership:", membershipAddress);

  console.log("\n--- Add to .env ---");
  console.log(`NEXT_PUBLIC_CROWD_TOKEN_ADDRESS="${crowdTokenAddress}"`);
  console.log(`NEXT_PUBLIC_QUEUE_BOOST_ADDRESS="${queueBoostAddress}"`);
  console.log(`NEXT_PUBLIC_NFT_MEMBERSHIP_ADDRESS="${membershipAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
