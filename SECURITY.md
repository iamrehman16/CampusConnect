# Security Policy

## Supported versions

Security fixes are made on the `main` branch and shipped with the next
deployment. Older tags do not receive backports.

| Version | Supported |
| --- | --- |
| `main` | Yes |
| `1.x` tags | No, upgrade to `main` |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
discussions or pull requests.**

Report them privately through GitHub:

1. Go to the [Security tab](https://github.com/iamrehman16/CampusConnect/security) of this repository.
2. Click **Report a vulnerability**.
3. Describe the issue, the affected component (`client/` or `server/`,
   endpoint or file), steps to reproduce, and the impact you expect.

If that option is unavailable, contact the maintainer,
[@iamrehman16](https://github.com/iamrehman16), privately via the email
address on their GitHub profile and ask for a secure channel. Do not include
exploit details in the first message.

## What to expect

- Acknowledgement within 3 working days.
- An initial assessment within 7 days, including whether the report is
  accepted and a rough timeline for a fix.
- Credit in the release notes once a fix ships, unless you prefer to stay
  anonymous.

## Scope

In scope:

- Authentication and session handling (JWT, refresh token rotation, Google sign-in).
- Authorization and role checks (Student, Contributor, Admin).
- File upload and Cloudinary signing.
- Injection, XSS, CSRF and data exposure in the API or the client.
- Prompt injection that leaks other users' data through the AI assistant.

Out of scope:

- Vulnerabilities in third-party services (MongoDB Atlas, Qdrant, Groq,
  Gemini, LlamaParse, Cloudinary, Render, Vercel). Report those to the vendor.
- Denial of service through volume or rate-limit exhaustion of free-tier
  dependencies.
- Findings that require a compromised device or browser.

Please test only against your own local deployment, never against the public
demo or other users' accounts or data.
