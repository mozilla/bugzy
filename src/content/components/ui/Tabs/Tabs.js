import React from "react";
import styles from "./Tabs.scss";
import {NavLink, Route, Switch} from "react-router-dom";

export class Tabs extends React.PureComponent {
  constructor(props) {
    super(props);
    this.renderTabLink = this.renderTabLink.bind(this);
    this.renderTabRoute = this.renderTabRoute.bind(this);
    this.state = {bugs: [], loaded: false};
  }

  renderTabLink(tabInfo, i) {
    return (
      <li key={i}>
        <NavLink
          exact={true}
          activeClassName={styles.activeTab}
          to={this.props.baseUrl + tabInfo.path}>
          {tabInfo.label}
        </NavLink>
      </li>
    );
  }

  renderTabRoute(config, i) {
    return (
      <Route key={i} exact={true} path={this.props.baseUrl + config.path} render={config.render} />
    ); // eslint-disable-line
  }

  render() {
    const {config} = this.props;
    return (
      <div>
        <div className={styles.tabsContainer}>
          <ul>{config.map(this.renderTabLink)}</ul>
        </div>
        <Switch>{config.map(this.renderTabRoute)}</Switch>
      </div>
    );
  }
}
