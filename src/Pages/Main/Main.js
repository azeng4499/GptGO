/* global chrome */

import React, { useEffect, useState, useRef } from "react";
import { FiSettings } from "react-icons/fi";
import "./Main.css";
import gptGOLogo from "../../gptGO-logo.png";
import { Circles } from "react-loading-icons";
import TextareaAutosize from "react-textarea-autosize";
import getResponse from "../../api-functions";
import { errorMessages } from "../../api-functions";
import { RxCopy } from "react-icons/rx";
import { AiFillCheckCircle } from "react-icons/ai";
import useClippy from "use-clippy";

const Main = ({ apiKey }) => {
  const [query, setQuery] = useState();
  const [response, setResponse] = useState();
  const [loading, setLoading] = useState(false);
  const [textArea, setTextArea] = useState(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  const [height, setHeight] = useState();
  const [clipboard, setClipboard] = useClippy();

  const setChromeStore = (field, data) => {
    chrome.storage.local.set({ [field]: data });
  };

  useEffect(() => {
    setHeight(ref.current.clientHeight);
  }, []);

  const isError = (result) => {
    return (
      result.response === errorMessages.standard ||
      result.response === errorMessages.prompt ||
      result.response === errorMessages.tooManyRequests
    );
  };

  useEffect(() => {
    chrome.storage.local
      .get(["query", "lastQuery", "response"])
      .then((result) => {
        if (result.query) {
          setQuery(result.query);
          setTextArea(result.query);
          if (result.lastQuery != null && result.lastQuery === result.query) {
            setResponse(result.response);
            setError(isError(result));
          }
        } else {
          if (result.lastQuery != null) {
            setChromeStore("query", result.lastQuery);
            setQuery(result.lastQuery);
            setResponse(result.response);
            setError(isError(result));
          } else {
            setQuery(null);
          }
        }
      });
  }, []);

  const handleSearchRequest = () => {
    if (!loading) {
      setLoading(true);
      let send = "";

      if (textArea !== query) {
        setQuery(textArea);
        setChromeStore("query", textArea);
        send = textArea;
      } else if (textArea === query) {
        send = query;
      }
      setChromeStore("lastQuery", send);
      setCopied(false);
      getResponse(send, apiKey).then((response) => {
        setResponse(response.text);
        setChromeStore("response", response.text);
        setError(response.error);
        setLoading(false);
      });
    }
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

  return (
    <div className="main-div">
      <div className="logo-div">
        <img src={gptGOLogo} className="logo" alt="logo" />
        <FiSettings
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
          onChange={(e) => {
            if (response) {
              setResponse(null);
            }
            setTextArea(e.target.value);

            if (ref.current.clientHeight !== height) {
              setHeight(ref.current.clientHeight);
            }
          }}
        />
      </div>
      <div className="answer-container" style={{ height: 335 - height }}>
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
              </div>
            ) : response && !error ? (
              <div>
                <div className="response-text">{response}</div>
              </div>
            ) : response && error ? (
              <div className="error-text">{response}</div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="button-div">
        <button
          className="button"
          type="button"
          onClick={() => handleSearchRequest()}
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default Main;
