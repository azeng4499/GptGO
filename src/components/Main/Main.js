/* global chrome */

import React, { useEffect, useState } from "react";
import { FiHelpCircle } from "react-icons/fi";
import "./Main.css";
import Logo from "../../images/logo.png";
import CustomLoader from "../CustomLoader/CustomLoader";
import TextareaAutosize from "react-textarea-autosize";
import { RxCopy } from "react-icons/rx";
import { AiFillCheckCircle } from "react-icons/ai";
import useClippy from "use-clippy";
import ReactMarkdown from "react-markdown";
import { callAPI } from "../Utils/Api";
import { RiChatNewLine, RiHistoryFill } from "react-icons/ri";
import { TbApi } from "react-icons/tb";

const Main = ({ token }) => {
  const [query, setQuery] = useState(null);
  const [response, setResponse] = useState(null);
  const [showLoader, setShowLoader] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [height, setHeight] = useState();
  const [clipboard, setClipboard] = useClippy();
  const [timestamp, setTimestamp] = useState(Date.now());
  const [controller, setController] = useState(null);
  const [convoInfo, setConvoInfo] = useState({
    convoId: null,
    parentMessageId: null,
  });

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

  useEffect(async () => {
    await setInfo();
  }, []);

  chrome.storage.onChanged.addListener(async (changed) => {
    if (changed.notfiReady) {
      setQuery(changed.notfiReady.newValue[0]);
      setResponse(changed.notfiReady.newValue[1]);
    } else if (changed.lock) {
      if (changed.lock.newValue === true) {
        setShowLoader(true);
        setLoading(true);
      } else {
        setShowLoader(false);
        setLoading(false);
      }
    }
  });

  const setInfo = async () => {
    const query = await getStorage("query");
    const lock = await getStorage("lock");
    const savedConvoInfo = await getStorage("convoInfo");

    if (query != null && query[0].trim() != "") {
      setQuery(query[0]);
      if (lock === true) {
        setShowLoader(true);
        setLoading(true);
      } else {
        setShowLoader(false);
        setLoading(false);
      }
      if (query[1] != null) {
        setResponse(query[1]);
      }
    }

    if (savedConvoInfo != null) {
      setConvoInfo({
        convoId: savedConvoInfo[0],
        parentMessageId: savedConvoInfo[1],
      });
    }
  };

  const handleSearchRequest = async () => {
    if (!loading) {
      setResponse(null);
      setShowLoader(true);
      setLoading(true);
      setTimestamp(Date.now());

      const newController = new AbortController();
      setController(newController);

      await callAPI(
        query,
        newController,
        setShowLoader,
        setResponse,
        token,
        convoInfo,
        setConvoInfo
      );
      setShowLoader(false);
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (Date.now() - timestamp > 250) {
      controller.abort("user");
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
        <div style={{ maxWidth: "200px", display: "flex" }}>
          {token.type === "api" && <TbApi className="settings" />}
          {!loading && convoInfo.convoId && token.type === "access" && (
            <RiHistoryFill
              className="settings"
              onClick={() => {
                window.open(
                  "https://chat.openai.com/chat/" + convoInfo.convoId,
                  "_blank"
                );
              }}
            />
          )}
          {!loading && token.type === "access" && (
            <RiChatNewLine
              className="settings"
              onClick={async () => {
                setConvoInfo({ convoId: null, parentMessageId: null });
                await setStorage("convoInfo", null);
                setResponse(null);
              }}
            />
          )}
          <FiHelpCircle
            className="settings"
            onClick={() => chrome.runtime.openOptionsPage()}
          />
        </div>
      </div>
      <div className="question-div">
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
          onHeightChange={(height) => setHeight(height)}
          disabled={showLoader}
          onChange={async (e) => {
            if (response) {
              setResponse(null);
            }
            await setStorage("query", [e.target.value, null, false]);
            setQuery(e.target.value);
          }}
        />
      </div>
      <div className="answer-container" style={{ height: 410 - height }}>
        <div className="answer-div">
          <div className="response-label">
            Response:
            {!loading && copied ? (
              <AiFillCheckCircle className="copy" />
            ) : !loading && !copied ? (
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
            {showLoader ? (
              <div className="circle-div">
                <CustomLoader />
              </div>
            ) : response ? (
              <div>
                <div className="response-text">
                  <ReactMarkdown
                    children={response}
                    components={{
                      code({ node, inline, className, children }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return match != null && match[1] === "error" ? (
                          <div className="error-box">
                            <code className="code-style">{children}</code>
                          </div>
                        ) : inline ? (
                          <code className="code-style">{children}</code>
                        ) : (
                          <div className="highlight-box">
                            <code className="code-style">{children}</code>
                          </div>
                        );
                      },
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="button-div">
        {!loading ? (
          <div>
            <button
              className="button"
              type="button"
              onClick={() => handleSearchRequest()}
            >
              <span className="text">Search</span>
              <div className="icon-container">
                <div className="icon icon--left">
                  <svg>
                    <use xlinkHref="#arrow-right"></use>
                  </svg>
                </div>
                <div className="icon icon--right">
                  <svg>
                    <use xlinkHref="#arrow-right"></use>
                  </svg>
                </div>
              </div>
            </button>

            <svg style={{ display: "none" }}>
              <symbol id="arrow-right" viewBox="0 0 20 10">
                <path d="M14.84 0l-1.08 1.06 3.3 3.2H0v1.49h17.05l-3.3 3.2L14.84 10 20 5l-5.16-5z"></path>
              </symbol>
            </svg>
          </div>
        ) : loading && token.type === "access" ? (
          <button
            className="button-disabled"
            type="button"
            onClick={() => handleCancelRequest()}
          >
            Stop Generating
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default Main;
