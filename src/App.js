/* global chrome */

import React, { useEffect, useState } from "react";
import Main from "./components/Main/Main";
import Welcome from "./components/Welcome/Welcome";
import "./App.css";
import CustomLoader from "./components/CustomLoader/CustomLoader";
import { BiWifiOff } from "react-icons/bi";

function App() {
  const [validToken, setValidToken] = useState();
  const [noWifi, setNoWifi] = useState(false);
  const [token, setToken] = useState();

  const showPage = () => {
    return validToken ? <Main token={token} /> : <Welcome />;
  };

  const getStorage = async (key) => {
    const response = await chrome.storage.local.get([key]);
    const value = response[key];
    return value;
  };

  useEffect(async () => {
    const lock = await getStorage("lock");
    if (lock === true) {
      const apiKey = await getStorage("apiKey");
      setToken({ key: apiKey, type: "api" });
      setValidToken(true);
    } else {
      const controller = new AbortController();
      setTimeout(() => controller.abort("timeout"), 3000);

      try {
        const resp = await fetch("http://chat.openai.com/api/auth/session", {
          signal: controller ? controller.signal : null,
        });

        if (resp.status === 403) {
          const apiKey = await getStorage("apiKey");
          if (apiKey != null) {
            setToken({ key: apiKey, type: "api" });
            setValidToken(true);
          } else {
            setValidToken(false);
          }
        } else {
          const data = await resp.json().catch(() => ({}));
          if (data.accessToken) {
            setToken({ key: data.accessToken, type: "access" });
            setValidToken(true);
          } else {
            setValidToken(false);
          }
        }
      } catch (err) {
        console.log(err);
        setNoWifi(true);
        setValidToken(false);
      }
    }
  }, []);

  return (
    <div style={{ backgroundColor: "#23272f" }}>
      {noWifi ? (
        <div className="loading" style={{ gap: "20px" }}>
          <BiWifiOff style={{ height: "30px", width: "30px", color: "#fff" }} />
          <div className="label">No Internet</div>
        </div>
      ) : validToken == null ? (
        <div className="loading">
          <CustomLoader />
        </div>
      ) : (
        showPage()
      )}
    </div>
  );
}

export default App;
