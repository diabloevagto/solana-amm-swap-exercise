import { TokenListProvider } from '@solana/spl-token-registry';

let TokenList = [];
let TokenMap = {};

const NATIVE_SOL = {
  symbol: 'SOL',
  name: 'Native Solana',
  address: '11111111111111111111111111111111',
  decimals: 9,
};

new TokenListProvider().resolve().then((tokens) => {
  TokenList = tokens.filterByClusterSlug('mainnet-beta').getList();
  TokenMap = TokenList.reduce((acc, curr) => {
    acc[curr.address] = curr;
    return acc;
  }, {});
});
export { NATIVE_SOL, TokenList, TokenMap };
