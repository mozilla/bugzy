import React, { useMemo, createContext } from "react";
import { Iterations } from "../../../common/IterationLookup";
import { QueryManager } from "../../lib/utils";

export const GlobalContext = createContext({} as GlobalContextProps);

export interface MetaBug {
  id: string;
  component?: string;
  priority?: string;
  displayName?: string;
}

export interface GlobalContextProps {
  metas: MetaBug[];
  iterations: Iterations;
  qm: QueryManager;
}

interface GlobalContextProviderProps extends GlobalContextProps {
  children: React.ReactNode;
}

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
