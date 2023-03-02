/* global chrome */

import React, { useEffect, useState } from "react";
import Main from "./components/Main/Main";
import Welcome from "./components/Welcome/Welcome";
import "./App.css";
import CustomLoader from "./components/CustomLoader/CustomLoader";

function App() {
  const [validToken, setValidToken] = useState();

  const showPage = () => {
    return validToken ? <Main /> : <Welcome />;
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
          setValidToken(false);
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
        setValidToken(false);
      }
    } else {
      setValidToken(true);
    }
  }, []);

  return (
    <div style={{ backgroundColor: "#23272f" }}>
      {validToken == null ? (
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
