import React, { useMemo, createContext } from "react";
import {
  GlobalContextProps,
  GlobalContextProviderProps,
} from "./GlobalContextTypes";

export const GlobalContext = createContext({} as GlobalContextProps);

// Don't store any mutable state in here until React is updated to 18, consumers
// will not reliably re-render on context changes.
export const GlobalContextProvider: React.FC<Readonly<
  GlobalContextProviderProps
>> = ({ metas, iterations, qm, children }) => {
  const value: GlobalContextProps = useMemo(() => ({ metas, iterations, qm }), [
    metas,
    iterations,
    qm,
  ]);
  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};
