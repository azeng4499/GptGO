let controller;

const errorMessages = {
  standard: "A network or API error occurred! Please try again later.",
  prompt: "Invalid prompt.",
  tooManyRequests:
    "ChatGPT denied this request. Please wait a minute before sending another request. If this keeps happening, click the ? and visit the API Usage section.",
  abort: "User aborted search.",
  timeout: "ChatGPT isn't responding right now. Please try again later.",
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.contextMenus.remove("3", () => {
  chrome.contextMenus.create({
    id: "3",
    title: "Search text and get response as notification",
    contexts: ["selection"],
  });
});

chrome.runtime.onMessage.addListener((request, sender, callBack) => {
  switch (request.type) {
    case "query":
      query(request);
      break;
    case "callAPI":
      callAPI(request, callBack);
      return true;
    case "abort":
      controller.abort("user");
      break;
    default:
      break;
  }
});

const callAPI = async (request, callBack) => {
  await setStorage("loading", "true");
  await setStorage("query", [request.query, null, false]);
  const response = await getResponse(request.apiKey, request.query);
  await setStorage("query", [request.query, response[0], response[1]]);
  await setStorage("loading", "false");
  callBack([request.query, response[0], response[1]]);
};

const query = async (request) => {
  const loading = await getStorage("loading");
  if (loading == null || loading === "false") {
    await setStorage("query", [request.payload, null, false]);
  }
};

chrome.contextMenus.onClicked.addListener(async (info) => {
  const apiKey = await getStorage("apiKey");
  const loading = await getStorage("loading");

  if (apiKey) {
    if (loading == null || loading === "false") {
      await setStorage("loading", "true");
      await setStorage("query", [info.selectionText, null, false]);
      const response = await getResponse(apiKey, info.selectionText);
      await setStorage("query", [info.selectionText, response[0], response[1]]);
      await setStorage("loading", "false");

      sendNotification(
        response[1] === true
          ? "Error!!!"
          : "Response to: " + info.selectionText,
        response[0].replace(/\n/g, "")
      );

      await setStorage("notifReady", Date.now().toString());
    }
  } else {
    sendNotification(
      "Error!!!",
      "You need to set up GptGO before sending search requests."
    );
  }
});

//#################Helper Func#########################

const getResponse = async (apiKey, query) => {
  if (query == null || query.trim() === "") {
    return [errorMessages.prompt, true];
  }

  controller = new AbortController();
  setTimeout(() => controller.abort("timeout"), 60000);

  try {
    const res = await fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "text-davinci-003",
        temperature: 0.75,
        max_tokens: 2000,
        prompt: "You are ChatGPT.\nUser: " + query + "\nChatGPT: ",
      }),
      signal: controller.signal,
    });

    if (res == null || (res.status != 200 && res.status != 201)) {
      if (res && res.status === 429) {
        return [errorMessages.tooManyRequests, true];
      } else {
        return [errorMessages.standard, true];
      }
    } else {
      const data = await res.json();
      return [data.choices[0].text, false];
    }
  } catch (err) {
    console.log(err);
    if (controller.signal.reason == "timeout") {
      return [errorMessages.timeout, true];
    } else if (controller.signal.reason == "user") {
      return [errorMessages.abort, true];
    } else {
      return [errorMessages.standard, true];
    }
  }
};

const sendNotification = (query, response) => {
  chrome.notifications.create("", {
    title: query,
    type: "basic",
    message: response,
    iconUrl: "images/logo192.png",
  });
};

const getStorage = async (key) => {
  const response = await chrome.storage.local.get([key]);
  const value = response[key];
  return value;
};

const setStorage = async (key, value) => {
  await chrome.storage.local.set({
    [key]: value,
  });
};
