import { createParser } from "eventsource-parser";
import { v4 as uuidv4 } from "uuid";

let controller, timeout;

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
  let cleared = false;
  let timestamp = Date.now();
  let response;
  const finalQuery = limit
    ? "Limit your response to 130 characters:\n" + query
    : query;

  try {
    if (query == null || query.trim() === "") throw new Error("prompt");

    controller = new AbortController();
    timeout = setTimeout(() => controller.abort("timeout"), 3000);
    const modelName = await getModelName(accessToken, controller);
    clearTimeout(timeout);
    timeout = setTimeout(() => controller.abort("timeout"), 15000);

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

    timeout = setTimeout(() => controller.abort("timeout"), 3000);
    await clearMessage(convoID, accessToken, controller);
    clearTimeout(timeout);

    return [response, false];
  } catch (err) {
    clearTimeout(timeout);
    if (controller == null || err.message === "prompt") {
      return [errorMessages.prompt, true];
    } else if (controller.signal.reason === "user") {
      return [errorMessages.abort, true];
    } else if (controller.signal.reason === "timeout") {
      return [errorMessages.timeout, true];
    } else if (err.message === "fetch") {
      return [errorMessages.denied, true];
    } else {
      return [errorMessages.standard, true];
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, callBack) => {
  switch (request.type) {
    case "callAPI":
      callAPI(request);
      return true;
    case "abort":
      console.log("aborted");
      if (controller) controller.abort("user");
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

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "3") {
    await handleNotification(info);
  } else {
    await query(info);
  }
});

//############################## Helper Functions ###########################

const query = async (info) => {
  const loading = await getStorage("loading");
  if (loading == null || loading === "false") {
    await setStorage("query", [info.selectionText, null, false]);
  }
};

async function handleNotification(info) {
  const loading = await getStorage("loading");
  if (loading == null || loading === "false") {
    const controllerNotif = new AbortController();
    setTimeout(() => controllerNotif.abort("timeout"), 5000);

    try {
      const resp = await fetch("https://chat.openai.com/api/auth/session", {
        signal: controllerNotif == null ? null : controllerNotif.signal,
      });
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
    } catch (err) {
      console.log(err);
      sendNotification("Error!!!", "ChatGPT took too long to respond");
    }
  }
}

async function getModelName(accessToken, controller) {
  const models = await fetch(`https://chat.openai.com/backend-api/models`, {
    method: "GET",
    signal: controller == null ? null : controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const modelsJson = await models.json();
  return modelsJson.models[0].slug;
}

async function clearMessage(convoID, accessToken, controller) {
  await fetch("https://chat.openai.com/backend-api/conversation/" + convoID, {
    method: "PATCH",
    signal: controller == null ? null : controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ is_visible: false }),
  });
  return;
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
  const resp = await fetch(resource, options);
  if (!resp.ok) {
    throw new Error("fetch");
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

chrome.runtime.onInstalled.addListener(async (details) => {
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
  if (details.reason === "update") {
    const loading = await getStorage("loading");
    if (loading == "true") {
      setStorage("loading", "false");
    }
  }
});

chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create({
    id: "3",
    title: "Search + get response as notification",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "4",
    title: "Send text to popup",
    contexts: ["selection"],
  });
});
