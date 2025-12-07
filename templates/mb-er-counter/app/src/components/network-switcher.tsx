import { useNetwork, type NetworkType } from "../contexts/network-context";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

/**
 * Network Switcher component that provides a dropdown to switch between
 * localnet and devnet networks.
 * 
 * Features:
 * - Sleek dropdown with network indicator colors
 * - Persists selection to localStorage
 * - Uses gill's useUpdateSolanaClient for seamless network switching without page reload
 */
export function NetworkSwitcher() {
    const { network, networkConfig, setNetwork, availableNetworks } = useNetwork();

    const handleNetworkSelect = (selectedNetwork: NetworkType) => {
        if (selectedNetwork !== network) {
            setNetwork(selectedNetwork);
        }
    };

    const getNetworkColor = (net: NetworkType): string => {
        return net === "devnet" ? "bg-warning" : "bg-success";
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <span>{networkConfig.displayName}</span>
                    <ChevronDownIcon className="size-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
                {availableNetworks.map((net) => (
                    <DropdownMenuItem
                        key={net}
                        onClick={() => handleNetworkSelect(net)}
                        className="gap-2 cursor-pointer"
                    >
                        <span className="flex-1">
                            {net.charAt(0).toUpperCase() + net.slice(1)}
                        </span>
                        {net === network && (
                            <CheckIcon className="size-4 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
