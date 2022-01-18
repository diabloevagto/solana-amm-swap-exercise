import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { cloneDeep } from 'lodash-es';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useContext, useEffect } from 'react';

import {
  AMM_INFO_LAYOUT,
  AMM_INFO_LAYOUT_STABLE,
  AMM_INFO_LAYOUT_V3,
  AMM_INFO_LAYOUT_V4,
} from 'src/utils/liquidity';
import { LIQUIDITY_POOLS, getAddressForWhat } from 'src/utils/pools';
import { MINT_LAYOUT, getBigNumber } from 'src/utils/layouts';
import { TOKEN_PROGRAM_ID } from '@project-serum/serum/lib/token-instructions';
import { TokenAmount } from 'src/utils/safe-math';
import { TokenMap } from 'src/constants';
import {
  commitment,
  findAssociatedTokenAddress,
  getMultipleAccounts,
} from 'src/utils/web3';
import ContextStore from 'src/store';

const addFees = async (connection) => {
  const liquidityPools = {};
  const publicKeys = [];

  LIQUIDITY_POOLS.forEach((pool) => {
    const {
      poolCoinTokenAccount,
      poolPcTokenAccount,
      ammOpenOrders,
      ammId,
      coin,
      pc,
      lp,
    } = pool;

    publicKeys.push(
      new PublicKey(poolCoinTokenAccount),
      new PublicKey(poolPcTokenAccount),
      new PublicKey(ammOpenOrders),
      new PublicKey(ammId),
      new PublicKey(lp.mintAddress),
    );

    const poolInfo = cloneDeep(pool);

    poolInfo.coin.balance = new TokenAmount(0, coin.decimals);
    poolInfo.pc.balance = new TokenAmount(0, pc.decimals);

    liquidityPools[lp.mintAddress] = poolInfo;
  });

  const multipleInfo = await getMultipleAccounts(
    connection,
    publicKeys,
    commitment,
  );

  multipleInfo.forEach((info) => {
    if (info) {
      const address = info.publicKey.toBase58();
      const data = Buffer.from(info.account.data);

      const { key, lpMintAddress, version } = getAddressForWhat(address);

      if (key && lpMintAddress) {
        const poolInfo = liquidityPools[lpMintAddress];

        switch (key) {
          // case 'poolCoinTokenAccount': {
          //   const parsed = ACCOUNT_LAYOUT.decode(data);
          //   // quick fix: Number can only safely store up to 53 bits
          //   poolInfo.coin.balance.wei = poolInfo.coin.balance.wei.plus(
          //     getBigNumber(parsed.amount),
          //   );

          //   break;
          // }
          // case 'poolPcTokenAccount': {
          //   const parsed = ACCOUNT_LAYOUT.decode(data);

          //   poolInfo.pc.balance.wei = poolInfo.pc.balance.wei.plus(
          //     getBigNumber(parsed.amount),
          //   );

          //   break;
          // }
          // case 'ammOpenOrders': {
          //   const OPEN_ORDERS_LAYOUT = OpenOrders.getLayout(
          //     new PublicKey(poolInfo.serumProgramId),
          //   );
          //   const parsed = OPEN_ORDERS_LAYOUT.decode(data);

          //   const { baseTokenTotal, quoteTokenTotal } = parsed;
          //   poolInfo.coin.balance.wei = poolInfo.coin.balance.wei.plus(
          //     getBigNumber(baseTokenTotal),
          //   );
          //   poolInfo.pc.balance.wei = poolInfo.pc.balance.wei.plus(
          //     getBigNumber(quoteTokenTotal),
          //   );

          //   break;
          // }
          case 'ammId': {
            let parsed;
            if (version === 2) {
              parsed = AMM_INFO_LAYOUT.decode(data);
            } else if (version === 3) {
              parsed = AMM_INFO_LAYOUT_V3.decode(data);
            } else {
              if (version === 5) {
                parsed = AMM_INFO_LAYOUT_STABLE.decode(data);
                poolInfo.currentK = getBigNumber(parsed.currentK);
              } else {
                parsed = AMM_INFO_LAYOUT_V4.decode(data);
                if (getBigNumber(parsed.status) === 7) {
                  poolInfo.poolOpenTime = getBigNumber(parsed.poolOpenTime);
                }
              }

              const { swapFeeNumerator, swapFeeDenominator } = parsed;
              poolInfo.fees = {
                swapFeeNumerator: getBigNumber(swapFeeNumerator),
                swapFeeDenominator: getBigNumber(swapFeeDenominator),
              };
            }

            const { status, needTakePnlCoin, needTakePnlPc } = parsed;
            poolInfo.status = getBigNumber(status);
            poolInfo.coin.balance.wei = poolInfo.coin.balance.wei.minus(
              getBigNumber(needTakePnlCoin),
            );
            poolInfo.pc.balance.wei = poolInfo.pc.balance.wei.minus(
              getBigNumber(needTakePnlPc),
            );

            break;
          }
          // getLpSupply
          case 'lpMintAddress': {
            const parsed = MINT_LAYOUT.decode(data);

            poolInfo.lp.totalSupply = new TokenAmount(
              getBigNumber(parsed.supply),
              poolInfo.lp.decimals,
            );

            break;
          }
          default:
        }
      }
    }
  });

  return liquidityPools;
};

export default function WalletUpdate() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { dispatch } = useContext(ContextStore);

  useEffect(() => {
    const doFetchInfo = async () => {
      const liquidityPools = await addFees(connection);

      dispatch({
        type: 'DO_UPDATE',
        payload: {
          liquidityPools,
        },
      });
    };

    const doUpdateWallet = async () => {
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

            if (ata.equals(tokenAccountPubkey) && TokenMap[mintAddress]) {
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

    if (wallet.connected) {
      doFetchInfo();
      doUpdateWallet();
    }
    const id = setInterval(() => {
      wallet.connected && doUpdateWallet();
    }, 5000);

    return () => {
      clearInterval(id);
    };
  }, [connection, dispatch, wallet.connected, wallet.publicKey]);

  return <></>;
}
