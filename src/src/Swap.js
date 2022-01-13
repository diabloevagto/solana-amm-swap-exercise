import { NATIVE_SOL, TokenMap } from 'src/constants';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { getPoolByTokenMintAddresses } from 'src/utils/pools';
import { swap } from 'src/utils/swap';
import ContextStore from 'src/store';

export default function App() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { solBalance, tokenAccounts } = useContext(ContextStore);
  const [fromToken, setFromToken] = useState(NATIVE_SOL.address);
  const [toToken, setToToken] = useState(
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // usdc
  );
  const [fromAmount, setFromAmount] = useState(0);
  const [toAmount, setToAmount] = useState(0);
  const [pool, setPool] = useState(undefined);

  useEffect(() => {
    setPool(getPoolByTokenMintAddresses(fromToken, toToken));
  }, [fromToken, toToken]);

  const doSwap = useCallback(async () => {
    if (!!pool) {
      try {
        const tx = await swap(
          connection,
          wallet,
          pool,
          fromToken,
          toToken,
          tokenAccounts[fromToken]?.tokenAccountAddress,
          tokenAccounts[toToken]?.tokenAccountAddress,
          String(fromAmount),
          String(toAmount),
        );

        console.log(tx);
      } catch (error) {
        console.log(error);
      }
    }
  }, [
    pool,
    connection,
    wallet,
    fromToken,
    toToken,
    tokenAccounts,
    fromAmount,
    toAmount,
  ]);

  return (
    <div>
      <p>
        {fromToken} -{'>'} {toToken}
      </p>
      <p>from</p>
      <select
        value={fromToken}
        onChange={(event) => setFromToken(event.target.value)}
      >
        <option value={NATIVE_SOL.address}>{NATIVE_SOL.symbol}</option>
        {Object.keys(tokenAccounts).map((k) => (
          <option key={TokenMap[k]?.address} value={TokenMap[k]?.address}>
            {TokenMap[k]?.symbol}
          </option>
        ))}
      </select>
      <p>to</p>
      <select
        value={toToken}
        onChange={(event) => setToToken(event.target.value)}
      >
        <option value={NATIVE_SOL.address}>{NATIVE_SOL.symbol}</option>
        {Object.keys(tokenAccounts).map((k) => (
          <option key={TokenMap[k]?.address} value={TokenMap[k]?.address}>
            {TokenMap[k]?.symbol}
          </option>
        ))}
      </select>
      <button onClick={doSwap} disabled={solBalance < 0.02 || !pool}>
        swap
      </button>
      {solBalance < 0.02 && <p>warning: sol too small (0.02)</p>}
      {!pool && <p>no swap route</p>}
    </div>
  );
}
