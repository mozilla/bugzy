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

export interface ChannelData {
  version: string; // 115 (not 115.0a1)
  statusFlag: string; // cf_status_firefox115
  date?: string; // YYYY-MM-DD
}

export interface ReleaseData {
  nightly: ChannelData;
  beta: ChannelData;
  release: ChannelData;
}

export interface TeamData {
  [key: string]: any[];
}

export interface GlobalContextProps {
  metas: MetaBug[];
  iterations: Iterations;
  qm: QueryManager;
  releases: ReleaseData;
  teams: TeamData;
  refresh?: () => void;
}

interface GlobalContextProviderProps extends GlobalContextProps {
  children: React.ReactNode;
}

// Don't store any mutable state in here until React is updated to 18, consumers
// will not reliably re-render on context changes.
export const GlobalContextProvider: React.FC<Readonly<
  GlobalContextProviderProps
>> = ({ metas, iterations, qm, releases, teams, refresh, children }) => {
  const value: GlobalContextProps = useMemo(
    () => ({ metas, iterations, qm, releases, teams, refresh }),
    [metas, iterations, qm, releases, teams, refresh]
  );
  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};
