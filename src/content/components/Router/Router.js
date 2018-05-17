import React from "react";
import styles from "./Router.scss";
import {BugListView} from "../BugListView/BugListView";
import {
  BrowserRouter,
  Route,
  Switch,
  Redirect,
  NavLink,
  withRouter
} from 'react-router-dom';
import { BugList } from "../BugList/BugList";
import {IterationView} from "../IterationView/IterationView";
import {MyBugs} from "../MyBugs/MyBugs";
import {Preferences} from "../Preferences/Preferences";
import {ReleaseReport} from "../ReleaseReport/ReleaseReport";
import {FeatureView} from "../FeatureView/FeatureView";
import {Triage} from "../Triage/Triage";
import {getAdjacentIteration, getIteration} from "../../../common/iterationUtils";
import {BUGZILLA_TRIAGE_COMPONENTS} from "../../../config/project_settings";

const RouterNav = withRouter(class _RouterNav extends React.PureComponent {
  renderListItem(route) {
    return (<li key={route.label}><NavLink activeClassName={styles.active} className={styles.navLink} to={(route.routeProps ? route.routeProps.path : route.path)}>
      {route.icon ? <span className={styles.icon + " " + styles["icon-" + route.icon]} /> : null}
      {route.label}
    </NavLink></li>);
  }
  render() {
    const {routes} = this.props;
    return (<nav className={styles.aside}>
      <ul>
        {routes.filter(route => !route.hidden).map((route, i) => route.spacer ?
          <li key={i} className={styles.spacer} /> :
          this.renderListItem(route))}
        <li><a className={styles.navLink} href="https://github.com/k88hudson/bugzy/issues">
          <span className={styles.icon + " " + styles["icon-alert"]} />
          Report an issue
        </a></li>
      </ul>
    </nav>);
  }
});

export class Router extends React.PureComponent {
  render() {
    const {props} = this;

    const ROUTER_CONFIG = [
      {
        label: "Current Iteration",
        icon: "calendar",
        routeProps: {
          path: "/current_iteration",
          render: props => <IterationView metas={this.props.metas} iteration={getIteration().number} />
        },
      },
      {
        label: "Next Iteration",
        icon: "calendar2",
        path: "/iteration/" + getAdjacentIteration(1).number,
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
          component: Triage
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
        label: "Report",
        icon: "graph",
        routeProps: {
          path: "/release_report",
          render: () => <ReleaseReport metas={this.props.metas} />,
        }
      },
      {
        label: "UI Wanted",
        icon: "rgb",
        routeProps: {
          path: "/ui_wanted",
          render: () => <BugListView title="UI Wanted" query={{
            component: BUGZILLA_TRIAGE_COMPONENTS,
            keywords: ["uiwanted"],
            resolution: "---",
            order: "changeddate DESC",
          }} />
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
      ...this.props.metas.map(meta => ({
        path: `/feature/${meta.id}`,
        label: meta.displayName,
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
          }} />)
        }
      },
      {spacer: true},
      {
        label: "About Bugzy",
        icon: "info",
        routeProps: {
          path: "/about",
          component: Preferences,
        }
      }
    ];

    return (<BrowserRouter><React.Fragment>
      <RouterNav routes={ROUTER_CONFIG} />
      <main className={styles.main}>
        <Switch>
          <Route exact path="/"><Redirect to="/current_iteration" /></Route>
          {ROUTER_CONFIG
            .filter(route => route.routeProps && !route.navOnly)
            .map((route, index) => (<Route exact key={index} {...route.routeProps} />))}
        </Switch>
      </main>
      </React.Fragment>
    </BrowserRouter>);
  }
}
