document.addEventListener("mouseup", myFunction);

function myFunction() {
  value = window.getSelection().toString();
  if (value) {
    chrome.runtime.sendMessage({
      payload: value,
    });
  }
}
