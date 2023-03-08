const faq = (num) => {
  let expandText = "expandText" + num;
  let faq = "faq" + num;
  const state = document.getElementById(expandText).innerHTML;
  style = window.getComputedStyle(document.getElementById("main"));
  height = style.getPropertyValue("min-height");
  height = height.substring(0, height.length - 2);
  height = parseInt(height);
  offset = num === "1" ? 182 : 133;

  if (state === "+") {
    height += offset;
    document.getElementById(faq).style.display = "flex";
    document.getElementById(expandText).innerHTML = "-";
  } else {
    height -= offset;
    document.getElementById(faq).style.display = "none";
    document.getElementById(expandText).innerHTML = "+";
  }
  document.getElementById("main").style.minHeight = height.toString() + "px";
};

const load = async () => {
  const response = await chrome.storage.local.get(["agreed"]);
  const value = response["agreed"];

  if (value === true) {
    document.getElementById("main-content").style.display = "flex";
    document.getElementById("agree-button").style.display = "none";
  }
};

(function () {
  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("expand1").addEventListener("click", () => {
      faq("1");
    });
    document.getElementById("expand2").addEventListener("click", () => {
      faq("2");
    });
    document
      .getElementById("agree-button")
      .addEventListener("click", async () => {
        document.getElementById("main-content").style.display = "flex";
        document.getElementById("agree-button").style.display = "none";
        await chrome.storage.local.set({
          ["agreed"]: true,
        });
      });
  });

  load();
})();

document.addEventListener("mouseup", myFunction);

function myFunction() {
  value = window.getSelection().toString();
  if (value && value.trim() != "\n" && value.trim() != "") {
    chrome.storage.local.set({ query: [value, null, false] });
  }
}
