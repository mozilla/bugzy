import { getIteration } from "../../common/iterationUtils";
const release = getIteration().number.split(".")[0];
const prevRelease = release - 1;

export function postProcess(resp) {
  const bugs = resp.bugs.map(bug => {
    if (`cf_status_firefox${release}` in bug) {
      bug.cf_status_nightly = bug[`cf_status_firefox${release}`];
    }
    if (`cf_status_firefox${prevRelease}` in bug) {
      bug.cf_status_beta = bug[`cf_status_firefox${prevRelease}`];
    }
    if (`cf_tracking_firefox${prevRelease}` in bug) {
      bug.cf_tracking_beta = bug[`cf_tracking_firefox${prevRelease}`];
    }
    return bug;
  });
  return Object.assign({}, resp, bugs);
}
