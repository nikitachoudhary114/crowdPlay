"use client";

import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { metaMaskWallet, injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, createConfig, http } from "wagmi";
import { polygonAmoy } from "viem/chains";
import "@rainbow-me/rainbowkit/styles.css";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "crowdplay-demo";

const connectors = connectorsForWallets(
  [{ groupName: "Recommended", wallets: [metaMaskWallet, injectedWallet] }],
  { appName: "CrowdPlay", projectId }
);

const config = createConfig({
  chains: [polygonAmoy],
  connectors,
  transports: { [polygonAmoy.id]: http() },
  ssr: true,
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider theme={darkTheme({ accentColor: "#7c3aed" })} modalSize="compact">
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
