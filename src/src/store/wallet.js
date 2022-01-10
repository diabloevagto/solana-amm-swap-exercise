import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useContext, useEffect } from 'react';

import { TokenAmount } from 'src/utils/safe-math';
import { findAssociatedTokenAddress } from 'src/utils/web3';
import ContextStore from 'src/store';

export default function WalletUpdate() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { dispatch } = useContext(ContextStore);

  useEffect(() => {
    const doAction = async () => {
      const tokenAccounts = {};
      const auxiliaryTokenAccounts = [];
      const lamportsBalance = await connection.getBalance(wallet.publicKey);

      connection
        .getParsedTokenAccountsByOwner(
          wallet.publicKey,
          {
            programId: TOKEN_PROGRAM_ID,
          },
          'confirmed',
        )
        .then(async (parsedTokenAccounts) => {
          for (const tokenAccountInfo of parsedTokenAccounts.value) {
            const tokenAccountPubkey = tokenAccountInfo.pubkey;
            const tokenAccountAddress = tokenAccountPubkey.toBase58();
            const parsedInfo = tokenAccountInfo.account.data.parsed.info;
            const mintAddress = parsedInfo.mint;

            const balance = new TokenAmount(
              parsedInfo.tokenAmount.amount,
              parsedInfo.tokenAmount.decimals,
            );

            const ata = await findAssociatedTokenAddress(
              wallet.publicKey,
              new PublicKey(mintAddress),
            );

            if (ata.equals(tokenAccountPubkey)) {
              tokenAccounts[mintAddress] = {
                tokenAccountAddress,
                balance,
              };
            } else if (parsedInfo.tokenAmount.uiAmount > 0) {
              auxiliaryTokenAccounts.push(tokenAccountInfo);
            }
          }

          dispatch({
            type: 'DO_UPDATE',
            payload: {
              solBalance: lamportsBalance / LAMPORTS_PER_SOL,
              tokenAccounts,
              auxiliaryTokenAccounts,
            },
          });
        });
    };

    wallet.connected && doAction();
    const id = setInterval(() => {
      wallet.connected && doAction();
    }, 5000);

    return () => {
      clearInterval(id);
    };
  }, [connection, dispatch, wallet.publicKey, wallet.connected]);

  return <></>;
}
