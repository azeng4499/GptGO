document.addEventListener("mouseup", myFunction);

function myFunction() {
  value = window.getSelection().toString();
  if (value) {
    if (value != "\n") {
      chrome.runtime.sendMessage(
        {
          payload: value,
          type: "query",
        },
        null
      );
    }
  }
}
