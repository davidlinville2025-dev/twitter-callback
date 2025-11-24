export default async function handler(req, res) {
  try {
    const { code, state, error, error_description } = req.query;

    // If Twitter redirected back with an error, show it
    if (error) {
      console.error("Twitter OAuth error:", error, error_description);
      return res.status(400).json({
        error,
        error_description,
      });
    }

    if (!code) {
      return res.status(400).send("Missing code");
    }

    if (!state) {
      return res.status(400).send("Missing state (used as code_verifier)");
    }

    const verifier = state; // we will generate this when creating the auth URL

    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const redirectUri = process.env.REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return res
        .status(500)
        .send(
          "Missing CLIENT_ID, CLIENT_SECRET, or REDIRECT_URI env vars on the server."
        );
    }

    // Build the form body for the token exchange
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("client_id", clientId);
    params.append("redirect_uri", redirectUri);
    params.append("code_verifier", verifier);
    params.append("code", code);

    // Basic auth header: base64(CLIENT_ID:CLIENT_SECRET)
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    const tokenResponse = await fetch(
      "https://api.twitter.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: params.toString(),
      }
    );

    const data = await tokenResponse.json();
    console.log("Token response:", data);

    if (!tokenResponse.ok) {
      // Forward Twitter's error so you can see what's wrong
      return res.status(tokenResponse.status).json(data);
    }

    // At this point, data should contain access_token, refresh_token, etc.
    // Example shape:
    // {
    //   "token_type": "bearer",
    //   "expires_in": 7200,
    //   "access_token": "...",
    //   "scope": "tweet.read tweet.write users.read offline.access",
    //   "refresh_token": "..."
    // }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Unexpected error in callback handler:", err);
    return res.status(500).json({ error: "internal_error", detail: String(err) });
  }
}
