/* global chrome */

import React, { useState } from "react";
import "./Manual.css";

const Manual = ({ setValidToken }) => {
  // const [accessToken, setAccessToken] = useState();
  const [error, setError] = useState("");

  const setStorage = async (key, value) => {
    await chrome.storage.local.set({
      [key]: value,
    });
  };

  return (
    <div className="manual">
      <div className="header-div">
        <div className="header">Manually Enter Access Key</div>
        <div className="sub-header">
          After you have logged into ChatGPT, copy the ENTIRE text at{" "}
          <a
            style={{ color: "#fff" }}
            href="http://chat.openai.com/api/auth/session"
            target="_blank"
          >
            this link
          </a>
        </div>
      </div>
      <textarea
        type="text"
        className="input"
        placeholder="Paste the ENTIRE text here..."
        onChange={async (e) => {
          try {
            setError("");
            if (e.target.value.trim() === "{}") {
              setError(
                "This key is empty which means you are not logged into ChatGPT"
              );
            } else {
              const accessObj = JSON.parse(e.target.value);
              if (accessObj.accessToken && accessObj.expires) {
                const expired = new Date(accessObj.expires);
                const now = new Date();
                if (now >= expired) {
                  throw new Error("outdated");
                }
                console.log(accessObj.accessToken, accessObj.expires);
                const accessArr = [accessObj.accessToken, accessObj.expires];
                await setStorage("accessArr", accessArr);
                await setStorage("accessToken", accessObj.accessToken);
                await setStorage("query", null);
                setValidToken(true);
              } else {
                throw new Error("incorrect");
              }
            }
          } catch (err) {
            if (err.message == "outdated") {
              setError(
                "This key has expired, log into ChatGPT again and refresh the page to get a new access key"
              );
            } else {
              setError("The text you entered is not correct");
            }
          }
        }}
      />
      <div className="error">
        <div style={{ textAlign: "center" }}>{error}</div>
      </div>
    </div>
  );
};

export default Manual;
