// const EPIC_BUG_ID = 1433315;

module.exports = {
  defect: {
    style: { color: "var(--red-50)", fontWeight: "bold" },
    label: "defect",
  },
  enhancement: {
    style: { color: "var(--green-50)", fontWeight: "bold" },
    label: "enhancement",
  },
  needinfo: {
    style: { color: "var(--gray-90)", fontWeight: "bold" },
    label: "🤔 needinfo",
  },
  regression: {
    style: {
      backgroundColor: "var(--red-50)",
      color: "white",
      border: 0,
      fontWeight: "bold",
    },
    label: "😢 regression",
  },
  "has-pr": {
    style: {
      backgroundColor: "var(--green-50)",
      color: "white",
      border: 0,
      fontWeight: "bold",
    },
    label: "has PR",
  },
  uiwanted: {
    label: "uiwanted",
    style: {
      backgroundColor: "var(--magenta-60)",
      color: "white",
      border: 0,
      fontWeight: "bold",
    },
  },
  "strings needed": {
    label: "strings needed",
    style: {
      backgroundColor: "var(--teal-60)",
      color: "white",
      border: 0,
      fontWeight: "bold",
    },
  },
  "strings landed": {
    label: "strings landed",
    style: { color: "var(--teal-60)" },
  },
  "strings m-c needed": {
    label: "strings m-c needed",
    style: {
      backgroundColor: "var(--teal-80",
      color: "white",
      border: 0,
      fontWeight: "bold",
    },
  },
  task: {
    label: "chore",
    style: {
      backgroundColor: "var(--purple-60)",
      color: "white",
      border: 0,
      fontWeight: "bold",
    },
  },
};
