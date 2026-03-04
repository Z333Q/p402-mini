'use client';

import { useState, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';
import { useP402Store } from '@/lib/store';
import type { PaymentParams, PaymentResult, PaymentError, PaymentErrorType } from '@/lib/types';

const TREASURY = '0xFa772434DCe6ED78831EbC9eeAcbDF42E2A031a6';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

/** EIP-712 domain for USDC on Base (EIP-3009) */
const USDC_DOMAIN = {
  name: 'USD Coin',
  version: '2',
  chainId: 8453,
  verifyingContract: USDC_BASE as `0x${string}`,
} as const;

/** EIP-3009 TransferWithAuthorization type definition */
const TRANSFER_AUTH_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

/** Generate a cryptographically random 32-byte nonce */
function generateNonce(): `0x${string}` {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

/** Classify an error into a known payment error type */
function classifyError(error: Error): PaymentErrorType {
  const msg = error.message.toLowerCase();
  if (msg.includes('insufficient') || msg.includes('balance')) return 'insufficient_funds';
  if (msg.includes('reject') || msg.includes('denied') || msg.includes('cancel')) return 'signature_rejected';
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) return 'network_error';
  if (msg.includes('settle') || msg.includes('verification')) return 'settlement_failed';
  return 'unknown';
}

/**
 * Payment hook implementing EIP-3009 TransferWithAuthorization flow.
 *
 * Flow:
 * 1. User signs an EIP-712 TransferWithAuthorization message via Farcaster wallet
 * 2. Signed authorization is submitted to /api/settle (proxied to /api/v1/router/settle)
 * 3. Backend verifies signature and executes USDC transfer on-chain (gasless for user)
 * 4. On success, session is credited via fundSession with the confirmed txHash
 */
export function usePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<PaymentError | null>(null);
  const walletAddress = useP402Store((s) => s.walletAddress);
  const fundSession = useP402Store((s) => s.fundSession);
  const session = useP402Store((s) => s.session);

  const pay = useCallback(async ({ amountUSD, sessionId }: PaymentParams): Promise<PaymentResult> => {
    if (!walletAddress) {
      return { success: false, error: 'Wallet not connected', errorType: 'unknown' };
    }

    if (!session) {
      return { success: false, error: 'No active session', errorType: 'unknown' };
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Convert USD to USDC atomic units (6 decimals)
      const amountUSDC = Math.floor(amountUSD * 1_000_000).toString();
      const nonce = generateNonce();
      const validBefore = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiry

      const authorization = {
        from: walletAddress as `0x${string}`,
        to: TREASURY as `0x${string}`,
        value: BigInt(amountUSDC),
        validAfter: BigInt(0),
        validBefore: BigInt(validBefore),
        nonce,
      };

      // Create viem walletClient using Farcaster's EIP-1193 provider
      const provider = sdk.wallet?.ethProvider;
      if (!provider) {
        throw new Error('Wallet provider not available. Please open in Farcaster.');
      }

      const walletClient = createWalletClient({
        account: walletAddress as `0x${string}`,
        chain: base,
        transport: custom(provider),
      });

      // Sign the EIP-712 typed data
      const signature = await walletClient.signTypedData({
        account: walletAddress as `0x${string}`,
        domain: USDC_DOMAIN,
        types: TRANSFER_AUTH_TYPES,
        primaryType: 'TransferWithAuthorization',
        message: authorization,
      });

      // Decompose signature into v, r, s components
      const sig = signature.slice(2);
      const r = `0x${sig.slice(0, 64)}`;
      const s = `0x${sig.slice(64, 128)}`;
      const v = parseInt(sig.slice(128, 130), 16);

      // Submit to settlement proxy → backend executes USDC transfer on-chain
      const settleResponse = await fetch('/api/settle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-p402-session': sessionId,
        },
        body: JSON.stringify({
          scheme: 'exact',
          amount: amountUSD.toString(),
          asset: 'USDC',
          payment: {
            scheme: 'exact',
            authorization: {
              from: walletAddress,
              to: TREASURY,
              value: amountUSDC,
              validAfter: 0,
              validBefore,
              nonce,
              v,
              r,
              s,
            },
          },
        }),
      });

      if (!settleResponse.ok) {
        const errorData = await settleResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Settlement failed');
      }

      const settleResult = await settleResponse.json();
      const txHash = settleResult.receipt?.txHash || settleResult.transaction;

      // Credit the session budget with the confirmed payment
      await fundSession(amountUSD.toString(), txHash);

      return { success: true, txHash };
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Unknown payment error');
      console.error('Payment failed:', err);

      const errorType = classifyError(err);
      setError({ type: errorType, message: err.message });

      return { success: false, error: err.message, errorType };
    } finally {
      setIsProcessing(false);
    }
  }, [walletAddress, fundSession, session]);

  return {
    pay,
    isProcessing,
    error,
    clearError: useCallback(() => setError(null), []),
  };
}
