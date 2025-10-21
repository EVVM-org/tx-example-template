"use client";
import React from "react";
import { config } from "@/config/index";
import { getWalletClient, readContract } from "@wagmi/core";
import {
  TitleAndLink,
  NumberInputWithGenerator,
  AddressInputField,
  PrioritySelector,
  ExecutorSelector,
  DataDisplayWithClear,
  HelperInfo,
} from "@/components/InputsAndModules";

import { getAccountWithRetry } from "@/utils/getAccountWithRetry";

import {
  EVVMSignatureBuilder,
  PayInputData,
  EvvmABI,
} from "@evvm/viem-signature-library";

import { executePay } from "@/utils/useEVVMTransactionExecuter";

interface PaySignaturesComponentProps {
  evvmID: string;
  evvmAddress: string;
  explanation?: number; // Optional prop to control explanation display
}

export const PaySignaturesComponent = ({
  evvmID,
  evvmAddress,
  explanation = 3,
}: PaySignaturesComponentProps) => {
  const [isUsingUsernames, setIsUsingUsernames] = React.useState(false);
  const [isUsingExecutor, setIsUsingExecutor] = React.useState(false);
  const [priority, setPriority] = React.useState("low");
  const [dataToGet, setDataToGet] = React.useState<PayInputData | null>(null);
  const [syncNonce, setSyncNonce] = React.useState<number | null>(null);

  const readNextSyncNonce = async () => {
    const walletData = await getAccountWithRetry(config);
    if (!walletData) return;
    readContract(config, {
      abi: EvvmABI,
      address: evvmAddress as `0x${string}`,
      functionName: "getNextCurrentSyncNonce",
      args: [walletData.address as `0x${string}`],
    }).then((nonce) => {
      setSyncNonce(Number(nonce));
    });
  };

  const makeSig = async () => {
    const walletData = await getAccountWithRetry(config);
    if (!walletData) return;

    const getValue = (id: string) =>
      (document.getElementById(id) as HTMLInputElement).value;

    const formData = {
      evvmID: evvmID,
      nonce:
        explanation >= 2
          ? getValue("nonceInput_Pay")
          : syncNonce !== null
          ? syncNonce
          : 0,
      tokenAddress: getValue("tokenAddress_Pay"),
      to: getValue(isUsingUsernames ? "toUsername" : "toAddress"),
      executor: isUsingExecutor
        ? getValue("executorInput_Pay")
        : "0x0000000000000000000000000000000000000000",
      amount: getValue("amountTokenInput_Pay"),
      priorityFee: getValue("priorityFeeInput_Pay"),
    };

    try {
      const walletClient = await getWalletClient(config);
      const signatureBuilder = new (EVVMSignatureBuilder as any)(
        walletClient,
        walletData
      );

      const signature = await signatureBuilder.signPay(
        BigInt(formData.evvmID),
        formData.to,
        formData.tokenAddress as `0x${string}`,
        BigInt(formData.amount),
        BigInt(formData.priorityFee),
        BigInt(formData.nonce),
        priority === "high",
        formData.executor as `0x${string}`
      );

      setDataToGet({
        from: walletData.address as `0x${string}`,
        to_address: (formData.to.startsWith("0x")
          ? formData.to
          : "0x0000000000000000000000000000000000000000") as `0x${string}`,
        to_identity: formData.to.startsWith("0x") ? "" : formData.to,
        token: formData.tokenAddress as `0x${string}`,
        amount: BigInt(formData.amount),
        priorityFee: BigInt(formData.priorityFee),
        nonce: BigInt(formData.nonce),
        priority: priority === "high",
        executor: formData.executor,
        signature,
      });
    } catch (error) {
      console.error("Error creating signature:", error);
    }
  };

  const executePayment = async () => {
    if (!dataToGet) {
      console.error("No data to execute payment");
      return;
    }

    if (!evvmAddress) {
      console.error("EVVM address is not provided");
      return;
    }

    executePay(dataToGet, evvmAddress as `0x${string}`)
      .then(() => {
        console.log("Payment executed successfully");
      })
      .catch((error) => {
        console.error("Error executing payment:", error);
      });
  };

  return (
    <div className="flex flex-1 flex-col justify-center items-center">
      <TitleAndLink
        title="Single payment"
        link="https://www.evvm.info/docs/SignatureStructures/EVVM/SinglePaymentSignatureStructure"
      />
      <br />

      {/* EVVM ID and Address are now passed as props */}

      {/* Recipient configuration section */}
      <div style={{ marginBottom: "1rem" }}>
        <p>
          To:{" "}
          <select
            style={{
              color: "black",
              backgroundColor: "white",
              height: "2rem",
              width: "6rem",
            }}
            onChange={(e) => setIsUsingUsernames(e.target.value === "true")}
          >
            <option value="false">Address</option>
            <option value="true">Username</option>
          </select>
          <input
            type="text"
            placeholder={isUsingUsernames ? "Enter username" : "Enter address"}
            id={isUsingUsernames ? "toUsername" : "toAddress"}
            style={{
              color: "black",
              backgroundColor: "white",
              height: "2rem",
              width: "25rem",
              marginLeft: "0.5rem",
            }}
          />
        </p>
      </div>

      <AddressInputField
        label="Token address"
        inputId="tokenAddress_Pay"
        placeholder="Enter token address"
      />

      {/* Basic input fields */}
      {[
        { label: "Amount", id: "amountTokenInput_Pay", type: "number" },
        { label: "Priority fee", id: "priorityFeeInput_Pay", type: "number" },
      ].map(({ label, id, type }) => (
        <div key={id} style={{ marginBottom: "1rem" }}>
          <p>{label}</p>
          <input
            type={type}
            placeholder={`Enter ${label.toLowerCase()}`}
            id={id}
            style={{
              color: "black",
              backgroundColor: "white",
              height: "2rem",
              width: "25rem",
            }}
          />
        </div>
      ))}

      {/* Executor configuration */}
      {explanation >= 3 && (
        <ExecutorSelector
          inputId="executorInput_Pay"
          placeholder="Enter executor address"
          onExecutorToggle={setIsUsingExecutor}
          isUsingExecutor={isUsingExecutor}
        />
      )}

      {/* Priority configuration */}

      {explanation >= 2 ? (
        <div>
          <PrioritySelector onPriorityChange={setPriority} />

          {/* Nonce section with automatic generator */}

          <NumberInputWithGenerator
            label="Nonce"
            inputId="nonceInput_Pay"
            placeholder="Enter nonce"
            showRandomBtn={priority !== "low"}
          />

          <div>
            {priority === "low" && (
              <HelperInfo label="How to find my sync nonce?">
                <div>
                  You can retrieve your next sync nonce from the EVVM contract
                  using the <code>getNextCurrentSyncNonce</code> function.
                </div>
              </HelperInfo>
            )}
          </div>
        </div>
      ) : (
        <div>
          {syncNonce !== null ? (
            <div style={{ marginTop: "0.5rem" }}>
              Next sync nonce: {syncNonce}
            </div>
          ) : (
            <button
              onClick={readNextSyncNonce}
              style={{
                padding: "0.5rem",
                marginTop: "1rem",
              }}
            >
              Find next sync nonce
            </button>
          )}
        </div>
      )}

      {/* Create signature button */}
      <button
        onClick={makeSig}
        style={{
          padding: "0.5rem",
          marginTop: "1rem",
        }}
      >
        Create signature
      </button>

      {/* Results section */}
      <DataDisplayWithClear
        dataToGet={dataToGet}
        onClear={() => setDataToGet(null)}
        onExecute={executePayment}
      />
    </div>
  );
};
