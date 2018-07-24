import React from "react";
import styles from "./Router.scss";
import {BugListView} from "../BugListView/BugListView";
import {
  BrowserRouter,
  NavLink,
  Redirect,
  Route,
  Switch,
  withRouter
} from "react-router-dom";
import {columnTransforms as cTrans} from "../BugList/columnTransforms";
import {IterationView} from "../IterationView/IterationView";
import {MyBugs} from "../MyBugs/MyBugs";
import {Preferences} from "../Preferences/Preferences";
import {ReleaseReport} from "../ReleaseReport/ReleaseReport";
import {FeatureView} from "../FeatureView/FeatureView";
import {Triage} from "../Triage/Triage";
import {Uplift} from "../Uplift/Uplift";
import {FeatureList} from "../FeatureList/FeatureList";
import {getAdjacentIteration, getIteration} from "../../../common/iterationUtils";
import {BUGZILLA_TRIAGE_COMPONENTS} from "../../../config/project_settings";
import {isBugResolved} from "../../lib/utils";

const RouterNav = withRouter(class _RouterNav extends React.PureComponent {
  renderListItem(route) {
    return (<li key={route.label}><NavLink activeClassName={styles.active} className={styles.navLink} to={(route.routeProps ? route.routeProps.path : route.path)}>
      {route.icon ? <span className={`${styles.icon} ${styles[`icon-${route.icon}`]}`} /> : null}
      {route.label}
    </NavLink></li>);
  }

  async refreshMetas() {
    await fetch("/refresh_metas");
    window.location.reload();
  }

  render() {
    const {routes} = this.props;
    return (<nav className={styles.aside}>
      <ul>
        {routes.filter(route => !route.hidden).map((route, i) => {
          if (route.spacer) {
            return <li key={i} className={styles.spacer} />;
          } else if (route.header) {
            return <li key={i} className={styles.header}>{route.header}</li>;
          }
          return this.renderListItem(route);
        })}
        <li><a className={styles.navLink} href="https://github.com/k88hudson/bugzy/issues">
          <span className={`${styles.icon} ${styles["icon-alert"]}`} />
          Report an issue
        </a></li>
        <li><a className={styles.navLink} onClick={this.refreshMetas} href="">
          Refresh metabugs
        </a></li>
      </ul>
    </nav>);
  }
});

export class Router extends React.PureComponent {
  render() {
    const release = getIteration().number.split(".")[0];
    const prevRelease = release - 1;

    const ROUTER_CONFIG = [
      {
        label: "Current Iteration",
        icon: "calendar",
        routeProps: {
          path: "/current_iteration",
          render: props => <IterationView metas={this.props.metas} iteration={getIteration().number} />
        }
      },
      {
        label: "Next Iteration",
        icon: "calendar2",
        path: `/iteration/${getAdjacentIteration(1).number}`,
        navOnly: true
      },
      {
        label: "Iteration",
        routeProps: {
          path: "/iteration/:iteration",
          render: props => <IterationView metas={this.props.metas} iteration={props.match.params.iteration} />
        },
        hidden: true
      },
      {
        label: "Triage",
        icon: "inbox",
        routeProps: {
          path: "/triage",
          render: props => <Triage metas={this.props.metas} />
        }
      },
      {
        label: "My Bugs",
        icon: "user",
        routeProps: {
          path: "/my_bugs",
          component: MyBugs
        }
      },
      {
        label: "Feature List",
        icon: "balloons",
        routeProps: {
          path: "/feature_list",
          render: () => <FeatureList metas={this.props.metas} />
        }
      },
      {
        label: "Report",
        icon: "graph",
        routeProps: {
          path: "/release_report",
          render: () => <ReleaseReport metas={this.props.metas} />
        }
      },
      {
        label: "UI Wanted",
        icon: "rgb",
        routeProps: {
          path: "/ui_wanted",
          render: () => (<BugListView title="UI Wanted" query={{
            component: BUGZILLA_TRIAGE_COMPONENTS,
            keywords: ["uiwanted"],
            resolution: "---",
            order: "changeddate DESC"
          }} />)
        }
      },
      {
        label: "Regression",
        icon: "warning",
        routeProps: {
          path: "/regression",
          render: () => (<BugListView title="Regression" query={{
            component: BUGZILLA_TRIAGE_COMPONENTS,
            keywords: ["regression"],
            resolution: "---",
            order: "cf_fx_iteration DESC"
          }} />)
        }
      },
      {
        label: `Uplift to Firefox ${prevRelease}`,
        icon: "up-arrow",
        routeProps: {
          path: "/uplift",
          render: () => (<Uplift prevRelease={prevRelease} />)
        }
      },
      {
        label: "Feature",
        routeProps: {
          path: "/feature/:id",
          render: props => <FeatureView {...props} metas={this.props.metas} />
        },
        hidden: true
      },
      {spacer: true},
      {header: `Firefox ${release} release`},
      ...this.props.metas
        .filter(meta => meta.release === release && !isBugResolved(meta))
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
        .map(meta => ({
          path: `/feature/${meta.id}`,
          label: meta.displayName
        })),
      {
        label: "No Feature",
        routeProps: {
          path: "/no-feature",
          render: () => (<BugListView title="No Feature" query={{
            component: BUGZILLA_TRIAGE_COMPONENTS,
            resolution: "---",
            custom: {
              blocked: {nowordssubstr: this.props.metas.map(m => m.id)},
              cf_fx_iteration: {notequals: "---"}
            }
          }} sort={(a, b) => cTrans.cf_fx_iteration(a.cf_fx_iteration) - cTrans.cf_fx_iteration(b.cf_fx_iteration)} />) // eslint-disable-line react/jsx-no-bind
        }
      },
      {spacer: true},
      {
        label: "About Bugzy",
        icon: "info",
        routeProps: {
          path: "/about",
          component: Preferences
        }
      }
    ];

    return (<BrowserRouter><React.Fragment>
      <RouterNav routes={ROUTER_CONFIG} />
      <main className={styles.main}>
        <Switch>
          <Route exact={true} path="/"><Redirect to="/current_iteration" /></Route>
          {ROUTER_CONFIG
            .filter(route => route.routeProps && !route.navOnly)
            .map((route, index) => (<Route exact={true} key={index} {...route.routeProps} />))}
        </Switch>
      </main>
    </React.Fragment></BrowserRouter>);
  }
}
