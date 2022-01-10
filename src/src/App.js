import { TokenMap } from 'src/constants';
import { useContext } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

import ContextStore from 'src/store';

export default function App() {
  const wallet = useWallet();
  const { solBalance, tokenAccounts } = useContext(ContextStore);

  const { publicKey } = wallet;

  return (
    wallet.connected && (
      <div>
        <p>address: {publicKey.toBase58()}</p>
        <p>sol balance: {solBalance}</p>
        {Object.keys(tokenAccounts).map((k) => (
          <p key={k}>
            {TokenMap[k]?.symbol}: {tokenAccounts[k].balance.format()}
          </p>
        ))}
      </div>
    )
  );
}
