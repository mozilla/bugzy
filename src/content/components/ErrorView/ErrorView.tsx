import React from "react";
import * as gStyles from "../../styles/gStyles.module.scss";

type ErrorViewProps = {
  header: string;
  subheader: string;
  buttonText: string;
  buttonHref?: string;
};

const containerStyle = {
  maxWidth: 900,
  margin: "0 auto",
  padding: "20px 40px",
  textAlign: "center" as const,
};

const refreshPage = () => {
  window.location.reload();
};

export class ErrorView extends React.PureComponent<ErrorViewProps> {
  render() {
    return (
      <div style={containerStyle}>
        <h1>{this.props.header}</h1>
        <p>{this.props.subheader}</p>
        <a
          className={gStyles.primaryButton}
          onClick={!this.props.buttonHref ? refreshPage : null}
          href={this.props.buttonHref || ""}>
          {this.props.buttonText}
        </a>
      </div>
    );
  }
}
