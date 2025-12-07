import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN, setProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { type Counter } from "../idl/counter";
import IDL from "../idl/counter.json";

// Counter account data structure
interface CounterAccount {
    count: bigint;
    authority: PublicKey;
}

/**
 * Hook to interact with the Counter program on Solana.
 * Each user has their own counter derived from their public key (PDA).
 * Provides real-time updates via WebSocket subscriptions.
 */
export function useCounterProgram() {
    const { connection } = useConnection();
    const wallet = useWallet();

    const [counterPubkey, setCounterPubkey] = useState<PublicKey | null>(null);
    const [counterAccount, setCounterAccount] = useState<CounterAccount | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAccountChecked, setIsAccountChecked] = useState(false);
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

    // Derive PDA from wallet public key
    const derivePDA = useCallback((authority: PublicKey) => {
        const [pda] = PublicKey.findProgramAddressSync(
            [authority.toBuffer()],
            new PublicKey(IDL.address)
        );
        return pda;
    }, []);

    // Auto-derive counter PDA when wallet connects
    useEffect(() => {
        if (wallet.publicKey) {
            const pda = derivePDA(wallet.publicKey);
            setCounterPubkey(pda);
        } else {
            setCounterPubkey(null);
        }
    }, [wallet.publicKey, derivePDA]);

    // Fetch counter account data
    const fetchCounterAccount = useCallback(async () => {
        if (!program || !counterPubkey) {
            setCounterAccount(null);
            setIsAccountChecked(false);
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
            // This is expected when the counter hasn't been initialized yet
            console.debug("Counter account not found (this is normal for new wallets):", err);
            setCounterAccount(null);
            // Only set error for unexpected errors, not "account does not exist"
            if (err instanceof Error && !err.message.includes("Account does not exist") && !err.message.includes("could not find account")) {
                setError(err.message);
            }
        } finally {
            setIsAccountChecked(true);
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

    // Initialize a new counter (uses PDA derived from wallet)
    const initialize = useCallback(async (): Promise<string> => {
        if (!program || !wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        setIsLoading(true);
        setError(null);

        try {
            const tx = await program.methods
                .initialize()
                .accounts({
                    authority: wallet.publicKey,
                })
                .rpc();

            // PDA is already set from wallet connection
            await fetchCounterAccount();
            return tx;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to initialize counter";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [program, wallet.publicKey, fetchCounterAccount]);

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
                    authority: wallet.publicKey,
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
                    authority: wallet.publicKey,
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
                    authority: wallet.publicKey,
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
        isAccountChecked,
        error,
        initialize,
        increment,
        decrement,
        set,
        refetch: fetchCounterAccount,
    };
}
