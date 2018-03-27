const EPIC_BUG_ID = 1433315;

module.exports = {
  "DEFECT": {
    style: {color: "var(--red-50)", fontWeight: "bold"},
    label: "defect"
  },
  "regression": {
    style: {backgroundColor: "var(--red-50)", color: "white", border: 0, fontWeight: "bold"},
    label: "😢 regression"
  },
  "HAS-PR": {
    style: {backgroundColor: "var(--green-50)", color: "white", border: 0, fontWeight: "bold"},
    label: "has PR"
  },
  "uiwanted": {
    label: "😎 uiwanted",
    style: {backgroundColor: "var(--magenta-60", color: "white", border: 0, fontWeight: "bold"}
  },
  "strings needed": {
    label: "strings needed",
    style: {backgroundColor: "var(--teal-60", color: "white", border: 0, fontWeight: "bold"}
  },
  "strings landed": {
    label: "strings landed",
    style: {color: "var(--teal-60",}
  },
  "strings m-c needed": {
    label: "strings m-c needed",
    style: {backgroundColor: "var(--teal-80", color: "white", border: 0, fontWeight: "bold"}
  }
};
