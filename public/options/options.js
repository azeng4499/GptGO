async function submitApiKey() {
  const checked1 = document.getElementById("checkbox1").checked;
  const checked2 = document.getElementById("checkbox2").checked;

  if (checked1 && checked2) {
    callAPI();
  } else {
    document.getElementById("status").innerHTML =
      "Failure, checkboxes required.";
    document.getElementById("status").style.backgroundColor = "red";
  }
}

const callAPI = async () => {
  const apiKey = document.getElementById("apiInput").value;
  document.getElementById("status").innerHTML = "Checking key...";
  document.getElementById("status").style.backgroundColor = "orange";

  let controller = new AbortController();
  setTimeout(() => controller.abort(), 15000);

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
    signal: controller.signal,
  };

  try {
    const response = await fetch(
      "https://api.openai.com/v1/completions",
      requestOptions
    );

    if (response.status == 200 || response.status == 201) {
      document.getElementById("status").innerHTML = "Success, you're all set!";
      document.getElementById("status").style.backgroundColor = "green";
      chrome.storage.local.set({ apiKey: apiKey });
    } else {
      document.getElementById("status").innerHTML = "Failure, try again.";
      document.getElementById("status").style.backgroundColor = "red";
    }
  } catch (err) {
    document.getElementById("status").innerHTML = "Failure, network error.";
    document.getElementById("status").style.backgroundColor = "red";
  }
};

function loadDataIfPresent() {
  chrome.storage.local.get(["apiKey"]).then((response) => {
    if (response.apiKey) {
      document.getElementById("checkbox1").checked = true;
      document.getElementById("checkbox2").checked = true;
      document.getElementById("apiInput").value = response.apiKey;
      document.getElementById("status").innerHTML = "Success, you're all set!";
      document.getElementById("status").style.backgroundColor = "green";
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
    chrome.storage.local.set({ query: [value, null, false] });
  }
}
