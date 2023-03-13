import { createParser } from "eventsource-parser";
import { v4 as uuidv4 } from "uuid";
import { Configuration, OpenAIApi } from "openai";

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

    await setStorage("lock", false);
  }
});

chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create({
    id: "Search + get response as notification",
    title: "Search + get response as notification",
    contexts: ["selection"],
  });
});

chrome.runtime.onMessage.addListener((request) => {
  switch (request.type) {
    case "query":
      query(request);
      return true;
  }
});

const query = async (request) => {
  const lock = await getStorage("lock");
  if (lock === false) {
    await setStorage("query", [request.payload, null]);
  }
};

chrome.contextMenus.onClicked.addListener(async (info) => {
  const lock = await getStorage("lock");
  let response;

  if (lock === false) {
    setStorage("lock", true);
    const controllerNotif = new AbortController();
    setTimeout(() => controllerNotif.abort("timeout"), 5000);

    try {
      const resp = await fetch("https://chat.openai.com/api/auth/session", {
        signal: controllerNotif == null ? null : controllerNotif.signal,
      });

      if (resp.status === 403) {
        const apiKey = await getStorage("apiKey");
        if (apiKey != null) {
          response = await getResponseNotfi(info, apiKey, "api");
        } else {
          sendNotification(
            "Error!!!",
            "Open the GptGO popup and sign in before sending search requests"
          );
        }
      } else {
        const data = await resp.json().catch(() => ({}));
        if (data.accessToken) {
          await setStorage("accessToken", data.accessToken);
          response = await getResponseNotfi(info, data.accessToken, "access");
        } else {
          sendNotification(
            "Error!!!",
            "Open the GptGO popup and sign in before sending search requests"
          );
        }
      }
    } catch (err) {
      console.log(err);
      sendNotification("Error!!!", "There was a problem connecting to ChatGPT");
    } finally {
      await setStorage("notfiReady", [
        info.selectionText,
        response[0],
        response[1],
      ]);

      setStorage("lock", false);
    }
  }
});

//############################## Helper Functions ###########################

const getResponseNotfi = async (info, token, type) => {
  await setStorage("query", [info.selectionText, null]);

  let response;

  if (type === "access") {
    response = await getResponse(token, info.selectionText);
  } else {
    response = await getResponseAPI(token, info.selectionText);
  }

  if (response[1] === true) {
    await setStorage("query", [
      info.selectionText,
      "\n\n```error\n🛑 A network or API error occurred! 🛑\n``",
    ]);
  } else {
    await setStorage("query", [info.selectionText, response[0]]);
  }

  sendNotification(
    response[1] === true ? "Error!!!" : "Response to: " + info.selectionText,
    response[0].replace(/\n/g, "")
  );
  return response;
};

async function getResponse(accessToken, query) {
  let convoID = null;
  let cleared = false;
  let response;
  let timeout;
  const shortQuery = "Limit your response to 130 characters:\n" + query;

  try {
    if (query == null || query.trim() === "") throw new Error("prompt");

    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort("timeout"), 3000);
    const modelName = await getModelName(accessToken, controller);
    clearTimeout(timeout);
    timeout = setTimeout(() => controller.abort("timeout"), 15000);

    await fetchMethod(
      controller,
      accessToken,
      shortQuery,
      modelName,
      (segment) => {
        if (segment === "[DONE]") return;
        try {
          const data = JSON.parse(segment);
          if (!cleared) {
            clearTimeout(timeout);
            cleared = true;
          }
          if (convoID != data.conversation_id) convoID = data.conversation_id;
          response = data.message.content.parts[0];
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
    console.log(err);
    clearTimeout(timeout);

    return ["A network or API error occurred!", true];
  }
}

const getResponseAPI = async (token, query) => {
  try {
    const configuration = new Configuration({
      apiKey: token,
    });
    const openai = new OpenAIApi(configuration);

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: query }],
    });

    return [completion.data.choices[0].message, false];
  } catch (err) {
    console.log(err);
    return ["A network or API error occurred!", true];
  }
};

//############################# Helper Functions #############################

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

async function* streamMethod(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

async function fetchMethod(
  controller,
  accessToken,
  query,
  modelName,
  callback
) {
  const resp = await fetch("https://chat.openai.com/backend-api/conversation", {
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
            parts: [query],
          },
        },
      ],
      model: modelName,
      parent_message_id: uuidv4(),
    }),
  });

  if (!resp.ok) {
    throw new Error("fetch");
  }
  const parser = createParser((event) => {
    if (event.type === "event") {
      callback(event.data);
    }
  });
  for await (const segment of streamMethod(resp.body)) {
    const decoded = new TextDecoder().decode(segment);
    parser.feed(decoded);
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
