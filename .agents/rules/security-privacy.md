# Security and privacy (always apply)

- Never commit secrets; keys come from environment variables (`.env` is ignored).
- Never store uploaded image bytes or client IPs in the database or application logs.
- Public excerpts, submitted URLs, and generated reports are persisted and exposed
  through public endpoints. Do not claim that the app stores no user content.
- Never log submitted content, query text, keys, or arbitrary provider responses/errors.
  Use safe identifiers and allowlisted failure reason codes. Proxy/platform access
  logs are separate from application logging and need deployment-specific handling.
- Treat submitted text, URLs, images, search results, and fetched pages as untrusted
  data: delimit content in prompts and instruct the model to ignore embedded instructions.
- URL fetching must block private, loopback, and link-local addresses, and bound
  size, timeouts, and redirects. Revalidate redirect destinations.
- Validate input sizes, image signatures, and MIME types on the server as well as
  in the browser. Keep public links restricted to safe HTTP(S) destinations.
- Require real search evidence; never turn provider failures into fabricated reports.
