import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from '@solana/wallet-adapter-react';
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';

import { WrapContext } from 'src/store';
import WalletUpdate from 'src/store/wallet';

import App from './App';
import Swap from './Swap';

import '@solana/wallet-adapter-react-ui/styles.css';

const AppContent = () => {
  const wallet = useWallet();

  return (
    wallet.connected && (
      <>
        <App />
        <Swap />
      </>
    )
  );
};

const ConnectionWrap = (props) => {
  const network = WalletAdapterNetwork.Mainnet;

  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new LedgerWalletAdapter(),
      new SolletWalletAdapter({ network }),
      new SolletExtensionWalletAdapter({ network }),
    ],
    [network],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div
            style={{
              display: 'flex',
              justifyContent: 'end',
            }}
          >
            <WalletMultiButton />
          </div>
          {props.children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <WrapContext>
      <ConnectionWrap>
        <WalletUpdate />
        <AppContent />
      </ConnectionWrap>
    </WrapContext>
  </React.StrictMode>,
  document.getElementById('root'),
);
