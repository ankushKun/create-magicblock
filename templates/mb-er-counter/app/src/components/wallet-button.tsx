import { useWallet } from "@solana/wallet-adapter-react";
import { useBalance } from "@gillsdk/react";
import { address, type Address } from "gill";
import { useCallback, useMemo, useState } from "react";
import { useNetwork } from "../contexts/network-context";
import {
    Wallet,
    ChevronDown,
    Copy,
    ExternalLink,
    LogOut,
    Check,
    Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Custom Wallet Button component with a modern design that matches the app theme.
 * 
 * Features:
 * - Custom styled connect button with gradient
 * - Beautiful wallet selection dialog
 * - Connected state dropdown with:
 *   - Wallet icon/avatar
 *   - Truncated address with copy functionality
 *   - SOL balance display
 *   - Network badge
 *   - View on Explorer link
 *   - Disconnect option
 */
export function WalletButton() {
    const { publicKey, connected, disconnect, connecting, wallet, wallets, select } = useWallet();
    const { network, networkConfig } = useNetwork();
    const [copied, setCopied] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Convert publicKey to gill's address format for useBalance hook
    const walletAddress = useMemo((): Address | null => {
        if (!publicKey) return null;
        return address(publicKey.toBase58());
    }, [publicKey]);

    // Use gill's useBalance hook
    const balanceResult = useBalance({
        address: walletAddress ?? ("" as Address),
        options: {
            enabled: !!walletAddress,
        },
    });

    // Convert lamports to SOL
    const balance = useMemo(() => {
        if (!connected || !walletAddress) return null;
        if (balanceResult.isError || balanceResult.isPending) return null;
        return Number(balanceResult.balance) / 1e9;
    }, [connected, walletAddress, balanceResult]);

    const isLoadingBalance = balanceResult.isPending;

    // Truncate address for display
    const truncatedAddress = useMemo(() => {
        if (!publicKey) return "";
        const addr = publicKey.toBase58();
        return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
    }, [publicKey]);

    // Copy address to clipboard
    const copyAddress = useCallback(async () => {
        if (!publicKey) return;
        await navigator.clipboard.writeText(publicKey.toBase58());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [publicKey]);

    // Get explorer URL based on network
    const explorerUrl = useMemo(() => {
        if (!publicKey) return "";
        const base = "https://explorer.solana.com";
        const cluster = network === "devnet" ? "?cluster=devnet" : network === "localnet" ? "?cluster=custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899" : "";
        return `${base}/address/${publicKey.toBase58()}${cluster}`;
    }, [publicKey, network]);

    // Format balance
    const formatBalance = useCallback((bal: number) => {
        if (bal === 0) return "0";
        if (bal < 0.0001) return "<0.0001";
        return bal.toFixed(4);
    }, []);

    // Handle wallet selection
    const handleWalletSelect = useCallback((walletName: string) => {
        const selectedWallet = wallets.find((w) => w.adapter.name === walletName);
        if (selectedWallet) {
            select(selectedWallet.adapter.name);
            setDialogOpen(false);
        }
    }, [wallets, select]);

    // Installed wallets
    const installedWallets = useMemo(() =>
        wallets.filter((w) => w.readyState === "Installed"),
        [wallets]);

    // Other wallets
    const otherWallets = useMemo(() =>
        wallets.filter((w) => w.readyState !== "Installed"),
        [wallets]);

    // Not connected - show connect button
    if (!connected) {
        return (
            <>
                <Button
                    onClick={() => setDialogOpen(true)}
                    disabled={connecting}
                    className="relative overflow-hidden bg-linear-to-r from-solana to-success hover:from-solana/90 hover:to-success/90 text-white font-semibold px-6 py-2 shadow-lg shadow-solana/25 transition-all duration-300 hover:shadow-xl hover:shadow-solana/30 hover:scale-[1.02] active:scale-[0.98]"
                    size="lg"
                >
                    {connecting ? (
                        <>
                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        <>
                            <Wallet className="size-4" />
                            Connect Wallet
                        </>
                    )}
                </Button>

                {/* Wallet Selection Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Wallet className="size-5 text-primary" />
                                Connect a Wallet
                            </DialogTitle>
                            <DialogDescription>
                                Choose a wallet to connect to this app.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            {/* Installed Wallets */}
                            {installedWallets.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Detected Wallets
                                    </p>
                                    <div className="space-y-2">
                                        {installedWallets.map((w) => (
                                            <button
                                                key={w.adapter.name}
                                                onClick={() => handleWalletSelect(w.adapter.name)}
                                                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-primary/30 transition-all duration-200 group"
                                            >
                                                <Avatar className="size-10">
                                                    <AvatarImage src={w.adapter.icon} alt={w.adapter.name} />
                                                    <AvatarFallback className="bg-primary/10 text-primary">
                                                        {w.adapter.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 text-left">
                                                    <p className="font-medium group-hover:text-primary transition-colors">
                                                        {w.adapter.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Detected
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="border-success/50 text-success">
                                                    Installed
                                                </Badge>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Other Wallets */}
                            {otherWallets.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        More Wallets
                                    </p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {otherWallets.slice(0, 5).map((w) => (
                                            <button
                                                key={w.adapter.name}
                                                onClick={() => handleWalletSelect(w.adapter.name)}
                                                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-secondary/30 hover:border-border transition-all duration-200 opacity-70 hover:opacity-100"
                                            >
                                                <Avatar className="size-8">
                                                    <AvatarImage src={w.adapter.icon} alt={w.adapter.name} />
                                                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                                        {w.adapter.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <p className="font-medium text-sm">
                                                    {w.adapter.name}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {wallets.length === 0 && (
                                <div className="text-center py-8">
                                    <Wallet className="size-12 mx-auto text-muted-foreground/50 mb-3" />
                                    <p className="text-muted-foreground">
                                        No wallets found. Please install a Solana wallet extension.
                                    </p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    // Connected - show dropdown
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="gap-2 pl-2 pr-3 h-11 border-border/50 bg-secondary/30 hover:bg-secondary/60 hover:border-primary/30 transition-all duration-200"
                >
                    {/* Wallet Icon */}
                    <Avatar className="size-7">
                        {wallet?.adapter.icon && (
                            <AvatarImage src={wallet.adapter.icon} alt={wallet.adapter.name} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            <Wallet className="size-4" />
                        </AvatarFallback>
                    </Avatar>

                    {/* Address */}
                    <span className="font-mono text-sm font-medium">
                        {truncatedAddress}
                    </span>

                    <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-72">
                {/* Wallet Info Header */}
                <div className="p-3 bg-secondary/30 -mx-1 -mt-1 mb-1 rounded-t-md border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <Avatar className="size-10 ring-2 ring-primary/20">
                            {wallet?.adapter.icon && (
                                <AvatarImage src={wallet.adapter.icon} alt={wallet.adapter.name} />
                            )}
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                <Wallet className="size-5" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                                {wallet?.adapter.name ?? "Wallet"}
                            </p>
                            <p className="font-mono text-xs text-muted-foreground">
                                {truncatedAddress}
                            </p>
                        </div>
                        <Badge
                            variant="outline"
                            className={
                                network === "devnet"
                                    ? "border-warning/50 text-warning text-xs"
                                    : "border-success/50 text-success text-xs"
                            }
                        >
                            {networkConfig.displayName}
                        </Badge>
                    </div>
                </div>

                {/* Balance */}
                <div className="px-2 py-2">
                    <div className="flex items-center justify-between p-2 rounded-md bg-secondary/50">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Coins className="size-4" />
                            <span className="text-sm">Balance</span>
                        </div>
                        {isLoadingBalance ? (
                            <Skeleton className="h-5 w-20" />
                        ) : (
                            <span className="font-mono text-sm font-semibold text-success">
                                {balance !== null ? `${formatBalance(balance)} SOL` : "—"}
                            </span>
                        )}
                    </div>
                </div>

                <DropdownMenuSeparator />

                {/* Actions */}
                <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
                    {copied ? (
                        <Check className="size-4 text-success" />
                    ) : (
                        <Copy className="size-4" />
                    )}
                    <span>{copied ? "Copied!" : "Copy Address"}</span>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                    <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer"
                    >
                        <ExternalLink className="size-4" />
                        <span>View on Explorer</span>
                    </a>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => disconnect()}
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                    <LogOut className="size-4" />
                    <span>Disconnect</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
