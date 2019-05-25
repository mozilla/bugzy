import React from "react";
import styles from "./CopyButton.scss";
import {copyToClipboard} from "../../lib/utils";

const DISPLAY_COPIED_TEXT_MS = 2500;

/*
 * When the button is clicked, copy the string in the `text` prop to the
 * clipboard and display an absolutely positioned "Copied!" span for visual
 * confirmation. Remove the span two and a half seconds after the most recent
 * button click.
 */
export class CopyButton extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {copied: false};
    this.copyText = this.copyText.bind(this);
  }

  copyText() {
    clearTimeout(this.timeoutId); // A no-op if timeoutId invalid
    copyToClipboard(this.props.text);
    this.setState({copied: true});
    this.timeoutId = setTimeout(() => this.setState({copied: false}), DISPLAY_COPIED_TEXT_MS);
  }

  componentWillReceiveProps() {
    // Remove the span if the `text` prop gets updated
    this.setState({copied: false});
  }

  componentWillUnmount() {
    clearTimeout(this.timeoutId); // A no-op if timeoutId invalid
  }

  render() {
    return (
      <span>
        <button className={styles.button} onClick={this.copyText} title={this.props.title} />{" "}
        <span className={`${styles.copiedText} ${this.state.copied ? styles.show : ""}`}>
          Copied!
        </span>
      </span>
    );
  }
}
