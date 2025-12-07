import { useWallet } from "@solana/wallet-adapter-react";
import { useBalance } from "@gillsdk/react";
import { address, type Address } from "gill";
import { useMemo } from "react";
import { useNetwork } from "../contexts/network-context";
import { WalletButton } from "./wallet-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Wallet,
    Coins,
    Globe,
    Copy,
    Check,
    ExternalLink
} from "lucide-react";
import { useState, useCallback } from "react";

/**
 * Connect Button component that displays wallet connection status,
 * the connected wallet's address (truncated), and SOL balance.
 * 
 * Features:
 * - Uses custom WalletButton for connection
 * - Uses gill's useBalance hook for reactive balance updates
 * - Shows truncated address for better UX
 * - Displays balance in SOL with 4 decimal precision
 * - Automatically updates when network changes via gill's client switching
 */
export function ConnectButton() {
    const { publicKey, connected, wallet } = useWallet();
    const { network, networkConfig } = useNetwork();
    const [copied, setCopied] = useState(false);

    // Convert publicKey to gill's address format for useBalance hook
    const walletAddress = useMemo((): Address | null => {
        if (!publicKey) return null;
        return address(publicKey.toBase58());
    }, [publicKey]);

    // Use gill's useBalance hook - automatically updates when client changes
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

    const isLoading = balanceResult.isPending;
    const hasError = balanceResult.isError;

    // Truncate address for display (first 4 and last 4 characters)
    const truncatedAddress = useMemo(() => {
        if (!publicKey) return "";
        const addr = publicKey.toBase58();
        return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
    }, [publicKey]);

    // Format balance with proper decimals
    const formatBalance = useCallback((bal: number) => {
        if (bal === 0) return "0";
        if (bal < 0.0001) return "<0.0001";
        return bal.toFixed(4);
    }, []);

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
        const cluster = network === "devnet"
            ? "?cluster=devnet"
            : network === "localnet"
                ? "?cluster=custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899"
                : "";
        return `${base}/address/${publicKey.toBase58()}${cluster}`;
    }, [publicKey, network]);

    if (!connected) {
        return (
            <div className="flex justify-center">
                <WalletButton />
            </div>
        );
    }

    return (
        <Card className="w-full animate-in fade-in-0 slide-in-from-bottom-4 duration-500 border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/5">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Wallet Avatar */}
                        <div className="relative">
                            <div className="size-12 p-0.5">
                                <div className="size-full flex items-center justify-center overflow-hidden">
                                    {wallet?.adapter.icon ? (
                                        <img
                                            src={wallet.adapter.icon}
                                            alt={wallet.adapter.name}
                                            className="size-8"
                                        />
                                    ) : (
                                        <Wallet className="size-6 text-primary" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="font-semibold text-foreground">
                                {wallet?.adapter.name ?? "Wallet"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Connected
                            </p>
                        </div>
                    </div>

                    <WalletButton />
                </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
                {/* Wallet Address */}
                <div
                    onClick={copyAddress}
                    className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/30 transition-all duration-200 hover:border-primary/30 hover:bg-secondary/50 cursor-pointer group"
                >
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Wallet className="size-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Address
                            </p>
                            <p
                                className="font-mono text-sm text-foreground font-semibold"
                                title={publicKey?.toBase58()}
                            >
                                {truncatedAddress}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {copied ? (
                            <Check className="size-4 text-success" />
                        ) : (
                            <Copy className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        )}
                    </div>
                </div>

                {/* Balance */}
                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/30 transition-all duration-200 hover:border-success/30 hover:bg-secondary/50">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-success/10 flex items-center justify-center">
                            <Coins className="size-4 text-success" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Balance
                            </p>
                            {isLoading ? (
                                <Skeleton className="h-5 w-24 mt-0.5" />
                            ) : hasError ? (
                                <p className="text-sm text-destructive font-medium">Error loading</p>
                            ) : balance !== null ? (
                                <p className="font-mono text-sm text-success font-bold">
                                    {formatBalance(balance)} SOL
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground">—</p>
                            )}
                        </div>
                    </div>
                    {balance !== null && balance > 0 && (
                        <Badge variant="outline" className="border-success/30 text-success bg-success/5">
                            Active
                        </Badge>
                    )}
                </div>

                {/* Network */}
                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/30">
                    <div className="flex items-center gap-3">
                        <div className={`size-9 rounded-lg flex items-center justify-center ${network === "devnet" ? "bg-warning/10" : "bg-success/10"
                            }`}>
                            <Globe className={`size-4 ${network === "devnet" ? "text-warning" : "text-success"
                                }`} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Network
                            </p>
                            <p className="text-sm font-semibold">
                                {networkConfig.displayName}
                            </p>
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className={
                            network === "devnet"
                                ? "border-warning/50 text-warning bg-warning/5"
                                : "border-success/50 text-success bg-success/5"
                        }
                    >
                        {network === "devnet" ? "Testnet" : "Local"}
                    </Badge>
                </div>

                {/* Explorer Link */}
                <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border/30 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/30 transition-all duration-200 text-sm text-muted-foreground hover:text-primary"
                >
                    <ExternalLink className="size-4" />
                    View on Solana Explorer
                </a>
            </CardContent>
        </Card>
    );
}
