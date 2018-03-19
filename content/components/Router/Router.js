import React from "react";
import styles from "./Router.scss";
const {ipcRenderer} = window.require("electron");

class RouterNav extends React.PureComponent {
  constructor(props) {
    super(props);
    this.loadRoute = this.loadRoute.bind(this);
  }
  loadRoute(e) {
    e.preventDefault();
    this.props.setRoute(e.target.getAttribute("data-route"));
  }
  render() {
    const {props} = this;
    return (<nav className={styles.aside}>
      <ul>
        {props.routes.filter(route => !route.hidden).map(route => (<li key={route.id}>
          <a className={styles.navLink} href="#" data-route={route.id} onClick={this.loadRoute}>
            {route.icon ? <span className={styles.icon + " " + styles["icon-" + route.icon]} /> : null}
            {route.label}
          </a>
        </li>))}
      </ul>
    </nav>);
  }
}

export class Router extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {currentRoute: props.defaultRoute};
    this.setRoute = this.setRoute.bind(this);
    this.onPreferencesOpened = this.onPreferencesOpened.bind(this);
  }
  renderContent(id) {
    for (const route of this.props.routes) {
      if (route.id === id) {
        return route.render();
      }
    }
  }
  setRoute(id) {
    this.setState({currentRoute: id});
  }
  onPreferencesOpened() {
    this.setRoute(this.props.prefsRoute);
  }
  componentWillMount() {
    ipcRenderer.on("openPreferences", this.onPreferencesOpened);
  }
  componentWillUnmount() {
    ipcRenderer.removeListener("openPreferences", this.onPreferencesOpened);
  }
  render() {
    const {props} = this;
    return (<React.Fragment>
      <RouterNav routes={props.routes} currentRoute={this.state.currentRoute} setRoute={this.setRoute} />
      <main className={styles.main}>
      {this.renderContent(this.state.currentRoute)}
      </main>
    </React.Fragment>);
  }
}

