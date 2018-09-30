addEventListener("fetch", event => {
  event.passThroughOnException();
  event.respondWith(handleRequest(event));
});

function logException(ex) {
  const sentryProjectId = "<Replace-Me-With-Your-Sentry-Project-Id>";
  const sentryAPIKey = "<Replace-Me-With-Your-Sentry-API-Key>";
  const sentrySecretKey = "<Replace-Me-With-Your-Sentry-Secret-Key>";

  return fetch(
    `https://sentry.io/api/${sentryProjectId}/store/?sentry_version=7&sentry_client=raven-js%2F3.24.2&sentry_key=${sentryAPIKey}&sentry_secret=${sentrySecretKey}`,
    {
      body: JSON.stringify({
        project: sentryProjectId,
        logger: "javascript",
        platform: "javascript",
        environment: "production",
        exception: {
          values: [
            { type: "Error", value: ex && ex.message ? ex.message : "Unknown" }
          ]
        }
      }),
      method: "POST"
    }
  );
}

async function handleRequest(event) {
  const { request } = event;

  try {
    const isHtml =
      request.headers.has("accept") &&
      request.headers.get("accept").includes("text/html");

    const [response, fontResponse] = await Promise.all([
      fetch(request),
      isHtml
        ? fetch(
            "https://fonts.googleapis.com/css?family=Lato:300,400,700,900",
            {
              headers: {
                "User-Agent": request.headers.get("user-agent")
              }
            }
          )
        : null
    ]);

    if (
      !fontResponse ||
      !response.headers.has("content-type") ||
      !response.headers.get("content-type").includes("text/html")
    ) {
      return response;
    }

    const html = await response.text();
    const css = await fontResponse.text();
    const style = css.replace(/}/g, "font-display: swap; }");

    return new Response(
      html.replace(/<\/head>/, `<style>${style}</style></head>`),
      {
        headers: response.headers
      }
    );
  } catch (ex) {
    event.waitUntil(logException(ex));

    throw ex;
  }
}
