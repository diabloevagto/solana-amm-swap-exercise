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
import { isEmpty } from 'lodash-es';

import { NATIVE_SOL, TokenList, TokenMap } from 'src/constants';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { getPoolByTokenMintAddresses } from 'src/utils/pools';
import { getSwapOutAmount, swap } from 'src/utils/swap';
import ContextStore from 'src/store';

export default function Swap() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { solBalance, tokenAccounts, liquidityPools } =
    useContext(ContextStore);
  const [fromToken, setFromToken] = useState(NATIVE_SOL.address);
  const [toToken, setToToken] = useState(
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // usdc
  );
  const [fromAmount, setFromAmount] = useState(0);
  const [toAmount, setToAmount] = useState(0);
  const [slippage, setSlippage] = useState(3);
  const [pool, setPool] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const action = async () => {
      const p = getPoolByTokenMintAddresses(fromToken, toToken);
      console.log(p);

      const poolWithFees = Object.values(liquidityPools).find(
        (v) => v.ammId === p?.ammId,
      );
      console.log(poolWithFees);

      setPool(poolWithFees);

      if (!!poolWithFees) {
        const f = getSwapOutAmount(
          poolWithFees,
          fromToken,
          toToken,
          fromAmount,
          slippage,
        );

        setToAmount(f.amountOutWithSlippage.format());
      }
    };
    setIsLoading(true);
    !isEmpty(liquidityPools) && action();
    setIsLoading(false);
  }, [fromAmount, fromToken, liquidityPools, pool?.ammId, slippage, toToken]);

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
            {TokenList.filter((k) => !tokenAccounts[k.address]).map((k) => (
              <option key={k?.address} value={k?.address}>
                {k?.symbol}
              </option>
            ))}
          </Select>
          <NumberInput
            defaultValue={fromAmount}
            precision={8}
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
            {TokenList.filter((k) => !tokenAccounts[k.address]).map((k) => (
              <option key={k?.address} value={k?.address}>
                {k?.symbol}
              </option>
            ))}
          </Select>
          <NumberInput
            disabled
            value={toAmount}
            precision={8}
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
          isLoading={isLoading}
          disabled={
            isLoading ||
            solBalance < 0.02 ||
            !pool ||
            isNaN(fromAmount) ||
            isNaN(toAmount)
          }
        >
          swap
        </Button>
      </Center>

      <FormControl>
        <FormLabel htmlFor="email">slippage</FormLabel>
        <Select
          id="slippage"
          value={slippage}
          onChange={(event) => setSlippage(event.target.value)}
        >
          {[0.1, 3, 5, 10].map((v) => (
            <option key={v} value={v}>
              {v}%
            </option>
          ))}
        </Select>
      </FormControl>

      <p>slippage: {slippage}</p>

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
