chrome.runtime.onMessage.addListener(async function (request) {
  chrome.storage.local.set({ query: request.payload });
  // console.log("Loading...");
  // const params_ = {
  //   model: "text-davinci-003",
  //   prompt: "This is a test",
  //   temperature: 0.7,
  //   max_tokens: 256,
  // };

  // const requestOptions = {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization:
  //       "Bearer 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",
  //   },
  //   body: JSON.stringify(params_),
  // };

  // const response = await fetch(
  //   "https://api.openai.com/v1/completions",
  //   requestOptions
  // );
  // const data = await response.json();
  // console.log(data.choices[0].text);
});
