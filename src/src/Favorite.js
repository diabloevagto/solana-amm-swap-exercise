import { Box, Button } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { NATIVE_SOL, TokenMap } from 'src/constants';

export default function Favorite(props) {
  const { from, to, onClick } = props;

  const [list, setList] = useState([]);

  useEffect(() => {
    setList(JSON.parse(window.localStorage.getItem('favorite_list')));
  }, []);

  useEffect(() => {
    window.localStorage.setItem('favorite_list', JSON.stringify(list));
  }, [list]);

  const getSymbol = (address) => {
    if (address === NATIVE_SOL.address) {
      return NATIVE_SOL.symbol;
    }

    return TokenMap[address]?.symbol;
  };

  return (
    <div>
      <Button
        color="teal"
        onClick={() => {
          if (list.findIndex((v) => v.from === from && v.to === to) === -1) {
            setList([...list, { from, to }]);
          }
        }}
      >
        ADD FAVORITE
      </Button>
      {list.map(({ from, to }, idx) => (
        <Box
          key={idx}
          bg="gray"
          maxW="m"
          m={2}
          p={4}
          color="white"
          onClick={() => onClick(from, to)}
        >
          {`${getSymbol(from)} -> ${getSymbol(to)}`}
        </Box>
      ))}
    </div>
  );
}
