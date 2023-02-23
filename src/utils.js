export async function getModelName(accessToken) {
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
    console.error(err);
    return "text-davinci-002-render";
  }
}

export async function* streamAsyncIterable(stream) {
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
