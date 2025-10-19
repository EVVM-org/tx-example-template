"use client";
// import { cookieStorage, createStorage, http } from '@wagmi/core'
import { ConnectButton } from "@/components/ConnectButton";
import Image from "next/image";
import { PaySignaturesComponent } from "@/components/PaySignaturesComponent";
import { useState } from "react";
import { config, networks } from "@/config/index";
import { readContracts, switchChain } from "@wagmi/core";
import {
  EvvmABI,
} from "@evvm/viem-signature-library";

export default function Home() {
  const [evvmID, setEvvmID] = useState("");
  const [evvmAddress, setEvvmAddress] = useState("");
  const [nameserviceAddress, setNameserviceAddress] = useState("");
  const [stakingAddress, setStakingAddress] = useState("");
  const [loadingIDs, setLoadingIDs] = useState(false);
  const [expl, setExpl] = useState<number>(1);
  // Map selector value to network object
  const networkOptions = [
    { value: "sepolia", label: "Sepolia" },
    { value: "arbitrumSepolia", label: "Arbitrum Sepolia" },
    { value: "hederaTestnet", label: "Hedera Testnet" },
  ];
  const [network, setNetwork] = useState("sepolia");
  // Estado para forzar reinicio de PaySignaturesComponent
  const [resetKey, setResetKey] = useState<number>(0);

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
          abi: EvvmABI as any,
          address: evvmAddress as `0x${string}`,
          functionName: "getEvvmID",
          args: [],
        },
        {
          abi: EvvmABI as any,
          address: evvmAddress as `0x${string}`,
          functionName: "getStakingContractAddress",
          args: [],
        },
        {
          abi: EvvmABI as any,
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
      <header className="evvm-header">
        <div className="evvm-header-left">
          <a
            href="https://www.evvm.info/docs/intro"
            style={{ display: "flex", alignItems: "center" }}
          >
            <Image
              src="/evvm.svg"
              alt="EVVM Logo"
              width={60}
              height={90}
              priority
            />
          </a>
        </div>
        <div className="evvm-header-right">
          <div className="evvm-header-connect">
            <ConnectButton />
          </div>
        </div>
      </header>

      {evvmID && stakingAddress && nameserviceAddress ? (
        <div className="evvm-summary">
          <div className="evvm-summary-item">
            <strong>evvmID:</strong> {String(evvmID)}
          </div>
          <div className="evvm-summary-item">
            <strong>evvm:</strong> {evvmAddress}
          </div>
          <div className="evvm-summary-item">
            <strong>staking:</strong> {stakingAddress}
          </div>
          <div className="evvm-summary-item">
            <strong>nameService:</strong> {nameserviceAddress}
          </div>
        </div>
      ) : (
        <div className="evvm-input-row">
          <input
            type="text"
            placeholder="EVVM Address"
            value={evvmAddress}
            onChange={(e) => setEvvmAddress(e.target.value)}
            className="evvm-address-input"
          />
          <select
            className="evvm-network-select"
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
            className="evvm-summary-btn"
            disabled={loadingIDs}
            style={
              loadingIDs ? { background: "#e5e7eb", cursor: "not-allowed" } : {}
            }
          >
            {loadingIDs ? "Loading..." : "Use this EVVM"}
          </button>
        </div>
      )}

      {/* Explanation selector */}
      <div style={{ margin: "20px 0" }}>
        <select
          className="evvm-network-select"
          value={expl}
          onChange={(e) => {
            setExpl(Number(e.target.value));
            // Limpiar dataToGet en el hijo PaySignaturesComponent usando una key
            setResetKey((prev) => prev + 1);
          }}
          style={{ padding: "0.5rem 1rem", borderRadius: 6, fontSize: 15 }}
        >
          <option value={1}>payment explanation</option>
          <option value={2}>nonces explanation</option>
          <option value={3}>executor explanation</option>
        </select>
      </div>
      <PaySignaturesComponent
        key={resetKey}
        evvmID={evvmID}
        evvmAddress={evvmAddress}
        explanation={expl}
      />
    </div>
  );
}
