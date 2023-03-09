/* global chrome */

import React from "react";
import "./Welcome.css";
import Logo from "../../images/logo.png";
import LogIn from "../../images/log-in.svg";

const Welcome = ({ setClickedMan }) => {
  return (
    <div className="main-div-welcome">
      <img src={Logo} className="logo-welcome" alt="logo-welcome" />

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
      <button
        className="button-welcome"
        onClick={() => {
          window.open("https://chat.openai.com/auth/login", "_blank");
        }}
      >
        Log In
      </button>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontSize: "0.5rem",
          gap: "5px",
          flexDirection: "column",
          marginBottom: "10px",
        }}
      >
        <div>Log in didn't work or keep getting signed out?</div>
        <div
          style={{
            cursor: "pointer",
            textDecoration: "underline",
            fontSize: "0.6rem",
          }}
          onClick={() => {
            setClickedMan(true);
          }}
        >
          Manually Enter Access Key
        </div>
      </div>
    </div>
  );
};

export default Welcome;
