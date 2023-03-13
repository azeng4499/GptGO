/* global chrome */

import { getResponse } from "./BrowserFunctions";
import { getResponseAPI } from "./PersonalAPIFunctions";
import { setStorage } from "./Shared";

export const callAPI = async (
  request,
  controller,
  setShowLoader,
  setResponse,
  token,
  convoInfo,
  setConvoInfo
) => {
  await setStorage("query", [request, null]);

  if (token.type === "api") {
    await getResponseAPI(token.key, request, setShowLoader, setResponse);
  } else {
    await getResponse(
      token.key,
      request,
      controller,
      setShowLoader,
      setResponse,
      convoInfo,
      setConvoInfo
    );
  }

  return;
};
