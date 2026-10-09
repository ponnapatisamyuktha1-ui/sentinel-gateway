# Sentinel Gateway

Build **Sentinel AI — AI Agent Security Gateway**, a functional, hackathon-ready cybersecurity web application that prevents AI agents from accessing or leaking confidential data without authorization.

**Design:** Create a premium cybersecurity dashboard with a dark navy theme, cyan accents, responsive layouts, threat-level indicators, charts, and a professional sidebar.

**Core Features:**

1. **Security Dashboard:** Requests inspected, threats blocked, sensitive-data alerts, and recent incidents.
2. **Email Security Center:** Simulated inbox that detects prompt injection, malicious instructions, and confidential information in emails.
3. **AI Agent Monitor:** Manage AI agents, permissions, accessible resources, and allowed tools.
4. **Data Loss Prevention (DLP):** Detect passwords, API keys, personal information, and confidential data; redact or block unauthorized disclosures.
5. **Security Gateway:** Enforce backend authorization before data access, tool calls, or outgoing emails. Support four decisions: ALLOW, REDACT, REVIEW, and BLOCK.
6. **Threat Detection:** Identify suspicious instructions, unauthorized file access, prohibited tool calls, and attempted data transfers.
7. **Policy Manager:** Configure permissions, data classifications, trusted destinations, and approval requirements.
8. **Audit Logs:** Display timestamps, agent names, actions, threat levels, decisions, and reasons.
9. **Attack Simulation Lab:** Run safe test scenarios for prompt injection, secret leakage, unauthorized access, and prohibited actions. Show results based on actual security checks.

**Technology:** Use Lovable’s supported React + TypeScript + Tailwind stack and connect Supabase for database storage, authentication, and backend Edge Functions.

**Security Requirements:**

* Enforce security rules on the backend, not only in the frontend.
* Deny unauthorized actions by default.
* Treat email content as untrusted input.
* Ensure blocked actions never execute.
* Redact sensitive data before it reaches the AI model whenever possible.
* Never expose API keys or secrets in frontend code.
* Use synthetic data and simulated agents for the initial demo.
* Clearly label simulated integrations and do not claim real email or AI-agent connections are active.

Build all pages with working navigation, connected data, functional buttons, useful empty states, and realistic sample data. Include setup instructions and test the main security scenarios. Prioritize a working end-to-end MVP over decorative features.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/05ad7aaa-9ed7-4c36-bdce-b913eb727c94).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
