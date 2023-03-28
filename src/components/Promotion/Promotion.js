import React from "react";
import "../Main/Main.css";

const Promotion = () => {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: "314px",
          height: "20px",
          display: "flex",
          alignItems: "flex-end",
          gap: "10px",
          color: "white",
          padding: "0px 10px",
          textJustify: "flex-end",
        }}
        className="promo-text"
      >
        <div
          style={{
            width: "25px",
            height: "2px",
            backgroundColor: "white",
          }}
        ></div>
        <div>Advertisment</div>
        <div
          style={{
            width: "225px",
            height: "2px",
            backgroundColor: "white",
          }}
        ></div>
      </div>
      <iframe
        src="https://gptgo-privacy-policy.web.app/sponsor"
        className="iframe"
        frameBorder="0"
        width="300px"
        height="50px"
        style={{
          borderBottom: "2px solid white",
          borderLeft: "2px solid white",
          borderRight: "2px solid white",
          padding: "5px",
          borderBottomLeftRadius: "5px",
          borderBottomRightRadius: "5px",
        }}
      ></iframe>
    </div>
  );
};

export default Promotion;
