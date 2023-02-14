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

chrome.runtime.onMessage.addListener(async function (request) {
  getStorage("loading").then((loading) => {
    if (loading == null || loading === "false") {
      chrome.storage.local.set({ query: request.payload });
    }
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  getStorage("apiKey").then(async (apiKey) => {
    if (apiKey) {
      getStorage("loading").then(async (loading) => {
        if (loading == null || loading === "false") {
          await setStorage("loading", "true.backend");
          const query = await getStorage("query");
          if (query != info.selectionText) {
            await setStorage("query", info.selectionText);
          }
          getResponse(apiKey).then(async (response) => {
            if (response == null) {
              sendNotification("Error!!!", errorMessages.standard);
            } else {
              await setStorage("response", response);
              if (response[2] === false) {
                sendNotification(
                  "Response to: " + response[0],
                  response[1].replace(/\n/g, "")
                );
              } else {
                sendNotification("Error!!!", response[1]);
              }
              await setStorage("loading", "false");
            }
          });
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
        if (response == null) {
          await setStorage("loading", "false");
        } else {
          await setStorage("response", response);
          await setStorage("loading", "false");
        }
      });
    });
  }
});

//#################Helper Func#########################

const getResponse = async (apiKey) => {
  const query = await getStorage("query");

  if (query && query !== "") {
    try {
      let controller = new AbortController();
      setTimeout(() => controller.abort(), 45000);

      chrome.storage.onChanged.addListener((changes) => {
        if (changes.abort) {
          controller.abort();
        }
      });

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
          prompt: "User :\n" + query + "\nChatGPT:\n",
          stop: "/n",
        }),
        signal: controller.signal,
      });

      if (res == null || (res.status != 200 && res.status != 201)) {
        if (res && res.status === 429) {
          return [query, errorMessages.tooManyRequests, true];
        } else {
          return [query, errorMessages.standard, true];
        }
      } else {
        const data = await res.json();
        return [query, data.choices[0].text, false];
      }
    } catch (err) {
      console.log(err);
      await setStorage("response", [query, errorMessages.abort, true]);
      return null;
    }
  } else {
    return [query, errorMessages.prompt, true];
  }
};

const errorMessages = {
  standard: "A network or API error occurred! Please try again later.",
  prompt: "Invalid prompt.",
  tooManyRequests:
    "ChatGPT limits the request rates of free users. Please wait a minute before sending another request.",
  abort: "User aborted search.",
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