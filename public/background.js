chrome.runtime.onMessage.addListener(async function (request) {
  chrome.storage.local.set({ query: request.payload });
});
