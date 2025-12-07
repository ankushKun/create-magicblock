import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN, setProvider } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { type Counter } from "../idl/counter";
import IDL from "../idl/counter.json";

// Counter account data structure
interface CounterAccount {
    count: bigint;
    authority: PublicKey;
}

// Local storage key for persisting counter pubkey
const COUNTER_PUBKEY_STORAGE_KEY = "counter-pubkey";

/**
 * Hook to interact with the Counter program on Solana.
 * Provides real-time updates via WebSocket subscriptions.
 */
export function useCounterProgram() {
    const { connection } = useConnection();
    const wallet = useWallet();

    const [counterPubkey, setCounterPubkeyState] = useState<PublicKey | null>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(COUNTER_PUBKEY_STORAGE_KEY);
            if (stored) {
                try {
                    return new PublicKey(stored);
                } catch {
                    // Invalid pubkey, ignore
                }
            }
        }
        return null;
    });

    const [counterAccount, setCounterAccount] = useState<CounterAccount | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Create Anchor provider and program
    const program = useMemo(() => {
        if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
            return null;
        }

        const provider = new AnchorProvider(
            connection,
            {
                publicKey: wallet.publicKey,
                signTransaction: wallet.signTransaction,
                signAllTransactions: wallet.signAllTransactions,
            },
            { commitment: "confirmed" }
        );

        setProvider(provider);

        return new Program<Counter>(IDL as Counter, provider);
    }, [connection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

    // Persist counter pubkey to localStorage
    const setCounterPubkey = useCallback((pubkey: PublicKey | null) => {
        setCounterPubkeyState(pubkey);
        if (typeof window !== "undefined") {
            if (pubkey) {
                localStorage.setItem(COUNTER_PUBKEY_STORAGE_KEY, pubkey.toBase58());
            } else {
                localStorage.removeItem(COUNTER_PUBKEY_STORAGE_KEY);
            }
        }
    }, []);

    // Fetch counter account data
    const fetchCounterAccount = useCallback(async () => {
        if (!program || !counterPubkey) {
            setCounterAccount(null);
            return;
        }

        try {
            const account = await program.account.counter.fetch(counterPubkey);
            setCounterAccount({
                count: BigInt(account.count.toString()),
                authority: account.authority,
            });
            setError(null);
        } catch (err) {
            console.error("Failed to fetch counter account:", err);
            setCounterAccount(null);
            if (err instanceof Error && !err.message.includes("Account does not exist")) {
                setError(err.message);
            }
        }
    }, [program, counterPubkey]);

    // Subscribe to account changes via WebSocket
    useEffect(() => {
        if (!program || !counterPubkey) {
            return;
        }

        fetchCounterAccount();

        const subscriptionId = connection.onAccountChange(
            counterPubkey,
            async (accountInfo) => {
                try {
                    const decoded = program.coder.accounts.decode("counter", accountInfo.data);
                    setCounterAccount({
                        count: BigInt(decoded.count.toString()),
                        authority: decoded.authority,
                    });
                    setError(null);
                } catch (err) {
                    console.error("Failed to decode account data:", err);
                }
            },
            "confirmed"
        );

        return () => {
            connection.removeAccountChangeListener(subscriptionId);
        };
    }, [program, counterPubkey, connection, fetchCounterAccount]);

    // Initialize a new counter
    const initialize = useCallback(async (): Promise<string> => {
        if (!program || !wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        setIsLoading(true);
        setError(null);

        try {
            const counterKeypair = Keypair.generate();

            const tx = await program.methods
                .initialize()
                .accounts({
                    counter: counterKeypair.publicKey,
                    authority: wallet.publicKey,
                })
                .signers([counterKeypair])
                .rpc();

            setCounterPubkey(counterKeypair.publicKey);
            return tx;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to initialize counter";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [program, wallet.publicKey, setCounterPubkey]);

    // Increment the counter
    const increment = useCallback(async (): Promise<string> => {
        if (!program || !wallet.publicKey || !counterPubkey) {
            throw new Error("Counter not initialized");
        }

        setIsLoading(true);
        setError(null);

        try {
            const tx = await program.methods
                .increment()
                .accounts({
                    counter: counterPubkey,
                })
                .rpc();

            return tx;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to increment counter";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [program, wallet.publicKey, counterPubkey]);

    // Decrement the counter
    const decrement = useCallback(async (): Promise<string> => {
        if (!program || !wallet.publicKey || !counterPubkey) {
            throw new Error("Counter not initialized");
        }

        setIsLoading(true);
        setError(null);

        try {
            const tx = await program.methods
                .decrement()
                .accounts({
                    counter: counterPubkey,
                })
                .rpc();

            return tx;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to decrement counter";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [program, wallet.publicKey, counterPubkey]);

    // Set the counter to a specific value
    const set = useCallback(async (value: number): Promise<string> => {
        if (!program || !wallet.publicKey || !counterPubkey) {
            throw new Error("Counter not initialized");
        }

        setIsLoading(true);
        setError(null);

        try {
            const tx = await program.methods
                .set(new BN(value))
                .accounts({
                    counter: counterPubkey,
                })
                .rpc();

            return tx;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to set counter";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [program, wallet.publicKey, counterPubkey]);

    return {
        program,
        counterAccount,
        counterPubkey,
        isLoading,
        error,
        initialize,
        increment,
        decrement,
        set,
        setCounterPubkey,
        refetch: fetchCounterAccount,
    };
}
