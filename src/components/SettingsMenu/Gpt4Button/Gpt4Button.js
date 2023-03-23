import React from "react";
import "./Gpt4Button.css";
import { setStorage } from "../../Utils/Shared";

const Gpt4Button = ({ convoInfo, setConvoInfo }) => {
  return (
    <div
      style={{
        width: "25px",
        height: "25px",
        marginRight: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#fff",
      }}
      onClick={async () => {
        if (convoInfo.v4Active) {
          setConvoInfo({ ...convoInfo, v4Active: false });
          await setStorage("gpt4-info", [true, false]);
        } else {
          setConvoInfo({ ...convoInfo, v4Active: true });
          await setStorage("gpt4-info", [true, true]);
        }
      }}
    >
      <div className={convoInfo.v4Active && "glow"}></div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="icon icon-tabler icon-tabler-hexagon-number-4"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        className="absolute"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M19.875 6.27a2.225 2.225 0 0 1 1.125 1.948v7.284c0 .809 -.443 1.555 -1.158 1.948l-6.75 4.27a2.269 2.269 0 0 1 -2.184 0l-6.75 -4.27a2.225 2.225 0 0 1 -1.158 -1.948v-7.285c0 -.809 .443 -1.554 1.158 -1.947l6.75 -3.98a2.33 2.33 0 0 1 2.25 0l6.75 3.98h-.033z" />
        <path d="M10 8v3a1 1 0 0 0 1 1h3" />
        <path d="M14 8v8" />
      </svg>
    </div>
  );
};

export default Gpt4Button;
