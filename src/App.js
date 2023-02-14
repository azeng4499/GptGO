/* global chrome */

import React, { useEffect, useState } from "react";
import Main from "./Pages/Main/Main";
import Welcome from "./Pages/Welcome/Welcome";

function App() {
  const [apiKey, setApiKey] = useState();

  const showPage = () => {
    return apiKey ? <Main apiKey={apiKey}/> : <Welcome />;
  };

  useEffect(() => {
    chrome.storage.local.get(["apiKey"]).then((response) => {
      if (response.apiKey) {
        setApiKey(response.apiKey);
      }
    });
  }, []);

  return <div style={{ backgroundColor: "#23272f" }}>{showPage()}</div>;
}

export default App;
