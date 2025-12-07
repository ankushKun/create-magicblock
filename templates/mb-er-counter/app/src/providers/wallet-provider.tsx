import { useMemo, type ReactNode } from "react";
import {
    ConnectionProvider,
    WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

interface WalletProviderProps {
    children: ReactNode;
    endpoint?: string;
}

/**
 * Wallet Provider that wraps the Solana wallet adapter providers.
 * Uses WebSocket connections by default through the wss:// protocol.
 * 
 * The wallet adapter will automatically detect all Wallet Standard compliant
 * wallets (Phantom, Solflare, Backpack, etc.) installed in the user's browser.
 */
export function WalletProvider({
    children,
    endpoint = "http://127.0.0.1:8899",
}: WalletProviderProps) {
    // Convert HTTP endpoint to WebSocket endpoint for subscriptions
    const wsEndpoint = useMemo(() => {
        return endpoint.replace("http://", "ws://").replace("https://", "wss://");
    }, [endpoint]);

    // Configuration with WebSocket endpoint for subscriptions
    const config = useMemo(
        () => ({
            wsEndpoint,
            commitment: "confirmed" as const,
        }),
        [wsEndpoint]
    );

    return (
        <ConnectionProvider endpoint={endpoint} config={config}>
            <SolanaWalletProvider wallets={[]} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </SolanaWalletProvider>
        </ConnectionProvider>
    );
}
