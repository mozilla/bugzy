import React from "react";
import styles from "./Router.scss";
// const {ipcRenderer} = window.require("electron");
import metas from "../../../config/metas";
import {BugListView} from "../BugListView/BugListView";
import {
  BrowserRouter,
  Route,
  Link
} from 'react-router-dom';
import { BugList } from "../BugList/BugList";
import {CurrentIteration} from "../CurrentIteration/CurrentIteration";
import {Report} from "../Report/Report";
import {MyBugs} from "../MyBugs/MyBugs";
import {Preferences} from "../Preferences/Preferences";
import {ReleaseReport} from "../ReleaseReport/ReleaseReport";
import {FeatureView} from "../FeatureView/FeatureView";
import {Triage} from "../Triage/Triage";

const ROUTER_CONFIG = [
  {
    label: "Current Iteration",
    icon: "calendar",
    routeProps: {
      path: "/current_iteration",
      component: CurrentIteration
    }
  },
  {
    label: "Triage",
    icon: "inbox",
    routeProps: {
      path: "/triage",
      component: Triage
    }
  },
  // {
  //   label: "My Bugs",
  //   icon: "user",
  //   routeProps: {
  //     path: "/my_bugs",
  //     component: MyBugs
  //   }
  // },
  {
    label: "Report",
    icon: "graph",
    routeProps: {
      path: "/release_report",
      component: ReleaseReport,
    }
  },
  {
    label: "Preferences",
    hidden: true,
    routeProps: {
      path: "/preferences",
      component: Preferences,
    }
  },
  {
    spacer: true
  },
  {
    label: "Feature",
    routeProps: {
      path: "/feature/:id",
      component: FeatureView,
    },
    hidden: true
  }
];

metas.forEach(meta => ROUTER_CONFIG.push({
  path: `/feature/${meta.id}`,
  label: meta.displayName,
}));

ROUTER_CONFIG.push({
  label: "No Feature",
  routeProps: {
    path: "/no-feature",
    render: () => (<BugListView title="No Feature" query={{
      component: ["Activity Streams: Newtab", "Activity Streams: Application Servers"],
      resolution: "---",
      custom: {
        blocked: {nowordssubstr: metas.map(m => m.id)},
        cf_fx_iteration: {notequals: "---"}
      }
    }} />)
  }
});


class RouterNav extends React.PureComponent {
  renderListItem(route) {
    return (<li key={route.label}><Link className={styles.navLink} to={(route.routeProps ? route.routeProps.path : route.path)}>
      {route.icon ? <span className={styles.icon + " " + styles["icon-" + route.icon]} /> : null}
      {route.label}
    </Link></li>);
  }
  render() {
    const {routes} = this.props;
    return (<nav className={styles.aside}>
      <ul>
        {routes.filter(route => !route.hidden).map((route, i) => route.spacer ?
          <li key={i} className={styles.spacer} /> :
          this.renderListItem(route))}
      </ul>
    </nav>);
  }
}

export class Router extends React.PureComponent {
  render() {
    const {props} = this;
    return (<BrowserRouter><React.Fragment>
      <RouterNav routes={ROUTER_CONFIG} />
      <main className={styles.main}>
        {ROUTER_CONFIG
          .filter(route => route.routeProps)
          .map((route, index) => (<Route exact key={index} {...route.routeProps} />))}
      </main>
      </React.Fragment>
    </BrowserRouter>);
  }
}
