export interface IterationPickerProps {
  iterations: string[];
  currentIteration: string;
  match: {
    params: { [key: string]: string };
    isExact: boolean;
    path: string;
    url: string;
  };
  history: {
    push(location: string, state?: unknown): void;
  };
}
