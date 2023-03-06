document.addEventListener("mouseup", myFunction);

function myFunction() {
  value = window.getSelection().toString();
  if (value && value.trim() != "\n" && value.trim() != "") {
    chrome.runtime.sendMessage(
      {
        payload: value,
        type: "query",
      },
      null
    );
  }
}
