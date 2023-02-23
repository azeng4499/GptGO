const faq = (num) => {
  let expandText = "expandText" + num;
  let faq = "faq" + num;
  const state = document.getElementById(expandText).innerHTML;
  style = window.getComputedStyle(document.getElementById("main"));
  height = style.getPropertyValue("min-height");
  height = height.substring(0, height.length - 2);
  height = parseInt(height);

  if (state === "+") {
    height += 110;
    document.getElementById(faq).style.display = "flex";
    document.getElementById(expandText).innerHTML = "-";
  } else {
    height -= 110;
    document.getElementById(faq).style.display = "none";
    document.getElementById(expandText).innerHTML = "+";
  }
  document.getElementById("main").style.minHeight = height.toString() + "px";
};

(function () {
  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("expand1").addEventListener("click", () => {
      faq("1");
    });
    document.getElementById("expand2").addEventListener("click", () => {
      faq("2");
    });
  });
})();

document.addEventListener("mouseup", myFunction);

function myFunction() {
  value = window.getSelection().toString();
  if (value) {
    chrome.storage.local.set({ query: [value, null, false] });
  }
}
