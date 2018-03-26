import React from "react";
import styles from "./Router.scss";
// const {ipcRenderer} = window.require("electron");
import metas from "../../../config/metas";

import {
  BrowserRouter,
  Route,
  Link
} from 'react-router-dom';

class RouterNav extends React.PureComponent {
  renderListItem(route) {
    return (<li key={route.id}><Link className={styles.navLink} to={"/" + route.id}>
      {route.icon ? <span className={styles.icon + " " + styles["icon-" + route.icon]} /> : null}
      {route.label}
    </Link></li>);
  }
  render() {
    const {props} = this;
    const routes = props.routes.concat(metas.map(meta => ({
      id: `feature/${meta.id}`,
      label: meta.displayName,
    })));
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
      <RouterNav routes={props.routes} />
      <main className={styles.main}>
        {props.routes.map((route, index) => (<Route exact key={index} path={"/" + route.id} component={route.component} />))}
      </main>
      </React.Fragment>
    </BrowserRouter>);
  }
}
