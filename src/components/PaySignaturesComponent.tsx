"use client";
import React from "react";

// Wagmi configuration and utilities for wallet interactions
import { config } from "@/config/index";
import { getWalletClient, readContract } from "@wagmi/core";

// Custom UI components for form inputs and displays
import {
  TitleAndLink,
  NumberInputWithGenerator,
  AddressInputField,
  PrioritySelector,
  ExecutorSelector,
  DataDisplayWithClear,
  HelperInfo,
} from "@/components/InputsAndModules";

// Utility functions for wallet and transaction handling
import { getAccountWithRetry } from "@/utils/getAccountWithRetry";

// EVVM library for creating and handling signatures
import {
  EVVMSignatureBuilder,
  PayInputData,
  EvvmABI,
} from "@evvm/viem-signature-library";

// Function to execute the payment transaction
import { executePay } from "@/utils/useEVVMTransactionExecuter";

// Component props interface - defines what data this component needs
interface PaySignaturesComponentProps {
  evvmID: string;        // The EVVM system identifier
  evvmAddress: string;   // The smart contract address
  explanation?: number;  // Controls which UI elements are shown (1=basic, 2=medium, 3=advanced)
}

export const PaySignaturesComponent = ({
  evvmID,
  evvmAddress,
  explanation = 3, // Default to showing all options
}: PaySignaturesComponentProps) => {
  
  // State variables to manage form behavior and data
  const [isUsingUsernames, setIsUsingUsernames] = React.useState(false); // Toggle between address/username input
  const [isUsingExecutor, setIsUsingExecutor] = React.useState(false);   // Whether to use a custom executor
  const [priority, setPriority] = React.useState("low");                 // Transaction priority level
  const [dataToGet, setDataToGet] = React.useState<PayInputData | null>(null); // Stores the created signature data
  const [syncNonce, setSyncNonce] = React.useState<number | null>(null);        // Auto-fetched nonce value

  // Function to automatically fetch the next nonce from the blockchain
  const readNextSyncNonce = async () => {
    // Get the current wallet connection
    const walletData = await getAccountWithRetry(config);
    if (!walletData) return;
    
    // Read the next nonce from the smart contract
    readContract(config, {
      abi: EvvmABI,
      address: evvmAddress as `0x${string}`,
      functionName: "getNextCurrentSyncNonce",
      args: [walletData.address as `0x${string}`],
    }).then((nonce) => {
      setSyncNonce(Number(nonce));
    });
  };

  // Main function to create a cryptographic signature for the payment
  const makeSig = async () => {
    // Get the current wallet connection
    const walletData = await getAccountWithRetry(config);
    if (!walletData) return;

    // Helper function to get values from form inputs
    const getValue = (id: string) =>
      (document.getElementById(id) as HTMLInputElement).value;

    // Collect all form data into an object
    const formData = {
      evvmID: evvmID,
      // Use manual nonce if in advanced mode, otherwise use auto-fetched nonce
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
        : "0x0000000000000000000000000000000000000000", // Use zero address if no executor
      amount: getValue("amountTokenInput_Pay"),
      priorityFee: getValue("priorityFeeInput_Pay"),
    };

    try {
      // Create the signature using the EVVM library
      const walletClient = await getWalletClient(config);
      const signatureBuilder = new (EVVMSignatureBuilder as any)(
        walletClient,
        walletData
      );

      // Generate the actual signature with all parameters
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

      // Store the complete payment data for execution
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

  // Function to execute the payment transaction on the blockchain
  const executePayment = async () => {
    // Check if we have signature data to execute
    if (!dataToGet) {
      console.error("No data to execute payment");
      return;
    }

    // Check if EVVM contract address is provided
    if (!evvmAddress) {
      console.error("EVVM address is not provided");
      return;
    }

    // Execute the payment using the utility function
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
      {/* Page title with documentation link */}
      <TitleAndLink
        title="Single payment"
        link="https://www.evvm.info/docs/SignatureStructures/EVVM/SinglePaymentSignatureStructure"
      />
      <br />

      {/* Note: EVVM ID and Address are now passed as props from parent component */}

      {/* Section 1: Recipient Configuration */}
      <div style={{ marginBottom: "1rem" }}>
        <p>
          To:{" "}
          {/* Toggle between address and username input */}
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
          {/* Dynamic input field based on selection */}
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

      {/* Section 2: Token Configuration */}
      <AddressInputField
        label="Token address"
        inputId="tokenAddress_Pay"
        placeholder="Enter token address"
      />

      {/* Section 3: Payment Amount and Fees */}
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

      {/* Section 4: Advanced Options (only shown in advanced mode) */}
      {explanation >= 3 && (
        <ExecutorSelector
          inputId="executorInput_Pay"
          placeholder="Enter executor address"
          onExecutorToggle={setIsUsingExecutor}
          isUsingExecutor={isUsingExecutor}
        />
      )}

      {/* Section 5: Priority and Nonce Configuration */}

      {/* Different UI based on explanation level */}
      {explanation >= 2 ? (
        /* Advanced mode: Manual priority and nonce configuration */
        <div>
          <PrioritySelector onPriorityChange={setPriority} />

          {/* Nonce input with optional random generator */}
          <NumberInputWithGenerator
            label="Nonce"
            inputId="nonceInput_Pay"
            placeholder="Enter nonce"
            showRandomBtn={priority !== "low"}
          />

          {/* Help information for low priority transactions */}
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
        /* Simple mode: Automatic nonce handling */
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

      {/* Section 6: Signature Creation */}
      <button
        onClick={makeSig}
        style={{
          padding: "0.5rem",
          marginTop: "1rem",
        }}
      >
        Create signature
      </button>

      {/* Section 7: Results and Execution */}
      <DataDisplayWithClear
        dataToGet={dataToGet}
        onClear={() => setDataToGet(null)}
        onExecute={executePayment}
      />
    </div>
  );
};
