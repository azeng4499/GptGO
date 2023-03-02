/* global chrome */

import React, { useEffect, useState, useRef } from "react";
import { FiHelpCircle } from "react-icons/fi";
import "./Main.css";
import Logo from "../../images/logo.png";
import CustomLoader from "../CustomLoader/CustomLoader";
import TextareaAutosize from "react-textarea-autosize";
import { RxCopy } from "react-icons/rx";
import { AiFillCheckCircle } from "react-icons/ai";
import useClippy from "use-clippy";
import ReactMarkdown from "react-markdown";

const Main = ({ apiKey }) => {
  const [query, setQuery] = useState();
  const [response, setResponse] = useState();
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  const [height, setHeight] = useState();
  const [clipboard, setClipboard] = useClippy();
  const [timestamp, setTimestamp] = useState(Date.now());

  const setStorage = async (key, value) => {
    await chrome.storage.local.set({
      [key]: value,
    });
  };

  const getStorage = async (key) => {
    const response = await chrome.storage.local.get([key]);
    const value = response[key];
    return value;
  };

  useEffect(() => {
    if (ref.current.clientHeight !== height) {
      setHeight(ref.current.clientHeight);
    }
  }, [query]);

  useEffect(async () => {
    await setInfo();
  }, []);

  chrome.storage.onChanged.addListener(async (changed) => {
    if (changed.query) {
      const loading = await getStorage("loading");
      if (loading === "true") {
        const query = await getStorage("query");
        const response = query[1];
        const error = query[2];
        if (response != null) {
          setLoading(false);
          setError(error);
          setResponse(response);
        }
      }
    } else if (changed.loading) {
      if (changed.loading.newValue === "false") {
        setEnded(true);
      } else {
        setEnded(false);
      }
    }
  });

  const setInfo = async () => {
    const query = await getStorage("query");
    const loading = await getStorage("loading");

    if (query != null) {
      setQuery(query[0]);
      if (loading != null && loading === "true") {
        setLoading(true);
        setEnded(false);
      } else {
        setLoading(false);
        setEnded(true);
      }
      if (query[1] != null) {
        setResponse(query[1]);
        setError(query[2]);
      }
    }
  };

  const handleSearchRequest = async () => {
    const loading = await getStorage("loading");
    if (loading == null || loading === "false") {
      setResponse(null);
      setLoading(true);
      setEnded(false);
      setTimestamp(Date.now());
      chrome.runtime.sendMessage(
        {
          query: query,
          apiKey: apiKey,
          type: "callAPI",
        },
        null
      );
    }
  };

  const handleCancelRequest = async () => {
    if (Date.now() - timestamp > 500) {
      await setStorage("query", [query, "User aborted search.", true]);
      await setStorage("loading", false);
      await setInfo();
      chrome.runtime.sendMessage(
        {
          type: "abort",
        },
        null
      );
    }
  };

  useEffect(() => {
    const callback = (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSearchRequest();
      }
    };
    window.addEventListener("keydown", callback);
    return () => {
      window.removeEventListener("keydown", callback);
    };
  });

  return (
    <div className="main-div">
      <div className="logo-div">
        <img src={Logo} className="logo" alt="logo" />
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
            setQuery(e.target.value);
          }}
        />
      </div>
      <div className="answer-container" style={{ height: 435 - height }}>
        <div className="answer-div">
          <div className="response-label">
            Response:
            {ended && copied && !error ? (
              <AiFillCheckCircle className="copy" />
            ) : ended && !copied && !error ? (
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
                <CustomLoader />
              </div>
            ) : response && !error ? (
              <div>
                <div className="response-text">
                  <ReactMarkdown
                    children={response}
                    components={{
                      code({ node, inline, className, children }) {
                        return inline ? (
                          <code
                            style={{
                              fontSize: "0.7rem",
                              color: "#fff",
                            }}
                          >
                            {children}
                          </code>
                        ) : (
                          <div className="highlight-box">
                            <code
                              style={{
                                fontSize: "0.7rem",
                                color: "#fff",
                              }}
                            >
                              {children}
                            </code>
                          </div>
                        );
                      },
                    }}
                  />
                </div>
              </div>
            ) : response && error ? (
              <div className="error-text">{response}</div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="button-div">
        {ended ? (
          <button
            className="button"
            type="button"
            onClick={() => handleSearchRequest()}
          >
            Search
          </button>
        ) : (
          <button
            className="button-disabled"
            type="button"
            onClick={() => handleCancelRequest()}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default Main;