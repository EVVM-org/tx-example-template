/**
 * constructMessage
 *
 * Utility functions to construct message strings for EVVM, NameService, and Staking signatures.
 * Each function builds a formatted message for a specific contract action, encoding all required parameters.
 * Used for signing and verifying transactions.
 */

/**
 * Construct a message for payMateStaking_async/sync or payNoMateStaking_async/sync in EVVM
 * @param to address of the receiver
 * @param tokenAddress address of the token
 * @param amount amount of the token
 * @param priorityFee priority fee of the transaction
 * @param nonce nonce of the transaction
 * @param priorityFlag priority of the transaction
 * @param executor executor of the transaction
 * @returns message for payMateStaking_async/sync or payNoMateStaking_async/sync
 */
function buildMessageSignedForPay(
  evvmID: bigint,
  to: `0x${string}` | string,
  tokenAddress: `0x${string}`,
  amount: bigint,
  priorityFee: bigint,
  nonce: bigint,
  priorityFlag: boolean,
  executor: `0x${string}`
): string {
  const inputs: string =
    `${to.startsWith("0x") ? to.toLowerCase() : to},` +
    `${tokenAddress.toLowerCase()},` +
    `${amount.toString()},` +
    `${priorityFee.toString()},` +
    `${nonce.toString()},` +
    `${priorityFlag ? "true" : "false"},` +
    `${executor.toLowerCase()}`;

  return basicMessageBuilder(evvmID.toString(), "pay", inputs);
}

function basicMessageBuilder(
  evvmID: string,
  functionName: string,
  inputs: string
): string {
  return evvmID + "," + functionName + "," + inputs;
}

export { buildMessageSignedForPay, basicMessageBuilder };
