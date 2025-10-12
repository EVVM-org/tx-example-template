"use client";
// import { cookieStorage, createStorage, http } from '@wagmi/core'
import { ConnectButton } from "@/components/ConnectButton";
import { InfoList } from "@/components/InfoList";
import { ActionButtonList } from "@/components/ActionButtonList";
import Image from 'next/image';
import { PaySignaturesComponent } from "@/components/PaySignaturesComponent";
import { useState } from "react";
import { config, networks } from "@/config/index";
import { readContracts, switchChain } from "@wagmi/core";
import Evvm from "@/constants/abi/Evvm.json";

export default function Home() {
  const [menu, setMenu] = useState("faucet");
  const [evvmID, setEvvmID] = useState("");
  const [evvmAddress, setEvvmAddress] = useState("");
  const [nameserviceAddress, setNameserviceAddress] = useState("");
  const [stakingAddress, setStakingAddress] = useState("");
  const [loadingIDs, setLoadingIDs] = useState(false);
  // Map selector value to network object
  const networkOptions = [
    { value: "sepolia", label: "Sepolia" },
    { value: "arbitrumSepolia", label: "Arbitrum Sepolia" },
    { value: "hederaTestnet", label: "Hedera Testnet" },
  ];
  const [network, setNetwork] = useState("sepolia");

  const handleNetworkChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setNetwork(value);
    // Find the chainId for the selected network
    let chainId: number | undefined;
    if (value === "sepolia") {
      const id = networks.find(
        (n) =>
          n.name?.toLowerCase().includes("sepolia") &&
          !n.name?.toLowerCase().includes("arbitrum")
      )?.id;
      chainId = typeof id === "string" ? parseInt(id) : id;
    } else if (value === "arbitrumSepolia") {
      const id = networks.find((n) =>
        n.name?.toLowerCase().includes("arbitrum")
      )?.id;
      chainId = typeof id === "string" ? parseInt(id) : id;
    } else if (value === "hederaTestnet") {
      const id = networks.find((n) =>
        n.name?.toLowerCase().includes("hedera")
      )?.id;
      chainId = typeof id === "string" ? parseInt(id) : id;
    }
    if (typeof chainId === "number" && !isNaN(chainId)) {
      try {
        await switchChain(config, { chainId });
      } catch (err) {
        // Optionally show error to user
        // eslint-disable-next-line no-console
        console.error("Failed to switch chain:", err);
      }
    }
  };

  const fetchEvvmSummary = async () => {
    if (!evvmAddress) {
      alert("Please enter a valid EVVM address");
      return;
    }
    setLoadingIDs(true);
    try {
      const contracts = [
        {
          abi: Evvm.abi as any,
          address: evvmAddress as `0x${string}`,
          functionName: "getEvvmID",
          args: [],
        },
        {
          abi: Evvm.abi as any,
          address: evvmAddress as `0x${string}`,
          functionName: "getStakingContractAddress",
          args: [],
        },
        {
          abi: Evvm.abi as any,
          address: evvmAddress as `0x${string}`,
          functionName: "getNameServiceAddress",
          args: [],
        },
      ];
      const results = await readContracts(config, { contracts });
      const [evvmIDResult, stakingAddrResult, nsAddrResult] = results;
      setEvvmID(
        evvmIDResult?.result !== undefined && evvmIDResult?.result !== null
          ? String(evvmIDResult.result)
          : ""
      );
      setStakingAddress(
        typeof stakingAddrResult?.result === "string"
          ? stakingAddrResult.result
          : ""
      );
      setNameserviceAddress(
        typeof nsAddrResult?.result === "string" ? nsAddrResult.result : ""
      );
    } catch (err) {
      setEvvmID("");
      setStakingAddress("");
      setNameserviceAddress("");
      alert(
        "Could not fetch data (evvmID, stakingAddress, NameService address)"
      );
    } finally {
      setLoadingIDs(false);
    }
  };


  
  return (
    <div className={"pages"}>
      <Image src="/reown.svg" alt="Reown" width={150} height={150} priority />
      <h1>AppKit Wagmi Next.js App Router Example</h1>

      <ConnectButton />
      <ActionButtonList />
      <div className="advice">
        <p>
          This projectId only works on localhost. <br/>Go to <a href="https://dashboard.reown.com" target="_blank" className="link-button" rel="Reown Dashboard">Reown Dashboard</a> to get your own.
        </p>
      </div>
      <InfoList />
      {evvmID && stakingAddress && nameserviceAddress ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              background: "#f8fafc",
              border: "1.5px solid #d1d5db",
              borderRadius: 10,
              padding: "1rem 1.5rem",
              minWidth: 0,
              boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{ fontSize: 15, color: "#444", fontFamily: "monospace" }}
            >
              <strong>evvmID:</strong> {String(evvmID)}
            </div>
            <div
              style={{ fontSize: 15, color: "#444", fontFamily: "monospace" }}
            >
              <strong>evvm:</strong> {evvmAddress}
            </div>
            <div
              style={{ fontSize: 15, color: "#444", fontFamily: "monospace" }}
            >
              <strong>staking:</strong> {stakingAddress}
            </div>
            <div
              style={{ fontSize: 15, color: "#444", fontFamily: "monospace" }}
            >
              <strong>nameService:</strong> {nameserviceAddress}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="EVVM Address"
              value={evvmAddress}
              onChange={(e) => setEvvmAddress(e.target.value)}
              style={{
                padding: "0.75rem 1rem",
                borderRadius: 8,
                background: "#f9fafb",
                color: "#222",
                border: "1.5px solid #d1d5db",
                width: 420,
                fontFamily: "monospace",
                fontSize: 16,
                boxSizing: "border-box",
                outline: "none",
                transition: "border 0.2s",
              }}
            />
            <select
              style={{
                padding: "0.7rem 1.2rem",
                borderRadius: 8,
                border: "1.5px solid #d1d5db",
                background: "#f9fafb",
                color: "#222",
                fontWeight: 500,
                fontSize: 15,
                minWidth: 180,
                marginRight: 8,
                boxShadow: "0 1px 4px 0 rgba(0,0,0,0.03)",
                outline: "none",
                transition: "border 0.2s",
                cursor: "pointer",
              }}
              value={network}
              onChange={handleNetworkChange}
            >
              {networkOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={fetchEvvmSummary}
              style={{
                padding: "0.7rem 1.5rem",
                borderRadius: 8,
                border: "1.5px solid #d1d5db",
                background: loadingIDs ? "#e5e7eb" : "#f3f4f6",
                color: "#222",
                fontWeight: 600,
                fontSize: 15,
                cursor: loadingIDs ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                minWidth: 140,
              }}
              disabled={loadingIDs}
            >
              {loadingIDs ? "Loading..." : "Use this EVVM"}
            </button>
          </div>
        )}
      <PaySignaturesComponent evvmID={evvmID} evvmAddress={evvmAddress} />
    </div>
  );
}