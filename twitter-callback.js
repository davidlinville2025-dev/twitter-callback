export default async function handler(req, res) {
  const code = req.query.code;
  const state = req.query.state;
  const verifier = state; // simplistic; real impl should store verifier

  if (!code) {
    return res.status(400).send("Missing code");
  }

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("client_id", process.env.CLIENT_ID);
  params.append("redirect_uri", process.env.REDIRECT_URI);
  params.append("code_verifier", verifier);
  params.append("code", code);

  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });

  const data = await response.json();
  console.log("Token response:", data);

  res.status(200).json(data);
}
