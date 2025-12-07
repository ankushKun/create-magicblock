import { Counter } from "./components/Counter";
import "./index.css";

export function App() {
  return (
    <div className="bg-gray-50 p-8 rounded-xl border">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Solana Counter</h1>
          <p className="text-gray-600">
            Interact with the Counter program on Devnet
          </p>
        </header>

        <main>
          <Counter />
        </main>

        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>Anchor + Solana</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
