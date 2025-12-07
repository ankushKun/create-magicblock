import { ConnectButton } from "./components/connect-button";
import { Counter } from "./components/counter";
import { ModeToggle } from "./components/mode-toggle";
import { NetworkSwitcher } from "./components/network-switcher";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      <header className="text-center space-y-4">
        <div className="flex justify-end items-center gap-2 w-full max-w-4xl mb-4">
          <NetworkSwitcher />
          <ModeToggle />
        </div>
        <h1 className="text-4xl font-bold bg-linear-to-r from-solana to-success bg-clip-text text-transparent">
          Solana Counter
        </h1>
        <p className="text-muted-foreground text-sm">
          Interact with on-chain counter program on Devnet
        </p>
      </header>

      <main className="w-full max-w-4xl grid md:grid-cols-2 gap-6 items-start">
        <ConnectButton />
        <Counter />
      </main>

      <footer className="text-muted-foreground text-sm">
        <p>
          Built with <span className="text-success font-semibold">Anchor</span> and{" "}
          <span className="text-solana font-semibold">Solana</span>
        </p>
      </footer>
    </div>
  );
}
