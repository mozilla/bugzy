import React, { useCallback, useMemo, useRef, useContext } from "react";
import Select, { CSSObjectWithLabel } from "react-select";
import { GlobalContext } from "../GlobalContext/GlobalContext";

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

export const IterationPicker: React.FunctionComponent<IterationPickerProps> = ({
  iterations,
  currentIteration,
  match,
  history,
  ...props
}) => {
  const context = useContext(GlobalContext);
  const ref = useRef(null);
  const getLabel = useCallback(
    (iteration: string) => {
      let string = iteration;
      const { start, due } = context.iterations.getDatesForIteration(iteration);
      let startString = start.toFormat(
        start.year === due.year ? "LLL d" : "LLL d yyyy"
      );
      let dueString = due.toFormat(
        start.month === due.month ? "d yyyy" : "LLL d yyyy"
      );
      if (iteration === currentIteration) string += " (current)";
      string += ` - ${startString} - ${dueString}`;
      return string;
    },
    [context.iterations, currentIteration]
  );
  const options = useMemo(() => {
    return iterations
      .map((iteration: string) => ({
        value: iteration,
        label: getLabel(iteration),
      }))
      .reverse();
  }, [getLabel, iterations]);
  const initiallySelectedOption = useMemo(() => {
    let val = match.params.iteration;
    if (match.url === "/current_iteration") {
      val = currentIteration;
    }
    return options.find(option => option.value === val) || null;
  }, [currentIteration, match.params.iteration, match.url, options]);
  // Placeholder should only show on non-iteration pages, where it should appear
  // as a dimmed-out option representing the current iteration.
  const placeholder = useMemo(
    () =>
      options.find(option => option.value === currentIteration)?.label ||
      "Select Iteration...",
    [currentIteration, options]
  );

  const handleChange = useCallback(
    ({ value = "" } = {}) => {
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
  const handleMenuOpen = useCallback(() => {
    let { current } = ref;
    if (current && !current.state.selectValue.length) {
      current.setState({
        focusedOption: options.find(
          option => option.value === currentIteration
        ),
        focusedValue: null,
      });
      requestAnimationFrame(() => {
        current.focusedOptionRef?.scrollIntoView({ block: "nearest" });
      });
    }
  }, [currentIteration, options]);

  const styles = useMemo(
    () => ({
      valueContainer: (
        baseStyles: object,
        state: { isDisabled: boolean }
      ): CSSObjectWithLabel => ({
        ...baseStyles,
        cursor: state.isDisabled ? "default" : "text",
      }),
      placeholder: (baseStyles: object): CSSObjectWithLabel => ({
        ...baseStyles,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        marginLeft: "2px",
        marginRight: "2px",
        boxSizing: "border-box",
      }),
    }),
    []
  );

  return (
    <Select
      {...props}
      ref={ref}
      value={initiallySelectedOption}
      placeholder={placeholder}
      isSearchable={true}
      name="iteration"
      options={options}
      onChange={handleChange}
      onMenuOpen={handleMenuOpen}
      menuPlacement="auto"
      styles={styles}
    />
  );
};
