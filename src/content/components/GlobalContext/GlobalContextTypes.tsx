import { Iterations } from "../../../common/IterationLookup";
import { QueryManager } from "../../lib/utils";

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

export interface GlobalContextProviderProps extends GlobalContextProps {
  children: React.ReactNode;
}
