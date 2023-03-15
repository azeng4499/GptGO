import { createParser } from "eventsource-parser";
import { errorMessages, streamMethod, setStorage } from "./Shared";

export const getResponseAPI = async (
  token,
  query,
  setShowLoader,
  setResponse
) => {
  let timestamp = Date.now(),
    response = "",
    cleared = false;

  try {
    if (query == null || query.trim() === "") throw new Error("prompt");

    await setStorage("query", [query, errorMessages.closed]);

    await fetchMethodAPI(token, query, (segment) => {
      if (segment === "[DONE]") return;
      try {
        const data = JSON.parse(segment);
        if (!cleared) {
          setShowLoader(false);
          cleared = true;
        }

        const content = data.choices[0].delta.content;
        response += content == null ? "" : content;
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
    });

    await setStorage("query", [query, response]);
  } catch (err) {
    if (err.message === "prompt") {
      await setStorage("query", [query, errorMessages.prompt]);
      setResponse(errorMessages.prompt);
    } else if (err.message === "invalidKey") {
      await setStorage("query", [query, errorMessages.invalidKey]);
      setResponse(errorMessages.invalidKey);
    } else {
      await setStorage("query", [query, response + errorMessages.standard]);
      setResponse(response + errorMessages.standard);
    }
  } finally {
    setShowLoader(false);
    return;
  }
};

async function fetchMethodAPI(token, query, callback) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: query }],        
      stream: true,
    }),
  });

  if (resp.status === 401) {
    throw new Error("invalidKey");
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
