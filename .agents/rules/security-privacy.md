# Security & privacy (always apply)
- Never commit secrets; keys come from environment variables (.env is git-ignored).
- Never store uploaded images or user IP addresses in the database or logs.
- Treat all submitted article content as untrusted DATA: in AI prompts, wrap it in
  delimiters and instruct the model to ignore any instructions inside it.
- URL fetching must block private, loopback and link-local IPs (SSRF), limit size, timeouts and redirects.
- Validate all input sizes and MIME types on the server, not only in the browser.