import { createParser } from "eventsource-parser";
import { v4 as uuidv4 } from "uuid";
import { errorMessages, streamMethod, setStorage, getStorage } from "./Shared";

export async function getResponse(
  accessToken,
  query,
  controller,
  setShowLoader,
  setResponse,
  convoInfo,
  setConvoInfo
) {
  let cleared = false;
  let timeout,
    response = "";
  let timestamp = Date.now();

  try {
    if (query == null || query.trim() === "") throw new Error("prompt");

    timeout = setTimeout(() => controller.abort("timeout"), 3000);
    const modelName = await getModelName(accessToken, controller, convoInfo);
    clearTimeout(timeout);
    timeout = setTimeout(() => controller.abort("timeout"), 15000);

    await fetchMethod(
      controller,
      accessToken,
      query,
      modelName[0],
      convoInfo,
      (segment) => {
        if (segment === "[DONE]") return;
        try {
          const data = JSON.parse(segment);
          if (!cleared) {
            setShowLoader(false);
            clearTimeout(timeout);
            setConvoInfo({
              ...convoInfo,
              convoId: data.conversation_id,
              v4Available: modelName[1],
              parentMessageId: data.message.id,
            });
            setStorage("convoInfo", [data.conversation_id, data.message.id]);
            cleared = true;
          }

          response = data.message.content.parts[0];

          let now = Date.now();
          if (now - timestamp > 100) {
            setStorage("query", [query, response + errorMessages.closed]);
            timestamp = now;
          } else {
            setResponse(response);
          }
        } catch (err) {
          return;
        }
      }
    );
    clearTimeout(timeout);

    await setStorage("query", [query, response]);
  } catch (err) {
    console.log(err);
    clearTimeout(timeout);

    if (controller == null || err.message === "prompt") {
      await setStorage("query", [query, errorMessages.prompt]);
      setResponse(errorMessages.prompt);
    } else if (controller.signal.reason === "user") {
      await setStorage("query", [query, response + errorMessages.abort]);
      setResponse(response + errorMessages.abort);
    } else if (controller.signal.reason === "timeout") {
      await setStorage("query", [query, response + errorMessages.timeout]);
      setResponse(response + errorMessages.timeout);
    } else if (err.message === "fetch") {
      await setStorage("query", [query, response + errorMessages.denied]);
      setResponse(response + errorMessages.denied);
    } else if (err.message === "not-found") {
      await setStorage("query", [query, errorMessages.notFound]);
      setResponse(errorMessages.notFound);
    } else {
      await setStorage("query", [query, response + errorMessages.standard]);
      setResponse(response + errorMessages.standard);
    }
  } finally {
    return;
  }
}

async function getModelName(accessToken, controller, convoInfo) {
  const models = await fetch(`https://chat.openai.com/backend-api/models`, {
    method: "GET",
    signal: controller == null ? null : controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const modelsJson = await models.json();

  let gpt4 = false;

  modelsJson.models.forEach((model) => {
    if (model.slug === "gpt-4") {
      gpt4 = true;
      setStorage("gpt4-info", [true, convoInfo.v4Active]);
    }
  });

  return [modelsJson.models[0].slug, gpt4];
}

async function fetchMethod(
  controller,
  accessToken,
  query,
  modelName,
  convoInfo,
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
      conversation_id: convoInfo.convoId ? convoInfo.convoId : null,
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
      model: convoInfo.v4Active ? "gpt-4" : modelName,
      parent_message_id: convoInfo.parentMessageId
        ? convoInfo.parentMessageId
        : uuidv4(),
    }),
  });

  if (resp.status === 404) {
    throw new Error("not-found");
  }

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
