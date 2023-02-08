export const errorMessages = {
  standard: "A network or API error occurred! Please try again later.",
  prompt: "Invalid prompt.",
  tooManyRequests:
    "ChatGPT limits the request rates of free users. Please wait a minute before sending another request.",
};

const getResponse = async (query, apiKey) => {
  if (query === "") {
    return { text: errorMessages.prompt, error: true };
  }
  const params = {
    text: query,
    apiKey: apiKey,
  };

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  };

  const res = await fetch(
    "https://fathomless-chamber-16549.herokuapp.com/",
    // "http://localhost:9000",
    requestOptions
  );
  if (!res) {
    return { text: errorMessages.standard, error: true };
  }

  const resJSON = await res.json();
  if (resJSON.error) {
    return { text: errorMessages.standard, error: true };
  } else {
    return { text: resJSON.response, error: false };
  }
};

// const getResponse = async (query, apiKey) => {
//   if (query === "") {
//     return { text: errorMessages.prompt, error: true };
//   } else {
//     const params = {
//       model: "text-davinci-003",
//       temperature: 0.5,
//       max_tokens: 2000,
//       prompt: query,
//       stop: "/n",
//     };

//     //"Answer the following prompt exactly like chatGPT would: " +

//     const requestOptions = {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: "Bearer " + apiKey,
//       },
//       body: JSON.stringify(params),
//     };

//     const res = await fetch(
//       "https://api.openai.com/v1/completions",
//       requestOptions
//     );
//     if (!res || (res.status != 200 && res.status != 201)) {
//       if (res.status === 429) {
//         return { text: errorMessages.tooManyRequests, error: true };
//       } else {
//         return { text: errorMessages.standard, error: true };
//       }
//     } else {
//       const data = await res.json();
//       return { text: data.choices[0].text, error: false };
//     }
//   }
// };

export default getResponse;
