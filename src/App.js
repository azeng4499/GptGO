/* global chrome */

import React, { useEffect, useState } from "react";
import Main from "./components/Main/Main";
import Welcome from "./components/Welcome/Welcome";
import "./App.css";
import CustomLoader from "./components/CustomLoader/CustomLoader";
import Manual from "./components/Manual/Manual";
import { BiWifiOff } from "react-icons/bi";

function App() {
  const [validToken, setValidToken] = useState();
  const [clickedMan, setClickedMan] = useState(false);
  const [noWifi, setNoWifi] = useState(false);

  const showPage = () => {
    if (clickedMan && validToken === false) {
      return <Manual setValidToken={setValidToken} />;
    } else {
      return validToken ? <Main /> : <Welcome setClickedMan={setClickedMan} />;
    }
  };

  const getStorage = async (key) => {
    const response = await chrome.storage.local.get([key]);
    const value = response[key];
    return value;
  };

  const setStorage = async (key, value) => {
    await chrome.storage.local.set({
      [key]: value,
    });
  };

  useEffect(async () => {
    const loading = await getStorage("loading");
    if (loading == null || loading === "false") {
      const controller = new AbortController();
      setTimeout(() => controller.abort("timeout"), 3000);

      try {
        const resp = await fetch("http://chat.openai.com/api/auth/session", {
          signal: controller ? controller.signal : null,
        });
        if (resp.status === 403) {
          const accessArr = await getStorage("accessArr");
          if (accessArr != null) {
            const expireDate = new Date(accessArr[1]);
            const now = new Date();
            if (now < expireDate) {
              await setStorage("accessToken", accessArr[0]);
              setValidToken(true);
            } else {
              setValidToken(false);
            }
          } else {
            setValidToken(false);
          }
        } else {
          const data = await resp.json().catch(() => ({}));
          if (data.accessToken) {
            await setStorage("accessToken", data.accessToken);
            setValidToken(true);
          } else {
            setValidToken(false);
          }
        }
      } catch (err) {
        setNoWifi(true);
        setValidToken(false);
      }
    } else {
      setValidToken(true);
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
