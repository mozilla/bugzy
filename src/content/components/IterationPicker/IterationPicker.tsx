import React, { useCallback, useMemo } from "react";
import Select from "react-select";

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

export const IterationPicker = ({
  iterations,
  currentIteration,
  match,
  history,
  ...props
}: IterationPickerProps) => {
  const handleChange = useCallback(
    ({ value } = {}) => {
      // When the selected option changes, we want to redirect to the new
      // iteration (with push). So check if the selected option is different
      // from the matched iteration, counting "/current_iteration" as
      // "/iteration/:iteration" but redirecting to "/current_iteration".
      // If the selected option is different, redirect to the new iteration.
      // If the selected option is the same, do nothing.
      let path: string;
      switch (value) {
        case currentIteration:
          path =
            match.url === "/current_iteration" ? null : "/current_iteration";
          break;
        case match.params.iteration:
          break;
        default:
          path = `/iteration/${value}`;
      }
      if (path) {
        history.push(path);
      }
    },
    [currentIteration, history, match.params.iteration, match.url]
  );
  const getLabel = useCallback(
    (iteration: string) =>
      iteration === currentIteration ? `${iteration} (current)` : iteration,
    [currentIteration]
  );
  const options = useMemo(() => {
    return iterations
      .map((iteration: string) => ({
        value: iteration,
        label: getLabel(iteration),
      }))
      .reverse();
  }, [getLabel, iterations]);
  const initialValue = useMemo(() => {
    let val = match.params.iteration;
    if (match.url === "/current_iteration") {
      val = currentIteration;
    }
    return options.find(option => option.value === val) || null;
  }, [currentIteration, match.params.iteration, match.url, options]);
  const placeholder = useMemo(
    () =>
      options.find(
        option => option.value === (match.params.iteration || currentIteration)
      )?.label || null,
    [currentIteration, match.params.iteration, options]
  );
  return (
    <Select
      {...props}
      value={initialValue}
      placeholder={placeholder}
      isSearchable={true}
      name="iteration"
      options={options}
      onChange={handleChange}
      styles={{
        valueContainer: (baseStyles, state) => ({
          ...baseStyles,
          cursor: state.isDisabled ? "default" : "text",
        }),
      }}
    />
  );
};
