/* global chrome */

import React, { useEffect, useState, useRef } from "react";
import { FiHelpCircle } from "react-icons/fi";
import "./Main.css";
import gptGOLogo from "../../gptGO-logo.png";
import { Circles } from "react-loading-icons";
import TextareaAutosize from "react-textarea-autosize";
import { RxCopy } from "react-icons/rx";
import { AiFillCheckCircle } from "react-icons/ai";
import useClippy from "use-clippy";

const Main = () => {
  const [query, setQuery] = useState();
  const [response, setResponse] = useState();
  const [loading, setLoading] = useState(false);
  const [textArea, setTextArea] = useState(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  const [height, setHeight] = useState();
  const [clipboard, setClipboard] = useClippy();

  const setStorage = async (field, data) => {
    await chrome.storage.local.set({ [field]: data });
  };

  useEffect(() => {
    if (ref.current.clientHeight !== height) {
      setHeight(ref.current.clientHeight);
    }
  }, [textArea]);

  useEffect(() => {
    const logic = (changes) => {
      if (changes.loading && changes.loading.newValue === "false") {
        chrome.storage.local.get(["response"]).then((response) => {
          if (response[0] === query) {
            setResponse(response.response[1]);
            setError(response.response[2]);
            setLoading(false);
          }
        });
      }
    };

    chrome.storage.onChanged.addListener((changes) => {
      logic(changes);
    });

    return chrome.storage.onChanged.removeListener((changes) => {
      logic(changes);
    });
  }, []);

  useEffect(() => {
    chrome.storage.local
      .get(["query", "response", "loading"])
      .then((result) => {
        if (result.loading == null || result.loading === "false") {
          setLoading(false);
        } else {
          setLoading(true);
        }
        if (result.query) {
          setQuery(result.query);
          setTextArea(result.query);
          if (result.response[0] === result.query) {
            setResponse(result.response[1]);
            setError(result.response[2]);
          }
        }
      });
  }, []);

  const handleSearchRequest = async () => {
    setLoading(true);
    if (textArea !== query) {
      setQuery(textArea);
      await setStorage("query", textArea);
    }
    await setStorage("loading", "true.frontend");
  };

  useEffect(() => {
    const callback = (event) => {
      if (event.shiftKey && event.metaKey) {
        handleSearchRequest();
      }
    };
    window.addEventListener("keydown", callback);
    return () => {
      window.removeEventListener("keydown", callback);
    };
  });

  const handleCancelRequest = async () => {
    await setStorage("abort", Date.now().toString());
  };

  return (
    <div className="main-div">
      <div className="logo-div">
        <img src={gptGOLogo} className="logo" alt="logo" />
        <FiHelpCircle
          className="settings"
          onClick={() => chrome.runtime.openOptionsPage()}
        />
      </div>
      <div className="question-div" ref={ref}>
        <div className="prompt-label">Prompt:</div>
        <TextareaAutosize
          minRows={1}
          maxRows={10}
          className="text-area"
          defaultValue={query != null ? query : null}
          placeholder={
            query != null
              ? null
              : "Please highlight a section of text or start typing in this box."
          }
          disabled={loading}
          onChange={(e) => {
            if (response) {
              setResponse(null);
            }
            setTextArea(e.target.value);
          }}
        />
      </div>
      <div className="answer-container" style={{ height: 435 - height }}>
        <div className="answer-div">
          <div className="response-label">
            Response:
            {!loading && copied && !error ? (
              <AiFillCheckCircle className="copy" />
            ) : !loading && !copied && !error ? (
              <RxCopy
                className="copy"
                onClick={() => {
                  setClipboard(response);
                  setCopied(true);
                }}
              />
            ) : null}
          </div>
          <div className="action-div">
            {loading ? (
              <div className="circle-div">
                <Circles className="circles" />
                <div
                  className="cancel-button"
                  onClick={() => handleCancelRequest()}
                >
                  Cancel
                </div>
              </div>
            ) : response && !error ? (
              <div>
                <div className="response-text">
                  <pre className="pre">{response}</pre>
                </div>
              </div>
            ) : response && error ? (
              <div className="error-text">{response}</div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="button-div">
        {!loading && (
          <button
            className="button"
            type="button"
            onClick={() => handleSearchRequest()}
            disabled={loading}
          >
            Search
          </button>
        )}
      </div>
    </div>
  );
};

export default Main;
