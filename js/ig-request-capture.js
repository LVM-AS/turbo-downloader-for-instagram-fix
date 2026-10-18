(() => {
  if (!chrome.webRequest) return;

  const STORAGE_KEY = "igdlCapturedInstagramRequests";
  const DEFAULT_ASBD_ID = "359341";
  const PER_REQUEST_VARIABLES = new Set([
    "username",
    "id",
    "user_id",
    "shortcode",
    "after",
    "before",
    "first",
    "last",
  ]);
  let captured = { auth: {}, docs: {} };
  const ready = chrome.storage.local
    .get(STORAGE_KEY)
    .then((stored) => {
      const value = stored[STORAGE_KEY];
      if (value && typeof value === "object") {
        captured = {
          auth: { ...(value.auth || {}), ...captured.auth },
          docs: { ...(value.docs || {}), ...captured.docs },
        };
      }
    })
    .catch((error) => {
      console.error("[IGDL] Could not load captured Instagram request data", error);
    });

  function save() {
    return chrome.storage.local
      .set({ [STORAGE_KEY]: captured })
      .catch((error) => {
        console.error("[IGDL] Could not save captured Instagram request data", error);
      });
  }

  function headerValue(headers, name) {
    const header = headers?.find(
      (entry) => entry.name.toLowerCase() === name.toLowerCase(),
    );
    return typeof header?.value === "string" && header.value
      ? header.value
      : null;
  }

  function getFormParams(requestBody) {
    if (requestBody?.formData) {
      const params = new URLSearchParams();
      for (const [key, values] of Object.entries(requestBody.formData)) {
        const value = Array.isArray(values)
          ? values.find((item) => typeof item === "string")
          : null;
        if (typeof value === "string") params.set(key, value);
      }
      return params;
    }

    const bytes = requestBody?.raw?.find(
      (part) => part.bytes instanceof ArrayBuffer,
    )?.bytes;
    if (!bytes) return null;
    try {
      return new URLSearchParams(new TextDecoder().decode(bytes));
    } catch (error) {
      console.warn("[IGDL] Could not inspect an Instagram GraphQL request", error);
      return null;
    }
  }

  function update(patch) {
    void ready.then(() => {
      captured = {
        auth: { ...captured.auth, ...(patch.auth || {}) },
        docs: { ...captured.docs, ...(patch.docs || {}) },
      };
      void save();
    });
  }

  chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      if (details.tabId < 0) return;
      const auth = {};
      const appId = headerValue(details.requestHeaders, "x-ig-app-id");
      const asbdId = headerValue(details.requestHeaders, "x-asbd-id");
      const wwwClaim = headerValue(details.requestHeaders, "x-ig-www-claim");
      if (appId) auth.appId = appId;
      if (asbdId && (asbdId !== DEFAULT_ASBD_ID || !captured.auth.asbdId))
        auth.asbdId = asbdId;
      if (wwwClaim && wwwClaim !== "0") auth.wwwClaim = wwwClaim;
      if (Object.keys(auth).length) update({ auth });
    },
    {
      urls: ["https://www.instagram.com/*", "https://i.instagram.com/*"],
      types: ["xmlhttprequest"],
    },
    ["requestHeaders"],
  );

  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (details.tabId < 0 || details.method !== "POST") return;
      const params = getFormParams(details.requestBody);
      const docId = params?.get("doc_id")?.trim();
      if (!docId || !/^\d+$/.test(docId)) return;

      let variables;
      try {
        variables = JSON.parse(params.get("variables") || "null");
      } catch (error) {
        console.warn("[IGDL] Could not parse Instagram GraphQL variables", error);
        return;
      }
      if (
        !variables ||
        typeof variables !== "object" ||
        typeof variables.username !== "string" ||
        !variables.data ||
        typeof variables.data !== "object" ||
        !("count" in variables.data)
      )
        return;

      const key = variables.after ? "profilePostsPage" : "profilePosts";
      const template = {};
      for (const [name, value] of Object.entries(variables)) {
        if (!PER_REQUEST_VARIABLES.has(name)) template[name] = value;
      }
      update({ docs: { [key]: { docId, template } } });
    },
    {
      urls: [
        "https://www.instagram.com/graphql/query*",
        "https://www.instagram.com/api/graphql*",
      ],
      types: ["xmlhttprequest"],
    },
    ["requestBody"],
  );
})();
