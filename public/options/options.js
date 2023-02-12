async function submitApiKey() {
  const apiKey = document.getElementById("apiInput").value;
  document.getElementById("status").innerHTML = "Checking key...";
  document.getElementById("status").style.color = "white";

  const params_ = {
    model: "text-davinci-003",
    temperature: 0.7,
    max_tokens: 256,
    prompt: "hello",
  };

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify(params_),
  };

  const response = await fetch(
    "https://api.openai.com/v1/completions",
    requestOptions
  );

  if (response.status == 200 || response.status == 201) {
    document.getElementById("status").innerHTML = "Success, you're all set!";
    document.getElementById("status").style.color = "#00b188";
    chrome.storage.local.set({ apiKey: apiKey });
  } else {
    document.getElementById("status").innerHTML = "Failure, try again.";
    document.getElementById("status").style.color = "red";
  }
}

function loadDataIfPresent() {
  chrome.storage.local.get(["apiKey"]).then((response) => {
    if (response.apiKey) {
      document.getElementById("apiInput").value = response.apiKey;
      document.getElementById("status").innerHTML = "Success, you're all set!";
      document.getElementById("status").style.color = "#00b188";
    }
  });
}

(function () {
  document.addEventListener("DOMContentLoaded", function () {
    loadDataIfPresent();
    document
      .getElementById("submitButton")
      .addEventListener("click", submitApiKey);
  });
})();

document.addEventListener("mouseup", myFunction);

function myFunction() {
  value = window.getSelection().toString();
  if (value) {
    chrome.storage.local.set({ query: value });
  }
}
