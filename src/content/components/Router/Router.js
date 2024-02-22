import React, { useCallback, useContext } from "react";
import * as styles from "./Router.module.scss";
import { BugListView } from "../BugListView/BugListView";
import {
  BrowserRouter,
  NavLink,
  Redirect,
  Route,
  Switch,
  withRouter,
} from "react-router-dom";
import { GlobalContext } from "../GlobalContext/GlobalContext";
import { columnTransforms as cTrans } from "../BugList/columnTransforms";
import { IterationView } from "../IterationView/IterationView";
import { MyBugs } from "../MyBugs/MyBugs";
import { AboutView } from "../AboutView/AboutView";
import { FeatureView } from "../FeatureView/FeatureView";
import { OtherView } from "../OtherView/OtherView";
import { Triage } from "../Triage/Triage";
import { GeneralTriage } from "../GeneralTriage/GeneralTriage";
import { Uplift } from "../Uplift/Uplift";
import { FeatureList } from "../FeatureList/FeatureList";
import { ActiveRSMessages } from "../ActiveRSMessages/ActiveRSMessages";
import { PriorityGuide } from "../PriorityGuide/PriorityGuide";
import { ReleaseReport } from "../ReleaseReport/ReleaseReport";
import { IterationPicker } from "../IterationPicker/IterationPicker";
import { BUGZILLA_TRIAGE_COMPONENTS } from "../../../config/project_settings";
import { isBugResolved } from "../../lib/utils";
import { removeMeta } from "../../../common/removeMeta";
import { UnassignedView } from "../UnassignedView/UnassignedView";
import { SettingsView } from "../SettingsView/SettingsView";
import { AllocationView } from "../AllocationView/AllocationView";
import { JiraView } from "../JiraView/JiraView";
import { ErrorView } from "../ErrorView/ErrorView";

const RouterNav = withRouter(({ routes }) => {
  const context = useContext(GlobalContext);
  const renderListItem = useCallback((route, i) => {
    return (
      <li key={i}>
        <NavLink
          activeClassName={styles.active}
          className={styles.navLink}
          to={route.routeProps ? route.routeProps.path : route.path}>
          {route.icon ? (
            <span
              className={`${styles.icon} ${styles[`icon-${route.icon}`]}`}
            />
          ) : null}
          <span>{route.label}</span>
        </NavLink>
      </li>
    );
  }, []);
  const getListItem = useCallback(
    (route, i) => {
      if (route.spacer) {
        return <li key={i} className={styles.spacer} />;
      } else if (route.header) {
        return (
          <li key={i} className={styles.header}>
            {route.header}
          </li>
        );
      } else if (route.customRender) {
        return <li key={i}>{route.customRender()}</li>;
      }
      return renderListItem(route, i);
    },
    [renderListItem]
  );
  return (
    <nav className={styles.aside}>
      <ul>
        {routes.filter(route => !route.hidden).map(getListItem)}
        <li>
          <a
            className={styles.navLink}
            href="https://github.com/mozilla/bugzy/issues/new/choose"
            target="_blank"
            rel="noopener noreferrer">
            <span className={`${styles.icon} ${styles["icon-report"]}`} />
            Report an issue
          </a>
        </li>
        <li>
          <a className={styles.navLink} onClick={context.refresh} href="#">
            <span className={`${styles.icon} ${styles["icon-refresh"]}`} />
            Refresh server caches
          </a>
        </li>
      </ul>
    </nav>
  );
});

export class Router extends React.PureComponent {
  static contextType = GlobalContext;

  getMetaLinks(component = "Messaging System") {
    return this.context.metas
      .filter(
        meta =>
          meta.priority === "P1" &&
          !isBugResolved(meta) &&
          meta.component === component
      )
      .sort((a, b) => {
        if (a.priority < b.priority) {
          return -1;
        }
        if (a.priority > b.priority) {
          return 1;
        }
        return a.displayName.localeCompare(b.displayName);
      })
      .map(meta => ({
        path: `/feature/${meta.id}`,
        label: `${meta.priority !== "P1" ? `[${meta.priority}] ` : ""}${
          meta.displayName
        }`,
      }));
  }

  render() {
    const iterations = this.context.iterations.orderedVersionStrings;
    const currentIteration = this.context.iterations.getIteration();
    const nextIteration = this.context.iterations.getAdjacentIteration(1);
    const release = currentIteration.number.split(".")[0];
    const prevRelease = release - 1;

    const metaLinks = this.getMetaLinks();

    const ROUTER_CONFIG = [
      {
        navOnly: true,
        customRender: () => (
          <NavLink
            activeClassName={null}
            className={`${styles.navLink} ${styles.logo}`}
            to={"/"}>
            <span className={`${styles.icon} ${styles["icon-logo"]}`} />
            <span>bugzy</span>
          </NavLink>
        ),
      },
      {
        label: "Current Iteration",
        exact: false,
        icon: "calendar",
        routeProps: {
          path: "/current_iteration",
          render: props => (
            <IterationView
              {...props}
              iteration={currentIteration.number}
              currentIteration={currentIteration}
            />
          ),
        },
      },
      {
        label: "Next Iteration",
        exact: false,
        icon: "calendar2",
        path: `/iteration/${nextIteration.number}`,
        navOnly: true,
      },
      {
        label: "Unassigned P1/P2",
        exact: false,
        icon: "hourglass",
        routeProps: {
          path: "/unassigned",
          render: () => <UnassignedView />,
        },
      },
      {
        label: `Uplifts`,
        icon: "up-arrow",
        routeProps: {
          path: "/uplift",
          render: () => <Uplift {...{ release, prevRelease }} />,
        },
      },
      {
        label: "Iteration",
        exact: false,
        routeProps: {
          path: "/iteration/:iteration",
          render: props => {
            const { iteration } = props.match.params;
            if (!iterations.includes(iteration)) {
              return (
                <ErrorView
                  header={"Invalid Route"}
                  subheader={"The page you were looking for was not found."}
                  buttonText={"Current Iteration"}
                  buttonHref={"/current_iteration"}
                />
              );
            }
            return (
              <IterationView
                {...props}
                iteration={iteration}
                currentIteration={currentIteration}
              />
            );
          },
        },
        hidden: true,
      },
      {
        label: "Triage",
        exact: false,
        icon: "inbox",
        routeProps: {
          path: "/triage",
          render: props => <Triage {...props} />,
        },
      },
      {
        label: "Jira Tickets",
        icon: "jira",
        exact: false,
        routeProps: {
          path: "/jira",
          render: props => <JiraView {...props} release={release} />,
        },
      },
      {
        label: "Engineering Allocation",
        icon: "capacity",
        exact: false,
        routeProps: {
          path: "/allocation",
          render: props => <AllocationView {...props} release={release} />,
        },
      },
      {
        label: "Release Report",
        exact: false,
        icon: "graph",
        routeProps: {
          path: "/release/:iteration",
          render: props => {
            const { iteration } = props.match.params;
            if (!iterations.includes(iteration)) {
              return (
                <ErrorView
                  header={"Invalid Route"}
                  subheader={"The page you were looking for was not found."}
                  buttonText={"Current Iteration"}
                  buttonHref={"/current_iteration"}
                />
              );
            }
            return <ReleaseReport {...props} iteration={iteration} />;
          },
        },
        hidden: true,
      },
      { spacer: true },
      { header: "Select Iteration" },
      {
        icon: "calendar2",
        navOnly: true,
        customRender: () => (
          <Route
            path={["/current_iteration", "/iteration/:iteration", "*"]}
            render={({ match, history }) => (
              <IterationPicker
                match={match}
                history={history}
                aria-label="Select Iteration"
                iterations={iterations}
                currentIteration={currentIteration.number}
              />
            )}
          />
        ),
      },
      { spacer: true },
      {
        label: "My Bugs",
        icon: "user",
        routeProps: {
          path: "/my_bugs",
          component: MyBugs,
        },
      },
      {
        label: "General Triage",
        icon: "stethoscope",
        exact: false,
        routeProps: {
          path: "/general_triage",
          render: props => <GeneralTriage {...props} />,
        },
      },
      {
        label: "Regression",
        icon: "warning",
        routeProps: {
          path: "/regression",
          render: () => (
            <BugListView
              title="Regression"
              query={{
                component: BUGZILLA_TRIAGE_COMPONENTS,
                keywords: ["regression"],
                resolution: "---",
                order: "cf_fx_iteration DESC",
              }}
            />
          ),
        },
      },
      {
        label: "All Features",
        icon: "balloons",
        routeProps: {
          path: "/feature_list",
          render: () => <FeatureList />,
        },
      },
      {
        label: "RS Messages",
        icon: "graph",
        routeProps: {
          path: "/rs-messages",
          render: () => <ActiveRSMessages />,
        },
      },
      {
        label: "Feature",
        exact: false,
        routeProps: {
          path: "/feature/:id",
          render: props => {
            const metaId = Number(props.match.params.id);
            const meta = this.context.metas.find(m => m.id === metaId);
            if (!meta) {
              return (
                <ErrorView
                  header={"Invalid Route"}
                  subheader={"The page you were looking for was not found."}
                  buttonText={"Current Iteration"}
                  buttonHref={"/current_iteration"}
                />
              );
            }
            return <FeatureView {...props} />;
          },
        },
        hidden: true,
      },
      {
        label: "No Feature",
        hidden: true,
        routeProps: {
          path: "/no-feature",
          render: () => (
            <BugListView
              title="No Feature"
              query={{
                component: BUGZILLA_TRIAGE_COMPONENTS,
                resolution: "---",
                custom: {
                  blocked: {
                    nowordssubstr: this.context.metas.map(m => m.id),
                  },
                  cf_fx_iteration: { notequals: "---" },
                  keywords: { nowordssubstr: "meta" },
                },
              }}
              sort={(a, b) => {
                const iteration1 = cTrans.cf_fx_iteration(a.cf_fx_iteration);
                const iteration2 = cTrans.cf_fx_iteration(b.cf_fx_iteration);
                if (iteration1 < iteration2) {
                  return -1;
                }
                if (iteration1 > iteration2) {
                  return 1;
                }
                if (a.priority < b.priority) {
                  return -1;
                }
                if (a.priority > b.priority) {
                  return 1;
                }
                return 0;
              }}
            />
          ),
        },
      },
      { spacer: true },
      { header: `OMC – Firefox ${release}` },
      ...metaLinks,
      {
        label: "Other bugs…",
        routeProps: {
          path: "/other",
          exact: true,
          render: props => (
            <OtherView {...props} components={["Messaging System"]} />
          ),
        },
      },
      {
        navOnly: true,
        customRender: () => (
          <a
            className={styles.navLink}
            href="https://bugzilla.mozilla.org/enter_bug.cgi?blocked=bugzy-epic&component=Messaging%20System&product=Firefox&keywords=meta&priority=P1&bug_type=task"
            title="Click to add a category, or file a bug in the Firefox::Messaging System component, add the keyword 'meta', add bugzy-epic to the Blockers field, and set the priority to P1."
            target="_blank"
            rel="noopener noreferrer">
            Add Category…
          </a>
        ),
      },
      {
        label: "Metas",
        routeProps: {
          path: "/metas",
          render: () => (
            <BugListView
              title="Metas"
              query={{
                component: BUGZILLA_TRIAGE_COMPONENTS,
                resolution: "---",
                order: "changeddate DESC",
                custom: {
                  keywords: { substring: "meta" },
                },
              }}
              columns={["id", "summary", "priority", "last_change_time"]}
              map={bug => {
                return {
                  ...bug,
                  summary: removeMeta(bug.summary),
                  keywords: bug.keywords.filter(k => k !== "meta"),
                };
              }}
              filter={bug => !bug.summary.match(/(^\[?QA)|(QA bug tracking)/)}
              sort={(a, b) => {
                if (a.priority === "--") {
                  return 1;
                }
                if (b.priority === "--") {
                  return -1;
                }
                if (a.priority < b.priority) {
                  return -1;
                }
                if (a.priority > b.priority) {
                  return 1;
                }
                return 0;
              }}
            />
          ),
        },
      },
      { spacer: true },
      {
        label: "Settings",
        icon: "settings-circle",
        routeProps: {
          path: "/settings",
          component: SettingsView,
        },
        hidden: process.env.NODE_ENV === "production",
      },
      {
        label: "About Bugzy",
        icon: "info",
        routeProps: {
          path: "/about",
          component: AboutView,
        },
      },
      {
        hidden: true,
        routeProps: {
          path: "*",
          render: () => (
            <ErrorView
              header={"Invalid Route"}
              subheader={"The page you were looking for was not found."}
              buttonText={"Current Iteration"}
              buttonHref={"/current_iteration"}
            />
          ),
        },
      },
    ];

    return (
      <BrowserRouter>
        <React.Fragment>
          <RouterNav routes={ROUTER_CONFIG} />
          <main className={styles.main}>
            <Switch>
              <Route exact={true} path="/">
                <Redirect to="/current_iteration" />
              </Route>
              {ROUTER_CONFIG.filter(
                route => route.routeProps && !route.navOnly
              ).map((route, index) => (
                <Route
                  exact={route.exact !== false}
                  key={index}
                  {...route.routeProps}
                />
              ))}
            </Switch>
          </main>
          <PriorityGuide />
        </React.Fragment>
      </BrowserRouter>
    );
  }
}
