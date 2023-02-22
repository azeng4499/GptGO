async function submitApiKey() {
  const checked = document.getElementById("checkbox").checked;

  if (checked) {
    callAPI();
  } else {
    document.getElementById("status").innerHTML = "Failure, checkbox required.";
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
      document.getElementById("checkbox").checked = true;
      document.getElementById("apiInput").value = response.apiKey;
      document.getElementById("status").innerHTML = "Success, you're all set!";
      document.getElementById("status").style.backgroundColor = "green";
    }
  });
}

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
    loadDataIfPresent();
    document
      .getElementById("submitButton")
      .addEventListener("click", submitApiKey);
    document.getElementById("expand1").addEventListener("click", () => {
      faq("1");
    });
    document.getElementById("expand2").addEventListener("click", () => {
      faq("2");
    });
    document.getElementById("expand3").addEventListener("click", () => {
      faq("3");
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
