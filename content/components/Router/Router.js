import React from "react";
import styles from "./Router.scss";

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
        {props.routes.map(route => (<li key={route.id}>
          <a className={styles.navLink} href="#" data-route={route.id} onClick={this.loadRoute}>{route.label}</a>
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

