/* global chrome */

import React from "react";
import "./Welcome.css";
import gptGOLogo from "../../gptGO-logo.png";

const Welcome = () => {
  return (
    <div className="main-div-welcome">
      <img src={gptGOLogo} className="logo-welcome" alt="logo-welcome" />
      <div className="header1-text">Welcome!</div>
      <div className="header2-wrapper">
        <div className="header2-text">
          Looks like you haven't setup yet. Please visit our settings page to
          get started.
        </div>
      </div>
      <button
        onClick={() => {
          chrome.runtime.openOptionsPage();
        }}
        className="button-welcome"
      >
        Let's go
      </button>
    </div>
  );
};

export default Welcome;
