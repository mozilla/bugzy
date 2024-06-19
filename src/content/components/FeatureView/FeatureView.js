import React, { useContext, useEffect, useMemo, useState } from "react";
import { BugList } from "../BugList/BugList";
import { CopyButton } from "../CopyButton/CopyButton";
import { isBugResolved } from "../../lib/utils";
import { GlobalContext } from "../GlobalContext/GlobalContext";
import { Container } from "../ui/Container/Container";
import { Tabs } from "../ui/Tabs/Tabs";
import { Loader, MiniLoader } from "../Loader/Loader";
import { removeMeta } from "../../../common/removeMeta";
import * as gStyles from "../../styles/gStyles.module.scss";

const displayColumns = [
  "id",
  "type",
  "summary",
  "assigned_to",
  "cf_fx_iteration",
  "priority",
  "cf_fx_points",
];

function sortOpen(a, b) {
  const a1 = a.assigned_to;
  const a2 = b.assigned_to;
  const isAUnassigned = a.cf_fx_iteration === "---";
  const isBUnassigned = b.cf_fx_iteration === "---";

  if (a.priority < b.priority) {
    return -1;
  }
  if (a.priority > b.priority) {
    return 1;
  }

  // Sort unassigned to the bottom
  if (isAUnassigned && !isBUnassigned) {
    return 1;
  }
  if (!isAUnassigned && isBUnassigned) {
    return -1;
  }

  if (a.cf_fx_iteration < b.cf_fx_iteration) {
    return -1;
  }
  if (a.cf_fx_iteration > b.cf_fx_iteration) {
    return 1;
  }

  if (a1 < a2) {
    return -1;
  }
  if (a1 > a2) {
    return 1;
  }

  return 0;
}

function bulkEditAll() {
  let items = [...document.querySelectorAll("input[data-bug-id]")];
  let checkedItems = items.filter(i => i.checked);
  if (checkedItems.length) {
    items = checkedItems;
  }
  const bugIds = items.map(i => i.value).filter(v => parseInt(v, 10));
  let url = `https://bugzilla.mozilla.org/buglist.cgi?bug_id=${bugIds.join(
    ","
  )}&order=bug_id&tweak=1`;
  window.open(url, "_blank");
}

const FeatureBugList = ({
  visibleIfEmpty = false,
  bugs,
  title,
  columns = displayColumns,
  ...restProps
}) => {
  return (
    <React.Fragment>
      <BugList
        title={title}
        compact={true}
        showResolvedOption={false}
        bulkEdit={true}
        tags={true}
        bugs={bugs}
        columns={columns}
        visibleIfEmpty={visibleIfEmpty}
        {...restProps}
      />
    </React.Fragment>
  );
};

const OpenView = ({
  id,
  parentMeta,
  component,
  currentRelease,
  nextRelease,
  includeFields,
}) => {
  const { qm } = useContext(GlobalContext);

  const [loaded, setLoaded] = useState(false);
  const [awaitingNetwork, setAwaitingNetwork] = useState(false);
  const [bugs, setBugs] = useState({
    untriaged: [],
    current: [],
    currentBySubMeta: {},
    next: [],
    nextBySubMeta: {},
    backlog: [],
    backlogBySubMeta: {},
    uplift: [],
  });
  const [subMetas, setSubMetas] = useState([]);

  useEffect(() => {
    if (!id) {
      return;
    }

    let isMounted = true;

    setLoaded(false);
    setAwaitingNetwork(false);
    setBugs({
      untriaged: [],
      current: [],
      currentBySubMeta: {},
      next: [],
      nextBySubMeta: {},
      backlog: [],
      backlogBySubMeta: {},
      uplift: [],
    });
    setSubMetas([]);

    const subMetaQuery = {
      include_fields: includeFields,
      resolution: "---",
      rules: [
        { key: "blocked", operator: "equals", value: id },
        { key: "keywords", operator: "anyexact", value: "meta" },
      ],
    };
    const allBugsQuery = subMetas => {
      return {
        include_fields: includeFields,
        resolution: "---",
        rules: [
          {
            key: "blocked",
            operator: "anywordssubstr",
            value: [...subMetas.map(m => m.id), id].join(","),
          },
          { key: "keywords", operator: "nowordssubstr", value: "meta" },
        ],
      };
    };

    const predicate = () => isMounted;
    qm.runCachedQueries(
      subMetaQuery,
      predicate,
      ({ rsp: { bugs: subMetas } }) =>
        qm.runCachedQueries(
          allBugsQuery(subMetas),
          predicate,
          ({ rsp: { bugs }, awaitingNetwork: newAwaitingNetwork }) => {
            const result = {
              untriaged: [],
              current: [],
              currentBySubMeta: {},
              next: [],
              nextBySubMeta: {},
              backlog: [],
              backlogBySubMeta: {},
              uplift: [],
            };

            if (subMetas.length) {
              subMetas.forEach(b => {
                result.currentBySubMeta[b.id] = [];
                result.nextBySubMeta[b.id] = [];
                result.backlogBySubMeta[b.id] = [];
              });
            }

            for (const bug of bugs) {
              if (
                ["?", "+", "blocking"].includes(bug.cf_tracking_beta) &&
                !["fixed", "verified"].includes(bug.cf_status_beta)
              ) {
                result.uplift.push(bug);
              } else if (bug.priority === "P1") {
                // For now, we're only sorting bugs by meta that are P1 and unresolved.
                if (subMetas.length) {
                  let subMetaMatch = subMetas.filter(m =>
                    bug.blocks.includes(m.id)
                  );
                  if (subMetaMatch.length) {
                    subMetaMatch.forEach(m =>
                      result.currentBySubMeta[m.id].push(bug)
                    );
                  } else {
                    result.current.push(bug);
                  }
                } else {
                  result.current.push(bug);
                }
              } else if (bug.priority === "P2") {
                // Adding in meta sorting for P2
                if (subMetas.length) {
                  let subMetaMatch = subMetas.filter(m =>
                    bug.blocks.includes(m.id)
                  );
                  if (subMetaMatch.length) {
                    subMetaMatch.forEach(m =>
                      result.nextBySubMeta[m.id].push(bug)
                    );
                  } else {
                    result.next.push(bug);
                  }
                } else {
                  result.next.push(bug);
                }
              } else if (bug.priority === "--") {
                result.untriaged.push(bug);
              } else {
                // Adding in meta sorting for Backlog
                // eslint-disable-next-line no-lonely-if
                if (subMetas.length) {
                  let subMetaMatch = subMetas.filter(m =>
                    bug.blocks.includes(m.id)
                  );
                  if (subMetaMatch.length) {
                    subMetaMatch.forEach(m =>
                      result.backlogBySubMeta[m.id].push(bug)
                    );
                  } else {
                    result.backlog.push(bug);
                  }
                } else {
                  result.backlog.push(bug);
                }
              }
            }
            result.uplift.sort(sortOpen);
            result.current.sort(sortOpen);
            Object.keys(result.currentBySubMeta).forEach(id =>
              result.currentBySubMeta[id].sort(sortOpen)
            );
            result.next.sort(sortOpen);
            Object.keys(result.nextBySubMeta).forEach(id =>
              result.nextBySubMeta[id].sort(sortOpen)
            );
            result.backlog.sort(sortOpen);
            Object.keys(result.backlogBySubMeta).forEach(id =>
              result.backlogBySubMeta[id].sort(sortOpen)
            );
            setLoaded(true);
            setAwaitingNetwork(newAwaitingNetwork);
            setBugs(result);
            setSubMetas(subMetas);
          }
        )
    );
    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return loaded ? (
    <React.Fragment>
      <FeatureBugList title="Untriaged bugs" bugs={bugs.untriaged} />
      <FeatureBugList
        title="Uplift candidates"
        bugs={bugs.uplift}
        columns={[...displayColumns, "cf_status_nightly", "cf_status_beta"]}
      />
      {subMetas.length ? (
        <>
          {[...Object.values(bugs.currentBySubMeta), bugs.current].some(
            bugs => bugs.length
          ) ? (
            <h3>Required for Current Release (Firefox {currentRelease})</h3>
          ) : null}
          {[
            ...Object.keys(bugs.currentBySubMeta).map(id => {
              const meta = subMetas.find(m => String(m.id) === id);
              return (
                <FeatureBugList
                  key={meta.id}
                  subtitle={removeMeta(meta.summary)}
                  meta={meta.id}
                  fileNew={`blocked=${meta.id},${parentMeta}&component=${component}`}
                  bugs={bugs.currentBySubMeta[meta.id]}
                />
              );
            }),
            <FeatureBugList key="other" subtitle="Other" bugs={bugs.current} />,
          ]}
        </>
      ) : (
        <>
          {bugs.current.length ? (
            <h3>Required for Current Release (Firefox {currentRelease})</h3>
          ) : null}
          <FeatureBugList bugs={bugs.current} />
        </>
      )}
      {subMetas.length ? (
        <>
          {[...Object.values(bugs.nextBySubMeta), bugs.next].some(
            bugs => bugs.length
          ) ? (
            <h3>Required for Next Release (Firefox {nextRelease})</h3>
          ) : null}
          {[
            ...Object.keys(bugs.nextBySubMeta).map(id => {
              const meta = subMetas.find(m => String(m.id) === id);
              return (
                <FeatureBugList
                  key={meta.id}
                  subtitle={removeMeta(meta.summary)}
                  meta={meta.id}
                  fileNew={`blocked=${meta.id},${parentMeta}&component=${component}`}
                  bugs={bugs.nextBySubMeta[meta.id]}
                />
              );
            }),
            <FeatureBugList key="other" subtitle="Other" bugs={bugs.next} />,
          ]}
        </>
      ) : (
        <>
          {bugs.next.length ? (
            <h3>Required for Next Release (Firefox {nextRelease})</h3>
          ) : null}
          <FeatureBugList bugs={bugs.next} />
        </>
      )}
      {subMetas.length ? (
        <>
          {[...Object.values(bugs.backlogBySubMeta), bugs.backlog].some(
            bugs => bugs.length
          ) ? (
            <h3>Backlog</h3>
          ) : null}
          {[
            ...Object.keys(bugs.backlogBySubMeta).map(id => {
              const meta = subMetas.find(m => String(m.id) === id);
              return (
                <FeatureBugList
                  key={meta.id}
                  subtitle={removeMeta(meta.summary)}
                  meta={meta.id}
                  fileNew={`blocked=${meta.id},${parentMeta}&component=${component}`}
                  bugs={bugs.backlogBySubMeta[meta.id]}
                />
              );
            }),
            <FeatureBugList key="other" subtitle="Other" bugs={bugs.backlog} />,
          ]}
        </>
      ) : (
        <>
          {bugs.backlog.length ? <h3>Backlog</h3> : null}
          <FeatureBugList bugs={bugs.backlog} />
        </>
      )}
      <p>
        <button className={gStyles.primaryButton} onClick={bulkEditAll}>
          Edit all in Bugzilla
        </button>
      </p>
      <MiniLoader hidden={!awaitingNetwork} />
    </React.Fragment>
  ) : (
    <Loader />
  );
};

const ResolvedView = ({ id, includeFields }) => {
  const { qm } = useContext(GlobalContext);

  const [loaded, setLoaded] = useState(false);
  const [awaitingNetwork, setAwaitingNetwork] = useState(false);
  const [bugs, setBugs] = useState({
    nightlyResolved: [],
    betaResolved: [],
    releaseResolved: [],
    resolved: [],
  });

  const resolvedIncludeFields = useMemo(
    () => includeFields.filter(f => !["cf_fx_points"].includes(f)),
    [includeFields]
  );

  useEffect(() => {
    if (!id) {
      return;
    }

    let isMounted = true;

    setLoaded(false);
    setAwaitingNetwork(false);
    setBugs({
      nightlyResolved: [],
      betaResolved: [],
      releaseResolved: [],
      resolved: [],
    });

    const subMetaQuery = {
      include_fields: resolvedIncludeFields,
      resolution: ["---", "FIXED"],
      rules: [
        { key: "blocked", operator: "equals", value: id },
        { key: "keywords", operator: "anyexact", value: "meta" },
      ],
    };
    const allBugsQuery = subMetas => {
      return {
        include_fields: resolvedIncludeFields,
        resolution: "FIXED",
        order: "cf_last_resolved DESC",
        rules: [
          {
            key: "blocked",
            operator: "anywordssubstr",
            value: [...subMetas.map(m => m.id), id].join(","),
          },
          { key: "keywords", operator: "nowordssubstr", value: "meta" },
        ],
      };
    };

    const predicate = () => isMounted;
    qm.runCachedQueries(
      subMetaQuery,
      predicate,
      ({ rsp: { bugs: subMetas } }) =>
        qm.runCachedQueries(
          allBugsQuery(subMetas),
          predicate,
          ({ rsp: { bugs }, awaitingNetwork: newAwaitingNetwork }) => {
            const result = {
              nightlyResolved: [],
              betaResolved: [],
              releaseResolved: [],
              resolved: [],
            };
            for (const bug of bugs) {
              if (isBugResolved(bug)) {
                if (["fixed", "verified"].includes(bug.cf_status_beta)) {
                  result.betaResolved.push(bug);
                } else if (
                  ["fixed", "verified"].includes(bug.cf_status_nightly)
                ) {
                  result.nightlyResolved.push(bug);
                } else if ("---" === bug.target_milestone) {
                  result.resolved.push(bug);
                } else {
                  result.releaseResolved.push(bug);
                }
              }
            }
            setLoaded(true);
            setAwaitingNetwork(newAwaitingNetwork);
            setBugs(result);
          }
        )
    );
    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return loaded ? (
    <React.Fragment>
      <FeatureBugList
        title="Resolved in Nightly"
        crossOutResolved={false}
        bugs={bugs.nightlyResolved}
        columns={[
          "id",
          "type",
          "summary",
          "assigned_to",
          "cf_status_nightly",
          "cf_status_beta",
          "priority",
        ]}
      />
      <FeatureBugList
        title="Resolved in Beta"
        crossOutResolved={false}
        bugs={bugs.betaResolved}
        columns={[
          "id",
          "type",
          "summary",
          "assigned_to",
          "cf_status_nightly",
          "cf_status_beta",
          "priority",
        ]}
      />
      <FeatureBugList
        title="Resolved in Release"
        crossOutResolved={false}
        bugs={bugs.releaseResolved}
        columns={[
          "id",
          "type",
          "summary",
          "assigned_to",
          "target_milestone",
          "priority",
        ]}
      />
      <FeatureBugList
        title="Other"
        crossOutResolved={false}
        bugs={bugs.resolved}
        columns={[
          "id",
          "type",
          "summary",
          "assigned_to",
          "cf_fx_iteration",
          "priority",
        ]}
      />
      <p>
        <button className={gStyles.primaryButton} onClick={bulkEditAll}>
          Edit all in Bugzilla
        </button>
      </p>
      <MiniLoader hidden={!awaitingNetwork} />
    </React.Fragment>
  ) : (
    <Loader />
  );
};

export const FeatureView = ({ id, url, displayName, component }) => {
  const { iterations } = useContext(GlobalContext);

  const currentRelease = useMemo(
    () => iterations.getIteration().number.split(".")[0],
    [iterations]
  );
  const prevRelease = useMemo(
    () => parseInt(currentRelease, 10) - 1,
    [currentRelease]
  );
  const nextRelease = useMemo(
    () => parseInt(currentRelease, 10) + 1,
    [currentRelease]
  );
  const upliftTrackingField = useMemo(
    () => `cf_tracking_firefox${prevRelease}`,
    [prevRelease]
  );
  const includeFields = useMemo(
    () =>
      displayColumns.concat([
        "target_milestone",
        "status",
        "resolution",
        "last_change_time",
        "whiteboard",
        "keywords",
        "flags",
        "blocks",
        "type",
        "cf_fx_points",
        upliftTrackingField,
        `cf_status_firefox${prevRelease}`,
        `cf_status_firefox${currentRelease}`,
        "cf_last_resolved",
      ]),
    [currentRelease, prevRelease, upliftTrackingField]
  );

  return (
    <Container
      loaded={true}
      key={id}
      heading={
        <a href={`https://bugzilla.mozilla.org/show_bug.cgi?id=${id}`}>
          {displayName}
        </a>
      }
      fileBug={`blocked=${id}&component=${component}`}
      subHeading={
        <React.Fragment>
          This list includes bugs in any component blocking meta bug{" "}
          <a href={`https://bugzilla.mozilla.org/show_bug.cgi?id=${id}`}>
            {" "}
            {id}
          </a>{" "}
          <CopyButton text={id} title="Copy bug number" />
        </React.Fragment>
      }
      title={displayName}>
      <Tabs
        baseUrl={url}
        config={[
          {
            path: "",
            label: "Open",
            render: props => (
              <OpenView
                {...props}
                id={id}
                component={component}
                parentMeta={id}
                currentRelease={currentRelease}
                nextRelease={nextRelease}
                includeFields={includeFields}
              />
            ),
          },
          {
            path: "/resolved",
            label: "Resolved",
            render: props => (
              <ResolvedView {...props} id={id} includeFields={includeFields} />
            ),
          },
        ]}
      />
    </Container>
  );
};
