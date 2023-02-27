import { createParser } from "eventsource-parser";
import { v4 as uuidv4 } from "uuid";

let controller;

const errorMessages = {
  standard:
    "A network or API error occurred! Please wait a minute and try again.",
  prompt: "Invalid prompt.",
  denied:
    "ChatGPT denied this request. Please wait a minute before sending another request.",
  abort: "User aborted search.",
  timeout: "ChatGPT isn't responding right now. Please try again later.",
};

async function getResponse(accessToken, query, limit) {
  let convoID = null;
  let timeout;
  let cleared = false;
  try {
    if (query == null || query.trim() === "") throw new Error("prompt");

    controller = new AbortController();
    timeout = setTimeout(() => controller.abort("timeout"), 15000);

    const modelName = await getModelName(accessToken);
    let timestamp = Date.now();
    let response;
    const finalQuery = limit
      ? "Limit your response to 130 characters:\n" + query
      : query;

    await fetchSSE(
      "https://chat.openai.com/backend-api/conversation",
      {
        method: "POST",
        signal: controller == null ? null : controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: "next",
          messages: [
            {
              id: uuidv4(),
              role: "user",
              content: {
                content_type: "text",
                parts: [finalQuery],
              },
            },
          ],
          model: modelName,
          parent_message_id: uuidv4(),
        }),
      },
      (message) => {
        if (message === "[DONE]") return;
        try {
          const data = JSON.parse(message);
          if (!cleared) {
            clearTimeout(timeout);
            cleared = true;
          }
          if (convoID != data.conversation_id) convoID = data.conversation_id;
          response = data.message.content.parts[0];
          const now = Date.now();
          if (now - timestamp > 250) {
            setStorage("query", [query, data.message.content.parts[0], false]);
            timestamp = now;
          }
        } catch (err) {
          return;
        }
      }
    );
    await clearMessage(convoID, accessToken);
    return [response, false];
  } catch (err) {
    if (!cleared) {
      clearTimeout(timeout);
    }
    if (controller == null) {
      return [errorMessages.prompt, true];
    } else if (controller.signal.reason == "user") {
      return [errorMessages.abort, true];
    } else if (controller.signal.reason == "timeout") {
      return [errorMessages.timeout, true];
    } else if (err.message === "prompt") {
      return [errorMessages.prompt, true];
    } else if (err.message === "fetch") {
      return [errorMessages.denied, true];
    } else {
      return [errorMessages.standard, true];
    }
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.runtime.openOptionsPage();
  }
  if (details.reason === "install" || details.reason === "update") {
    var uninstallGoogleFormLink =
      "https://docs.google.com/forms/d/e/1FAIpQLSdv3c9RmDmphP1pihYgmNmV6DJ_UxMXq6NNi1oOW5XsIhyxOg/viewform?usp=sf_link";
    if (chrome.runtime.setUninstallURL) {
      chrome.runtime.setUninstallURL(uninstallGoogleFormLink);
    }
  }
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
      callAPI(request);
      return true;
    case "abort":
      if (controller) {
        controller.abort("user");
      }
      break;
    default:
      break;
  }
});

const callAPI = async (request) => {
  await setStorage("loading", "true");
  await setStorage("query", [request.query, null, false]);
  const accessToken = await getStorage("accessToken");
  const response = await getResponse(accessToken, request.query, false);
  await setStorage("query", [request.query, response[0], response[1]]);
  await setStorage("loading", "false");
};

const query = async (request) => {
  const loading = await getStorage("loading");
  if (loading == null || loading === "false") {
    await setStorage("query", [request.payload, null, false]);
  }
};

chrome.contextMenus.onClicked.addListener(async (info) => {
  const loading = await getStorage("loading");
  if (loading == null || loading === "false") {
    const resp = await fetch("https://chat.openai.com/api/auth/session");
    if (resp.status === 403) {
      sendNotification(
        "Error!!!",
        "Open the GptGO popup and sign in before sending search requests"
      );
    } else {
      const data = await resp.json().catch(() => ({}));
      if (data.accessToken) {
        await setStorage("loading", "true");
        await setStorage("query", [info.selectionText, null, false]);
        const response = await getResponse(
          data.accessToken,
          info.selectionText,
          true
        );
        await setStorage("query", [
          info.selectionText,
          response[0],
          response[1],
        ]);
        await setStorage("loading", "false");
        sendNotification(
          response[1] === true
            ? "Error!!!"
            : "Response to: " + info.selectionText,
          response[0].replace(/\n/g, "")
        );
      } else {
        sendNotification(
          "Error!!!",
          "Open the GptGO popup and sign in before sending search requests"
        );
      }
    }
  }
});

//############################## Helper Functions ###########################

async function getModelName(accessToken) {
  try {
    const models = await fetch(`https://chat.openai.com/backend-api/models`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const modelsJson = await models.json();
    return modelsJson.models[0].slug;
  } catch (err) {
    console.log(err);
    throw new Error("model");
  }
}

async function clearMessage(convoID, accessToken) {
  try {
    await fetch("https://chat.openai.com/backend-api/conversation/" + convoID, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ is_visible: false }),
    });
    return;
  } catch (err) {
    console.log(err);
    throw new Error("clear");
  }
}

async function* streamAsyncIterable(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

async function fetchSSE(resource, options, onMessage) {
  try {
    const resp = await fetch(resource, options);
    if (!resp.ok) {
      throw new Error();
    }
    const parser = createParser((event) => {
      if (event.type === "event") {
        onMessage(event.data);
      }
    });
    for await (const chunk of streamAsyncIterable(resp.body)) {
      const str = new TextDecoder().decode(chunk);
      parser.feed(str);
    }
  } catch (err) {
    console.log(err);
    throw new Error("fetch");
  }
}

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
