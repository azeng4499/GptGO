import React from "react";
import "./CustomLoader.css";
import Icon from "../../images/icon.png";

const CustomLoader = () => {
  return (
    <div className="logo-div-big">
      <div className="border-big logo-div-big">
        <div className="border-small logo-div-small"></div>
      </div>
      <img
        src={Icon}
        alt="logo-load"
        width="50px"
        height="50px"
        style={{
          position: "absolute",
        }}
      />
    </div>
  );
};

export default CustomLoader;
