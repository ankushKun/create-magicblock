import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCounterProgram } from "../hooks/use-counter-program";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function Counter() {
    const { publicKey, connected } = useWallet();
    const {
        counterAccount,
        counterPubkey,
        isLoading,
        isAccountChecked,
        error,
        initialize,
        increment,
        decrement,
        set,
    } = useCounterProgram();

    const [setValue, setSetValue] = useState("");
    const [lastTxSignature, setLastTxSignature] = useState<string | null>(null);

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
        if (isNaN(value) || value < 0) return;
        await handleAction(() => set(value), "Set");
        setSetValue("");
    };

    // Get explorer URL
    const getExplorerUrl = (address: string, type: "address" | "tx" = "address") => {
        return `https://explorer.solana.com/${type}/${address}?cluster=devnet`;
    };

    return (
        <div className="max-w-md mx-auto space-y-4">
            {/* Not connected state */}
            {!connected || !publicKey ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-gray-500">
                            Connect your wallet to interact with the Counter program
                        </p>
                    </CardContent>
                </Card>
            ) : !isAccountChecked ? (
                /* Loading state while checking account */
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-gray-500">
                            Checking account...
                        </p>
                    </CardContent>
                </Card>
            ) : !counterAccount ? (
                /* No counter initialized state */
                <Card>
                    <CardHeader>
                        <CardTitle>Initialize Counter</CardTitle>
                        {counterPubkey && (
                            <p className="text-xs font-mono text-gray-500 break-all">
                                PDA: {counterPubkey.toBase58()}
                            </p>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Each wallet has its own counter derived from your public key.
                        </p>
                        <Button
                            onClick={() => handleAction(initialize, "Initialize")}
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? "Creating..." : "Initialize Counter"}
                        </Button>

                        {error && (
                            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm">
                                {error}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                /* Counter interface */
                <Card>
                    <CardHeader>
                        <CardTitle>Counter</CardTitle>
                        <p className="text-xs font-mono text-gray-500 break-all">
                            {counterPubkey?.toBase58()}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Counter display */}
                        <div className="text-center py-4">
                            <div className="text-6xl font-bold">
                                {counterAccount.count.toString()}
                            </div>
                            <p className="text-gray-500 mt-2">Current Count</p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-center gap-4">
                            <Button
                                onClick={() => handleAction(decrement, "Decrement")}
                                disabled={isLoading || counterAccount.count === 0n}
                                variant="outline"
                                size="lg"
                            >
                                −
                            </Button>
                            <Button
                                onClick={() => handleAction(increment, "Increment")}
                                disabled={isLoading}
                                size="lg"
                            >
                                +
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
                            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Last transaction */}
                        {lastTxSignature && (
                            <div className="pt-2 border-t">
                                <p className="text-xs text-gray-500 mb-1">Last Transaction</p>
                                <a
                                    href={getExplorerUrl(lastTxSignature, "tx")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-mono text-blue-600 hover:underline break-all"
                                >
                                    {lastTxSignature.slice(0, 20)}...{lastTxSignature.slice(-20)}
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
