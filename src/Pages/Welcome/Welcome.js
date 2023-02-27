/* global chrome */

import React from "react";
import "./Welcome.css";
import gptGOLogo from "../../gptGO-logo.png";
import LogIn from "../../log-in.svg";

const Welcome = () => {
  return (
    <div className="main-div-welcome">
      <img src={gptGOLogo} className="logo-welcome" alt="logo-welcome" />

      <img
        src={LogIn}
        style={{
          height: "200px",
          width: "200px",
          objectFit: "contain",
          marginBottom: "50px",
        }}
      />

      <div className="header2-text">Please log into ChatGPT</div>
      <button
        className="button-welcome"
        onClick={() => {
          window.open("https://chat.openai.com/auth/login", "_blank");
        }}
      >
        Log In
      </button>
      <div
        className="header2-text"
        style={{
          fontSize: "0.8rem",
          maxWidth: "calc(100% - 140px)",
          color: "orange",
        }}
      >
        Once you log in, you can close the ChatGPT tab and use GptGO
      </div>
    </div>
  );
};

export default Welcome;
