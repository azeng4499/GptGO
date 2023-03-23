/* global chrome */

import React from "react";
import { RiChatNewLine, RiHistoryFill } from "react-icons/ri";
import { TbApi } from "react-icons/tb";
import { FiHelpCircle } from "react-icons/fi";
import "../Main/Main.css";
import Logo from "../../images/logo.png";
import Gpt4Button from "../SettingsMenu/Gpt4Button/Gpt4Button";
import "react-tooltip/dist/react-tooltip.css";
import { Tooltip } from "react-tooltip";
import { setStorage } from "../Utils/Shared";

const SettingsMenu = ({
  loading,
  convoInfo,
  setConvoInfo,
  token,
  setResponse,
}) => {
  return (
    <div>
      <Tooltip id="my-tooltip" />
      <div className="logo-div">
        <img src={Logo} className="logo" alt="logo" />
        <div style={{ maxWidth: "200px", display: "flex" }}>
          {convoInfo.type === "api" && <TbApi className="settings" />}
          {convoInfo.v4Available && !loading && token.type === "access" && (
            <a
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Activate Gpt-4"
              data-tooltip-delay-show={500}
            >
              <Gpt4Button convoInfo={convoInfo} setConvoInfo={setConvoInfo} />
            </a>
          )}
          {!loading && convoInfo.convoId && token.type === "access" && (
            <a
              data-tooltip-id="my-tooltip"
              data-tooltip-content="View History"
              data-tooltip-delay-show={500}
            >
              <RiHistoryFill
                className="settings"
                onClick={() => {
                  window.open(
                    "https://chat.openai.com/chat/" + convoInfo.convoId,
                    "_blank"
                  );
                }}
              />
            </a>
          )}
          {!loading && token.type === "access" && (
            <a
              data-tooltip-id="my-tooltip"
              data-tooltip-content="New Chat"
              data-tooltip-delay-show={500}
            >
              <RiChatNewLine
                className="settings"
                onClick={async () => {
                  setConvoInfo({
                    ...convoInfo,
                    convoId: null,
                    parentMessageId: null,
                  });
                  await setStorage("convoInfo", null);
                  setResponse(null);
                }}
              />
            </a>
          )}
          <a
            data-tooltip-id="my-tooltip"
            data-tooltip-content="Help"
            data-tooltip-delay-show={500}
          >
            <FiHelpCircle
              className="settings"
              onClick={() => chrome.runtime.openOptionsPage()}
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;
