import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

const contractsDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(contractsDir, "..");

// Hardhat does not load .env automatically (unlike Next.js)
loadEnv({ path: path.join(projectRoot, ".env") });
export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "cancun",
      optimizer: { enabled: true, runs: 200 },
    },
  },
  paths: {
    sources: contractsDir,
    cache: path.join(contractsDir, "cache"),
    artifacts: path.join(contractsDir, "artifacts"),
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
    },
    polygonAmoy: {
      type: "http",
      chainType: "l1",
      url: configVariable("POLYGON_AMOY_RPC_URL"),
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
      chainId: 80002,
      timeout: 120_000,
    },
  },
});
