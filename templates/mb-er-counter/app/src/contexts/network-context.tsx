import {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
    useEffect,
    type ReactNode,
} from "react";
import { createSolanaClient } from "gill";
import { useUpdateSolanaClient } from "@gillsdk/react";
import { Endpoints } from "../config";

export type NetworkType = "localnet" | "devnet";

interface NetworkConfig {
    name: string;
    displayName: string;
    solanaRpc: string;
    solanaWs: string;
    erRpc: string;
    erWs: string;
    color: string;
}

const NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = {
    localnet: {
        name: "localnet",
        displayName: "Localnet",
        solanaRpc: Endpoints.Solana.localnet,
        solanaWs: Endpoints.Solana.localnetWs,
        erRpc: Endpoints.Er.localnet,
        erWs: Endpoints.Er.localnetWs,
        color: "#22c55e", // Green
    },
    devnet: {
        name: "devnet",
        displayName: "Devnet",
        solanaRpc: Endpoints.Solana.devnet,
        solanaWs: Endpoints.Solana.devnetWs,
        erRpc: Endpoints.Er.devnet,
        erWs: Endpoints.Er.devnetWs,
        color: "#eab308", // Yellow
    },
};

interface NetworkContextValue {
    network: NetworkType;
    networkConfig: NetworkConfig;
    setNetwork: (network: NetworkType) => void;
    availableNetworks: NetworkType[];
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

// Get initial network from localStorage or default to devnet
const getInitialNetwork = (): NetworkType => {
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem("solana-network") as NetworkType;
        if (stored && NETWORK_CONFIGS[stored]) {
            return stored;
        }
    }
    return "devnet";
};

interface NetworkProviderProps {
    children: ReactNode;
    defaultNetwork?: NetworkType;
}

/**
 * Inner component that uses the useUpdateSolanaClient hook.
 * This must be rendered inside SolanaProvider.
 */
function NetworkProviderInner({
    children,
    defaultNetwork,
}: NetworkProviderProps) {
    const [network, setNetworkState] = useState<NetworkType>(
        defaultNetwork ?? getInitialNetwork()
    );

    const updateClient = useUpdateSolanaClient();

    const setNetwork = useCallback((newNetwork: NetworkType) => {
        if (newNetwork === network) return;

        setNetworkState(newNetwork);

        // Persist to localStorage
        if (typeof window !== "undefined") {
            localStorage.setItem("solana-network", newNetwork);
        }

        // Create new client for the selected network using gill
        const newConfig = NETWORK_CONFIGS[newNetwork];
        const newClient = createSolanaClient({
            urlOrMoniker: newConfig.solanaRpc,
        });

        // Update the Solana client using gill's hook
        updateClient.mutate(newClient);
    }, [network, updateClient]);

    const networkConfig = useMemo(
        () => NETWORK_CONFIGS[network],
        [network]
    );

    const availableNetworks = useMemo(
        () => Object.keys(NETWORK_CONFIGS) as NetworkType[],
        []
    );

    const value = useMemo(
        () => ({
            network,
            networkConfig,
            setNetwork,
            availableNetworks,
        }),
        [network, networkConfig, setNetwork, availableNetworks]
    );

    return (
        <NetworkContext.Provider value={value}>
            {children}
        </NetworkContext.Provider>
    );
}

/**
 * NetworkProvider wrapper component.
 * Note: This component must be rendered INSIDE SolanaProvider since it uses useUpdateSolanaClient.
 */
export function NetworkProvider(props: NetworkProviderProps) {
    return <NetworkProviderInner {...props} />;
}

export function useNetwork(): NetworkContextValue {
    const context = useContext(NetworkContext);
    if (!context) {
        throw new Error("useNetwork must be used within a NetworkProvider");
    }
    return context;
}

// Export for use in main.tsx
export { NETWORK_CONFIGS, getInitialNetwork };
export type { NetworkConfig };
