import React from "react";
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
import { Preferences } from "../Preferences/Preferences";
import { FeatureView } from "../FeatureView/FeatureView";
import { OtherView } from "../OtherView/OtherView";
import { Triage } from "../Triage/Triage";
import { Uplift } from "../Uplift/Uplift";
import { Exports } from "../Exports/Exports";
import { FeatureList } from "../FeatureList/FeatureList";
import { ActiveRSMessages } from "../ActiveRSMessages/ActiveRSMessages";
import { PriorityGuide } from "../PriorityGuide/PriorityGuide";
import { ReleaseReport } from "../ReleaseReport/ReleaseReport";
import { IterationPicker } from "../IterationPicker/IterationPicker";
import { BUGZILLA_TRIAGE_COMPONENTS } from "../../../config/project_settings";
import { isBugResolved } from "../../lib/utils";
import { UnassignedView } from "../UnassignedView/UnassignedView";

function nimbusSort(a, b) {
  const aPriortity = a.priority === "--" ? "PX" : a.priority;
  const bPriortity = b.priority === "--" ? "PX" : b.priority;
  if (isBugResolved(a) && !isBugResolved(b)) {
    return 1;
  }
  if (!isBugResolved(a) && isBugResolved(b)) {
    return -1;
  }

  if (aPriortity < bPriortity) {
    return -1;
  }
  if (aPriortity > bPriortity) {
    return 1;
  }

  if (a.cf_fx_iteration < b.cf_fx_iteration) {
    return -1;
  }
  if (a.cf_fx_iteration > b.cf_fx_iteration) {
    return 1;
  }

  return 0;
}

const noFeatureSort = (a, b) => {
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
};

const RouterNav = withRouter(
  class _RouterNav extends React.PureComponent {
    renderListItem(route, i) {
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
    }

    async refreshMetas() {
      await fetch("/refresh_metas");
      window.location.reload();
    }

    async refreshIterations() {
      await fetch("/refresh_iterations");
      window.location.reload();
    }

    render() {
      const { routes } = this.props;
      return (
        <nav className={styles.aside}>
          <ul>
            {routes
              .filter(route => !route.hidden)
              .map((route, i) => {
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
                return this.renderListItem(route, i);
              })}
            <li>
              <a
                className={styles.navLink}
                href="https://github.com/mozilla/bugzy/issues/new/choose">
                <span className={`${styles.icon} ${styles["icon-alert"]}`} />
                Report an issue
              </a>
            </li>
            <li>
              <a className={styles.navLink} onClick={this.refreshMetas} href="">
                Refresh metabugs
              </a>
            </li>
            <li>
              <a
                className={styles.navLink}
                onClick={this.refreshIterations}
                href="">
                Refresh iterations
              </a>
            </li>
          </ul>
        </nav>
      );
    }
  }
);

export class Router extends React.PureComponent {
  static contextType = GlobalContext;

  getMetaLinks(component) {
    return (
      this.context.metas
        // Filter out pocket because it gets a special one
        .filter(
          meta =>
            meta.priority === "P1" &&
            meta.component === component &&
            !isBugResolved(meta)
        )
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
        .map(meta => ({
          path: `/feature/${meta.id}`,
          label: meta.displayName,
        }))
    );
  }

  getMetasBySection() {
    const result = { m: [], p: [], x: [] };
    this.context.metas.forEach(meta => {
      if (meta.priority === "P1" && !isBugResolved(meta)) {
        if (meta.component === "Nimbus Desktop Client") {
          result.x.push(meta);
        } else if (["Pocket"].includes(meta.component)) {
          result.p.push(meta);
        } else if (meta.component === "Messaging System") {
          result.m.push(meta);
        }
      }
    });
    for (const key in result) {
      result[key] = result[key]
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
    return result;
  }

  otherQuery(component) {
    return {
      component,
      resolution: "---",
      rules: [
        {
          key: "blocked",
          operator: "nowordssubstr",
          value: this.context.metas
            .filter(meta => meta.priority === "P1")
            .map(m => m.id),
        },
        { key: "keywords", operator: "nowordssubstr", value: "meta" },
        {
          operator: "OR",
          rules: [
            {
              key: "cf_fx_iteration",
              operator: "notequals",
              value: "---",
            },
            { key: "priority", operator: "equals", value: "P1" },
          ],
        },
      ],
    };
  }

  render() {
    const iterations = this.context.iterations.orderedVersionStrings;
    const currentIteration = this.context.iterations.getIteration();
    const nextIteration = this.context.iterations.getAdjacentIteration(1);
    const release = currentIteration.number.split(".")[0];
    const prevRelease = release - 1;

    const metasBySection = this.getMetasBySection();

    const ROUTER_CONFIG = [
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
          render: props => (
            <IterationView
              {...props}
              iteration={props.match.params.iteration}
              currentIteration={currentIteration}
            />
          ),
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
        label: "Release Report",
        exact: false,
        icon: "graph",
        routeProps: {
          path: "/release/:iteration",
          render: props => (
            <ReleaseReport
              {...props}
              iteration={props.match.params.iteration}
            />
          ),
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
        label: `Exports`,
        icon: "up-arrow-yellow",
        routeProps: {
          path: "/exports",
          render: () => <Exports {...{ release, prevRelease }} />,
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
          render: props => <FeatureView {...props} />,
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
                  blocked: { nowordssubstr: this.context.metas.map(m => m.id) },
                  cf_fx_iteration: { notequals: "---" },
                  keywords: { nowordssubstr: "meta" },
                },
              }}
              sort={noFeatureSort}
            />
          ),
        },
      },
      { spacer: true },
      { header: `Firefox ${release} | UJET` },
      ...metasBySection.m,
      // ...this.getMetaLinks("Messaging System"),
      {
        label: "Other...",
        routeProps: {
          path: "/other",
          exact: true,
          render: props => (
            <OtherView {...props} components={["Messaging System"]} />
          ),
        },
      },
      { spacer: true },
      { header: `Firefox ${release} | Nimbus` },
      {
        label: "All Nimbus (X-man)",
        routeProps: {
          path: "/nimbus-desktop",
          exact: true,
          render: () => (
            <BugListView
              title="Nimbus Desktop Client (JS)"
              columns={[
                "id",
                "summary",
                "last_change_time",
                "cf_fx_iteration",
                "priority",
              ]}
              query={{
                component: ["Nimbus Desktop Client"],
              }}
              sort={nimbusSort}
            />
          ),
        },
      },
      ...metasBySection.x,
      { spacer: true },
      { header: `Firefox ${release} | Pocket` },
      ...metasBySection.p,
      // ...this.getMetaLinks("New Tab Page"),
      {
        label: "Other...",
        routeProps: {
          path: "/other-pocket",
          exact: true,
          render: props => <OtherView {...props} components={["Pocket"]} />,
        },
      },
      { spacer: true },
      {
        label: "About Bugzy",
        icon: "info",
        routeProps: {
          path: "/about",
          component: Preferences,
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
