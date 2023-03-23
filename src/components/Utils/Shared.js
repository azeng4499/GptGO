/* global chrome */

export const errorMessages = {
  standard: "\n\n```error\n🛑 A network or API error occurred! 🛑\n```",
  prompt: "\n\n```error\n🛑 Invalid prompt. 🛑\n```",
  denied: "\n\n```error\n🛑 ChatGPT error. Too many requests in a row. 🛑\n```",
  timeout: "\n\n```error\n🛑 Timeout error. 🛑\n```",
  abort: "\n\n```error\n🛑 User aborted search. 🛑\n```",
  closed: "\n\n```error\n🛑 Search aborted because popup was closed. 🛑\n```",
  notFound: "\n\n```error\n🛑 Couldn't find chat. Click new chat icon. 🛑\n```",
  invalidKey:
    "\n\n```error\n🛑 Your key is either incorrect or invalidated. 🛑\nClick the ? to enter a new key\n```",
};

export async function* streamMethod(stream) {
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

export const setStorage = async (key, value) => {
  await chrome.storage.local.set({
    [key]: value,
  });
};

export const getStorage = async (key) => {
  const response = await chrome.storage.local.get([key]);
  const value = response[key];
  return value;
};
