# auth.md

**Site:** https://neptunelogistics.lk  
**Version:** 1.0  
**Updated:** 2026-06-05

---

## Audience

This document is for AI agents and automated clients that want to interact with Neptune Logistics (Pvt) Ltd.

---

## Authentication Methods

**identity_types_supported:** anonymous

This site is **publicly accessible**. No credentials, API keys, tokens, or prior registration are required to access any content or discovery endpoint.

---

## Agent Registration

**register_uri:** https://neptunelogistics.lk/contact.html

### Registration Steps

1. No registration is required for read access — agents may access all public content freely without any prior registration or credential provisioning.
2. For integration partnerships (bulk data access, API collaboration), submit an inquiry via the contact form at https://neptunelogistics.lk/contact.html.
3. A human representative will respond and provision access if applicable.

---

## Credential Use

**credential_types_supported:** none

No credentials are issued or required. All endpoints return public data with no authorization gate. Agents should send requests without any `Authorization` header.

---

## Supported Identity Types

| Type | Details |
|---|---|
| `anonymous` | All agents accepted, no identity assertion required |

---

## Discovery Endpoints

| Document | URL |
|---|---|
| OAuth Protected Resource Metadata | https://neptunelogistics.lk/.well-known/oauth-protected-resource |
| OAuth Authorization Server Metadata | https://neptunelogistics.lk/.well-known/oauth-authorization-server |
| API Catalog | https://neptunelogistics.lk/.well-known/api-catalog |
| Agent Skills Index | https://neptunelogistics.lk/.well-known/agent-skills/index.json |
| MCP Server Card | https://neptunelogistics.lk/.well-known/mcp/server-card.json |
| JWKS | https://neptunelogistics.lk/.well-known/jwks.json |
