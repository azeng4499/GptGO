/* global chrome */

import { createParser } from "eventsource-parser";
import { v4 as uuidv4 } from "uuid";
import { Configuration, OpenAIApi } from "openai";

const errorMessages = {
  standard:
    "A network or API error occurred! Please wait a minute and try again.",
  network: "Your network is down.",
  prompt: "Invalid prompt.",
  denied:
    "ChatGPT says you are sending too many requests in a row. Please slow down before sending another request.",
  timeout:
    "Timeout error. This most likely means either your network or ChatGPT is too slow.",
};

export const callAPI = async (
  request,
  controller,
  setShowLoader,
  setResponse,
  setError,
  token
) => {
  await setStorage("query", [
    request,
    "Search was canceled because popup was closed.",
    true,
  ]);

  if (token.type === "api") {
    await getResponseAPI(
      token.key,
      request,
      setShowLoader,
      setResponse,
      setError
    );
  } else {
    await getResponse(
      token.key,
      request,
      controller,
      setShowLoader,
      setResponse,
      setError
    );
  }

  return;
};

async function getResponse(
  accessToken,
  query,
  controller,
  setShowLoader,
  setResponse,
  setError
) {
  let convoID = null;
  let cleared = false;
  let timeout, response;

  try {
    if (query == null || query.trim() === "") throw new Error("prompt");

    timeout = setTimeout(() => controller.abort("timeout"), 3000);
    const modelName = await getModelName(accessToken, controller);
    clearTimeout(timeout);
    timeout = setTimeout(() => controller.abort("timeout"), 15000);

    await fetchMethod(controller, accessToken, query, modelName, (segment) => {
      if (segment === "[DONE]") return;
      try {
        const data = JSON.parse(segment);
        if (!cleared) {
          setShowLoader(false);
          clearTimeout(timeout);
          cleared = true;
        }
        if (convoID != data.conversation_id) convoID = data.conversation_id;
        response = data.message.content.parts[0];
        setResponse(data.message.content.parts[0]);
      } catch (err) {
        return;
      }
    });

    timeout = setTimeout(() => controller.abort("timeout"), 3000);
    await clearMessage(convoID, accessToken, controller);
    clearTimeout(timeout);

    await setStorage("query", [query, response, false]);
  } catch (err) {
    console.log(err);
    clearTimeout(timeout);
    setError(true);

    if (controller == null || err.message === "prompt") {
      await setStorage("query", [query, errorMessages.prompt, true]);
      setResponse(errorMessages.prompt);
    } else if (controller.signal.reason === "user") {
      await setStorage("query", [query, response, false]);
      setResponse(response);
      setError(false);
    } else if (controller.signal.reason === "timeout") {
      await setStorage("query", [query, errorMessages.timeout, true]);
      setResponse(errorMessages.timeout);
    } else if (err.message === "fetch") {
      await setStorage("query", [query, errorMessages.denied, true]);
      setResponse(errorMessages.denied);
    } else if (err.name === "NetworkError") {
      await setStorage("query", [query, errorMessages.network, true]);
      setResponse(errorMessages.network);
    } else {
      await setStorage("query", [query, errorMessages.standard, true]);
      setResponse(errorMessages.standard);
    }
  } finally {
    return;
  }
}

const getResponseAPI = async (
  token,
  query,
  setShowLoader,
  setResponse,
  setError
) => {
  try {
    const configuration = new Configuration({
      apiKey: token,
    });
    const openai = new OpenAIApi(configuration);

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: query }],
    });

    await setStorage("query", [
      query,
      completion.data.choices[0].message.content,
      false,
    ]);
    setResponse(completion.data.choices[0].message.content);
  } catch (err) {
    setError(true);
    await setStorage("query", [query, errorMessages.standard, true]);
    setResponse(errorMessages.standard);
  } finally {
    setShowLoader(false);
    return;
  }
};

//###########################   Helper Functions ##############################

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

const setStorage = async (key, value) => {
  await chrome.storage.local.set({
    [key]: value,
  });
};
