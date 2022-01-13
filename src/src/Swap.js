import {
  Alert,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Link,
  NumberInput,
  NumberInputField,
  Select,
  useToast,
} from '@chakra-ui/react';
import { ArrowForwardIcon } from '@chakra-ui/icons';

import { NATIVE_SOL, TokenMap } from 'src/constants';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { getPoolByTokenMintAddresses } from 'src/utils/pools';
import { getSwapOutAmount, swap } from 'src/utils/swap';
import ContextStore from 'src/store';

export default function Swap() {
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
  const toast = useToast();

  console.log({
    fromToken,
    toToken,
    fromAmount,
    toAmount,
  });

  useEffect(() => {
    const p = getPoolByTokenMintAddresses(fromToken, toToken);
    console.log(p);
    setPool(p);

    if (!!p) {
      const f = getSwapOutAmount(p, fromToken, toToken, fromToken, 3);
      console.log(f);
    }
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

        toast({
          position: 'bottom-left',
          render: () => (
            <Alert status="success">
              <AlertIcon />
              <AlertTitle>
                <Link href={`https://solscan.io/tx/${tx}`} isExternalk>
                  Transaction
                </Link>
              </AlertTitle>
            </Alert>
          ),
        });
      } catch (error) {
        console.log(error);

        toast({
          position: 'bottom-left',
          render: () => (
            <Alert status="error">
              <AlertIcon />
              <AlertTitle>some error</AlertTitle>
            </Alert>
          ),
        });
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
    toast,
  ]);

  return (
    <div style={{ margin: 8 }}>
      <Flex color="white" align="center">
        <FormControl bg="cornflowerblue" flex="1" p={5}>
          <FormLabel htmlFor="from">From</FormLabel>
          <Select
            id="from"
            value={fromToken}
            onChange={(event) => setFromToken(event.target.value)}
          >
            <option value={NATIVE_SOL.address}>{NATIVE_SOL.symbol}</option>
            {Object.keys(tokenAccounts).map((k) => (
              <option key={TokenMap[k]?.address} value={TokenMap[k]?.address}>
                {TokenMap[k]?.symbol}
              </option>
            ))}
          </Select>
          <NumberInput
            defaultValue={fromAmount}
            precision={4}
            onChange={(_, valueAsNumber) => setFromAmount(valueAsNumber)}
          >
            <NumberInputField id="fromAmount" />
          </NumberInput>
        </FormControl>
        <Box>
          <Center w="40px" h="40px" color="black">
            <ArrowForwardIcon />
          </Center>
        </Box>
        <FormControl bg="cornflowerblue" flex="1" p={5}>
          <FormLabel htmlFor="to">To</FormLabel>
          <Select
            id="to"
            value={toToken}
            onChange={(event) => setToToken(event.target.value)}
          >
            <option value={NATIVE_SOL.address}>{NATIVE_SOL.symbol}</option>
            {Object.keys(tokenAccounts).map((k) => (
              <option key={TokenMap[k]?.address} value={TokenMap[k]?.address}>
                {TokenMap[k]?.symbol}
              </option>
            ))}
          </Select>
          <NumberInput
            disabled
            value={toAmount}
            precision={4}
            onChange={(_, valueAsNumber) => setToAmount(valueAsNumber)}
          >
            <NumberInputField id="toAmount" />
          </NumberInput>
        </FormControl>
      </Flex>

      <Center p={10}>
        <Button
          color="teal"
          onClick={doSwap}
          disabled={
            solBalance < 0.02 || !pool || isNaN(fromAmount) || isNaN(toAmount)
          }
        >
          swap
        </Button>
      </Center>

      {solBalance < 0.02 && (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>sol too small (0.02)</AlertTitle>
        </Alert>
      )}

      {!pool && (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>no swap route</AlertTitle>
        </Alert>
      )}
    </div>
  );
}
