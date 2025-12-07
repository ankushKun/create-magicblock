import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useCounterProgram } from "../hooks/use-counter-program";
import { useNetwork } from "../contexts/network-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import {
    Plus,
    Minus,
    RotateCcw,
    Rocket,
    ExternalLink,
    Copy,
    Check,
    AlertCircle,
    Loader2,
    Hash
} from "lucide-react";
import { cn } from "../lib/utils";

export function Counter() {
    const { publicKey, connected } = useWallet();
    const { network } = useNetwork();
    const {
        counterAccount,
        counterPubkey,
        isLoading,
        error,
        initialize,
        increment,
        decrement,
        set,
        setCounterPubkey,
    } = useCounterProgram();

    const [setValue, setSetValue] = useState("");
    const [loadCounterInput, setLoadCounterInput] = useState("");
    const [copied, setCopied] = useState(false);
    const [lastTxSignature, setLastTxSignature] = useState<string | null>(null);

    // Handle copy counter address
    const handleCopy = async () => {
        if (counterPubkey) {
            await navigator.clipboard.writeText(counterPubkey.toBase58());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Handle actions with tx signature tracking
    const handleAction = async (action: () => Promise<string>, actionName: string) => {
        try {
            const tx = await action();
            setLastTxSignature(tx);
            console.log(`${actionName} successful:`, tx);
        } catch (err) {
            console.error(`${actionName} failed:`, err);
        }
    };

    // Handle set value
    const handleSet = async () => {
        const value = parseInt(setValue, 10);
        if (isNaN(value) || value < 0) {
            return;
        }
        await handleAction(() => set(value), "Set");
        setSetValue("");
    };

    // Handle loading an existing counter
    const handleLoadCounter = () => {
        try {
            const pubkey = new PublicKey(loadCounterInput);
            setCounterPubkey(pubkey);
            setLoadCounterInput("");
        } catch {
            console.error("Invalid public key");
        }
    };

    // Get explorer URL
    const getExplorerUrl = (address: string, type: "address" | "tx" = "address") => {
        const cluster = network === "localnet" ? "custom&customUrl=http://localhost:8899" : network;
        return `https://explorer.solana.com/${type}/${address}?cluster=${cluster}`;
    };

    // Not connected state
    if (!connected || !publicKey) {
        return (
            <Card className="w-full max-w-md mx-auto border-dashed border-2 border-muted-foreground/25">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Wallet Not Connected</h3>
                    <p className="text-muted-foreground text-sm">
                        Connect your wallet to interact with the Counter program
                    </p>
                </CardContent>
            </Card>
        );
    }

    // No counter initialized state
    if (!counterPubkey) {
        return (
            <Card className="w-full max-w-md mx-auto overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-solana/10 via-transparent to-success/10 pointer-events-none" />
                <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-solana" />
                        Initialize Counter
                    </CardTitle>
                    <CardDescription>
                        Create a new counter or load an existing one
                    </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-6">
                    {/* Initialize new counter */}
                    <div className="space-y-3">
                        <Button
                            onClick={() => handleAction(initialize, "Initialize")}
                            disabled={isLoading}
                            className="w-full bg-linear-to-r from-solana to-success hover:opacity-90 transition-opacity"
                            size="lg"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Rocket className="w-4 h-4 mr-2" />
                            )}
                            Create New Counter
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or</span>
                        </div>
                    </div>

                    {/* Load existing counter */}
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">Load an existing counter by address:</p>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Counter public key..."
                                value={loadCounterInput}
                                onChange={(e) => setLoadCounterInput(e.target.value)}
                                className="font-mono text-xs"
                            />
                            <Button
                                onClick={handleLoadCounter}
                                disabled={!loadCounterInput}
                                variant="outline"
                            >
                                Load
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            {error}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Counter interface
    return (
        <Card className="w-full max-w-md mx-auto overflow-hidden relative">
            <div className="absolute inset-0 bg-linear-to-br from-solana/5 via-transparent to-success/5 pointer-events-none" />

            <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Hash className="w-5 h-5 text-solana" />
                        Counter
                    </CardTitle>
                    <Badge variant="outline" className="font-mono text-xs">
                        {network}
                    </Badge>
                </div>

                {/* Counter address */}
                <div className="flex items-center gap-2 mt-2 justify-center">
                    <code className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded-md">
                        {counterPubkey.toBase58().slice(0, 4)}...{counterPubkey.toBase58().slice(-4)}
                    </code>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={handleCopy}
                            title="Copy address"
                        >
                            {copied ? (
                                <Check className="w-3 h-3 text-success" />
                            ) : (
                                <Copy className="w-3 h-3" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            asChild
                            title="View on Explorer"
                        >
                            <a
                                href={getExplorerUrl(counterPubkey.toBase58())}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative space-y-6">
                {/* Counter display */}
                <div className="flex flex-col items-center py-8">
                    {counterAccount ? (
                        <div className="relative">
                            <div className="text-8xl font-black tracking-tighter bg-linear-to-b from-foreground to-muted-foreground/50 bg-clip-text text-transparent tabular-nums">
                                {counterAccount.count.toString()}
                            </div>
                        </div>
                    ) : (
                        <Skeleton className="h-24 w-32" />
                    )}
                    <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium mt-4">Current Count</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-6">
                    <Button
                        onClick={() => handleAction(decrement, "Decrement")}
                        disabled={isLoading || !counterAccount || counterAccount.count === 0n}
                        variant="outline"
                        size="icon"
                        className="h-14 w-14 rounded-full border-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <Minus className="w-6 h-6" />
                        )}
                    </Button>

                    <Button
                        onClick={() => handleAction(increment, "Increment")}
                        disabled={isLoading}
                        size="icon"
                        className="h-20 w-20 rounded-full bg-linear-to-r from-solana to-success hover:scale-105 transition-transform shadow-lg shadow-solana/25 border-4 border-background"
                    >
                        {isLoading ? (
                            <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                            <Plus className="w-8 h-8 text-white" />
                        )}
                    </Button>

                    <Button
                        onClick={() => setCounterPubkey(null)}
                        variant="outline"
                        size="icon"
                        className="h-14 w-14 rounded-full border-2"
                        title="Reset (create new counter)"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </Button>
                </div>



                {/* Set value input */}
                <div className="flex gap-2">
                    <Input
                        type="number"
                        min="0"
                        placeholder="Set value..."
                        value={setValue}
                        onChange={(e) => setSetValue(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => e.key === "Enter" && handleSet()}
                    />
                    <Button
                        onClick={handleSet}
                        disabled={isLoading || !setValue || parseInt(setValue, 10) < 0}
                        variant="secondary"
                    >
                        Set
                    </Button>
                </div>

                {/* Error display */}
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Last transaction */}
                {lastTxSignature && (
                    <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Last Transaction</p>
                        <a
                            href={getExplorerUrl(lastTxSignature, "tx")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "text-xs font-mono text-solana hover:underline inline-flex items-center gap-1"
                            )}
                        >
                            {lastTxSignature.slice(0, 20)}...{lastTxSignature.slice(-8)}
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                )}
            </CardContent>
        </Card >
    );
}
