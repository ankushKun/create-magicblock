import { createRoot } from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import { createSolanaClient } from "gill";
import { SolanaProvider } from "@gillsdk/react";
import { WalletProvider } from "./providers/wallet-provider";
import {
  NetworkProvider,
  NETWORK_CONFIGS,
  getInitialNetwork,
} from "./contexts/network-context";
import App from "./app";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";

const initialNetwork = getInitialNetwork();
const networkConfig = NETWORK_CONFIGS[initialNetwork];

// Create QueryClient for @tanstack/react-query
// Required by @gillsdk/react hooks (useBalance, etc.)
// Note: We provide a default queryFn as a workaround for @gillsdk/react's
// useSolanaClient hook which doesn't provide a queryFn (relies on setQueryData)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed requests up to 3 times
      retry: 3,
      // Consider data stale after 30 seconds
      staleTime: 30 * 1000,
      // Cache data for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Default queryFn - this is needed for @gillsdk/react hooks that use
      // useQuery without a queryFn (they rely on initialData and setQueryData)
      queryFn: ({ queryKey }) => {
        // Return cached data if available
        const cached = queryClient.getQueryData(queryKey);
        if (cached !== undefined) {
          return cached;
        }
        // For gill-client queries, we should never reach here as SolanaProvider sets the data
        // But if we do, throw an error to indicate misconfiguration
        throw new Error(`No data found for query key: ${JSON.stringify(queryKey)}`);
      },
    },
  },
});

// Create initial Solana client using gill
// Network switching is handled dynamically via useUpdateSolanaClient in NetworkContext
const client = createSolanaClient({
  urlOrMoniker: networkConfig.solanaRpc,
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="app-theme">
    <SolanaProvider client={client} queryClient={queryClient}>
      <NetworkProvider defaultNetwork={initialNetwork}>
        <WalletProvider endpoint={networkConfig.solanaRpc}>
          <App />
        </WalletProvider>
      </NetworkProvider>
    </SolanaProvider>
  </ThemeProvider>
);
