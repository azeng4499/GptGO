chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.contextMenus.remove("3", () => {
  console.log("created new context menu");
  chrome.contextMenus.create({
    id: "3",
    title: "Search text and get response as notification",
    contexts: ["selection"],
  });
});

chrome.runtime.onMessage.addListener(async function (request) {
  console.log("inside OnMessage");
  getStorage("loading").then((loading) => {
    if (loading == null || loading === "false") {
      console.log("Set query to " + request.payload);
      chrome.storage.local.set({ query: request.payload });
    }
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  console.log("inside contextMenus onclicked");
  getStorage("apiKey").then(async (apiKey) => {
    if (apiKey) {
      getStorage("loading").then(async (loading) => {
        if (loading == null || loading === "false") {
          console.log("Set loading to true");
          await setStorage("loading", "true.backend");
          const query = await getStorage("query");
          if (query != info.selectionText) {
            console.log("Set highlighted text to query");
            await setStorage("query", info.selectionText);
          }
          getResponse(apiKey).then(async (response) => {
            console.log("Set response to api result");
            await setStorage("response", response);
            console.log("Sending notification");
            if (response[2] === false) {
              sendNotification(
                "Response to: " + response[0],
                response[1].replace(/\n/g, "")
              );
            } else {
              sendNotification("Error!!!", response[1]);
            }
            await setStorage("loading", "false");
          });
        } else {
          console.log("failed loading");
        }
      });
    } else {
      sendNotification(
        "Error!!!",
        "You need to set up GptGO before sending search requests."
      );
    }
  });
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.loading && changes.loading.newValue === "true.frontend") {
    getStorage("apiKey").then((apiKey) => {
      getResponse(apiKey).then(async (response) => {
        await setStorage("response", response);
        await setStorage("loading", "false");
      });
    });
  }
});

//#################Helper Func#########################

const errorMessages = {
  standard: "A network or API error occurred! Please try again later.",
  prompt: "Invalid prompt.",
  tooManyRequests:
    "ChatGPT limits the request rates of free users. Please wait a minute before sending another request.",
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
  chrome.storage.local.set({
    [key]: value,
  });
};

const callAPI = async (query, apiKey) => {
  const params = {
    model: "text-davinci-003",
    temperature: 0.75,
    max_tokens: 2000,
    prompt: "User :\n" + query + "\nChatGPT:\n",
    stop: "/n",
  };

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(45000),
  };

  console.log("in callAPI");

  try {
    let res;
    try {
      res = await fetch(
        "https://api.openai.com/v1/completions",
        requestOptions
      );
    } catch (err) {
      console.log(err);
    }
    console.log("res : " + res);
    if (res == null || (res.status != 200 && res.status != 201)) {
      if (res && res.status === 429) {
        return {
          response: errorMessages.tooManyRequests,
          error: true,
        };
      } else {
        return {
          response: errorMessages.standard,
          error: true,
        };
      }
    } else {
      console.log("before res.json");
      const data = await res.json();
      console.log("after res.json" + data);
      return { response: data.choices[0].text, error: false };
    }
  } catch (err) {
    console.log(err);
    return { response: errorMessages.standard, error: true };
  }
};

const getResponse = async (apiKey) => {
  console.log("get response called");
  const query = await getStorage("query");

  if (query && query !== "") {
    const response = await callAPI(query, apiKey);
    return [query, response.response, response.error];
  } else {
    return [query, errorMessages.prompt, true];
  }
};
