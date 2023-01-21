import React from "react";
import { Iterations } from "../../../common/IterationLookup";
import { QueryManager } from "../../lib/utils";

export const GlobalContext = React.createContext({} as GlobalContextProps);

export interface MetaBug {
  id: string;
  component?: string;
  priority?: string;
  displayName?: string;
}

interface GlobalContextProviderProps {
  metas: MetaBug[];
  iterations: Iterations;
  qm: QueryManager;
}

export interface GlobalContextProps extends GlobalContextProviderProps {
  setMetas: (metas: MetaBug[]) => void;
  setIterations: (iterations: Iterations) => void;
}

export class GlobalContextProvider extends React.Component<
  Readonly<GlobalContextProviderProps>
> {
  declare state: GlobalContextProps;

  constructor(props: Readonly<GlobalContextProviderProps>) {
    super(props);
    this.state = {
      metas: props.metas,
      iterations: props.iterations,
      qm: props.qm,
      setMetas: (metas: MetaBug[]) => {
        this.setState({ metas });
      },
      setIterations: (iterations: Iterations) => {
        this.setState({ iterations });
      },
    };
  }

  render() {
    return (
      <GlobalContext.Provider value={this.state}>
        {this.props.children}
      </GlobalContext.Provider>
    );
  }
}
