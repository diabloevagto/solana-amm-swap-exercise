import React, { createContext, useReducer } from 'react';

const ContextStore = createContext();

const initStore = {
  solBalance: 0,
  tokenAccounts: {},
  liquidityPools: {},
  auxiliaryTokenAccounts: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'DO_UPDATE':
      return Object.assign({}, state, action.payload);
    default:
      return state;
  }
};

const WrapContext = (props) => {
  const [state, dispatch] = useReducer(reducer, initStore);

  return (
    <ContextStore.Provider
      value={{
        ...state,
        dispatch,
      }}
    >
      {props.children}
    </ContextStore.Provider>
  );
};

export default ContextStore;
export { WrapContext };
