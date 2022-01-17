import { Box } from '@chakra-ui/react';
import { TokenMap } from 'src/constants';
import { useContext } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';

import ContextStore from 'src/store';

export default function App() {
  const wallet = useWallet();
  const { solBalance, tokenAccounts } = useContext(ContextStore);

  const { publicKey } = wallet;

  return (
    <div>
      <Box bg="cornflowerblue" maxW="m" m={2} p={4} color="white">
        address: {publicKey.toBase58()}
      </Box>
      <Box bg="cornflowerblue" maxW="m" m={2} p={4} color="white">
        sol balance: {solBalance}
      </Box>
      {Object.keys(tokenAccounts)
        .filter((k) => !!TokenMap[k])
        .map((k) => (
          <Box key={k} bg="cornflowerblue" maxW="m" m={2} p={4} color="white">
            {TokenMap[k]?.symbol}: {tokenAccounts[k].balance.format()}
          </Box>
        ))}
    </div>
  );
}
