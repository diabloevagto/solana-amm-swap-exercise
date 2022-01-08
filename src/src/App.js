import { useWallet } from '@solana/wallet-adapter-react';

export default function App() {
  const wallet = useWallet();

  const { publicKey } = wallet;

  return (
    wallet.connected && (
      <div>
        <p>address: {publicKey.toBase58()}</p>
      </div>
    )
  );
}
