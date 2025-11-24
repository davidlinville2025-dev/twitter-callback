// api/twitter-callback.js

export default async function handler(req, res) {
  const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, CODE_VERIFIER } = process.env;

  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !CODE_VERIFIER) {
    return res.status(500).json({
      error: "server_config_error",
      message:
        "Missing CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, or CODE_VERIFIER env vars on the server.",
    });
  }

  const { code, state, error, error_description } = req.query;

  // If Twitter sent an error back in the query
  if (error) {
    return res.status(400).json({
      error,
      error_description,
    });
  }

  if (!code) {
    return res.status(400).send("Missing code");
  }

  // Twitter OAuth2 token exchange (Authorization Code + PKCE)
  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  try {
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: CODE_VERIFIER, // MUST match your code_challenge from the authorize URL
      }),
    });

    const data = await tokenRes.json();

    return res.status(tokenRes.ok ? 200 : 400).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "token_request_failed",
      message: err.message,
    });
  }
}
