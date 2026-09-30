# Hermes VPS Transport & Network Hardening Runbook
## Phase 1A: Security Containment — TanAir Cloud

**Generated:** 2026-09-20  
**Author:** Lead Senior DevOps Engineer & Security Architect  
**Classification:** Operational Runbook  
**Target Infrastructure:** Tencent Cloud VPS (`43.134.124.127`), Cloudflare / Nginx Reverse Proxy, Vercel Serverless  

---

## 1. Overview & Current Topology

### Current Topology (Insecure Prototype State)
```
[User Browser]
      │
   (HTTPS)
      ▼
[Vercel Serverless / Next.js]
      │
   (Plaintext HTTP over Public Internet, Port 9119)  <-- CRITICAL VULNERABILITY (SEC-002)
      ▼
[Tencent Cloud VPS: 43.134.124.127:9119]
      │
   (Internal Localhost IPC)
      ▼
[Hermes Python ReAct Engine] ──► [OpenD Docker: 127.0.0.1:11111]
```

**Identified Risks:**
1. Chat prompts, market analyses, and responses travel across public networks in unencrypted cleartext.
2. Port 9119 is open directly to the internet on the public IP, allowing direct origin bypass without Vercel auth.
3. VPS IP was previously committed in `.env.example` on GitHub.

---

## 2. Target Topology (Hardened Production State)

```
[User Browser]
      │
   (HTTPS)
      ▼
[Vercel Serverless / Next.js]
      │
   (Encrypted HTTPS + Secret Header: X-Aura-Secret)
      ▼
[Cloudflare Edge / Nginx Reverse Proxy: gateway.tanair.my:443]
      │
   (Loopback / Authenticated Tunnel)
      ▼
[Hermes VPS Internal Daemon: 127.0.0.1:9119]
```

---

## 3. Implementation Steps (Infrastructure Action Plan)

> **Important:** Modifying remote DNS, firewall rules, and reverse proxy settings requires direct VPS access. The Next.js application has been hardened to enforce `https://` in production via `HermesGatewayAdapter`. The founder/operator must execute the following infrastructure steps on Tencent Cloud.

### Step 1: DNS Configuration
1. In your DNS provider (e.g. Cloudflare / Namecheap), create an `A` record or `CNAME` for the gateway:
   - **Type:** `A`
   - **Name:** `gateway` (resolving to `gateway.tanair.my`)
   - **Target IP:** `43.134.124.127`
   - **Proxy Status:** Proxied (Orange Cloud if using Cloudflare)

### Step 2: TLS Termination & Reverse Proxy Setup on VPS
Configure Nginx on the Hermes VPS to terminate TLS with Let's Encrypt (Certbot) and proxy requests to the internal Python engine:

```nginx
# /etc/nginx/sites-available/hermes-gateway
server {
    server_name gateway.tanair.my;

    # Restrict request size to match Next.js defensive limits
    client_max_body_size 1m;

    location / {
        proxy_pass http://127.0.0.1:9119;
        proxy_http_version 1.1;

        # SSE Streaming requirements
        proxy_set_header Connection '';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable buffering to preserve fluid token streaming
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;

        # Proxy timeouts for long ReAct reasoning loops
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/gateway.tanair.my/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gateway.tanair.my/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    listen 80;
    server_name gateway.tanair.my;
    return 301 https://$host$request_uri;
}
```

### Step 3: Firewall & Origin Restriction (Tencent Cloud Security Group)
Once `gateway.tanair.my` is operational over HTTPS (port 443):
1. Navigate to Tencent Cloud Console → Cloud Virtual Machine → Security Groups.
2. **Remove public ingress rule for port 9119**.
3. Bind port 9119 strictly to `127.0.0.1` on the VPS so it is only reachable via the local Nginx proxy:
   ```bash
   # In Hermes configuration, ensure host binds to 127.0.0.1, not 0.0.0.0
   ```
4. Allow inbound traffic on port 443 (HTTPS) and port 22 (SSH).

### Step 4: Shared Gateway Secret Configuration
Generate a strong 64-character secret and configure it in both environments:
```bash
# Generate secret
openssl rand -hex 32
```
- On VPS Hermes daemon: Set `HERMES_GATEWAY_SECRET=<secret>`
- On Vercel Project Settings: Set `HERMES_GATEWAY_SECRET=<secret>`
- On Vercel Project Settings: Set `HERMES_GATEWAY_URL=https://gateway.tanair.my`

---

## 4. Verification Commands

Run the following checks to confirm hardened connectivity:

```bash
# 1. Verify TLS certificate and HTTPS connection
curl -Iv https://gateway.tanair.my/health

# 2. Verify that raw HTTP port 9119 is blocked externally
curl -Iv --connect-timeout 5 http://43.134.124.127:9119/health
# Expected result: Connection timed out or Connection refused (BLOCKED)

# 3. Verify that secret header is required
curl -X POST https://gateway.tanair.my/api/chat/start \
  -H "Content-Type: application/json" \
  -d '{"message":"ping"}'
# Expected result: 401 Unauthorized (when secret header is missing)

# 4. Verify SSE token streaming over HTTPS
curl -N -X POST https://gateway.tanair.my/api/chat/start \
  -H "Content-Type: application/json" \
  -H "X-Aura-Secret: <your-secret>" \
  -d '{"message":"salam","session_id":"test-1","agent_id":"aura","user_id":"test"}'
```

---

## 5. Rollback Procedure

If the Nginx reverse proxy fails or SSL certificate renewal lapses:
1. Temporarily allow port 9119 in Tencent Cloud Security Group.
2. In Vercel Environment Variables:
   - Set `ALLOW_INSECURE_HERMES_HTTP=true`
   - Set `HERMES_GATEWAY_URL=http://43.134.124.127:9119`
3. Redeploy Next.js.
4. Investigate Nginx error logs on VPS (`/var/log/nginx/error.log`).

---

## 6. Responsibility Matrix & Ownership

| Task | Responsible Role | Status |
|---|---|---|
| Next.js HTTPS protocol enforcement & adapter | Lead Software Architect (Antigravity) | ✅ Completed |
| Request correlation ID (`x-request-id`) propagation | Security Engineer (Antigravity) | ✅ Completed |
| Insecure HTTP rejection in production code | Security Engineer (Antigravity) | ✅ Completed |
| DNS Record Creation (`gateway.tanair.my`) | Founder / Platform Owner | ⏳ Pending VPS Infra Action |
| Let's Encrypt TLS Certificate Issuance | Founder / Platform Owner | ⏳ Pending VPS Infra Action |
| Tencent Cloud Security Group Rule Port 9119 Lockdown | Founder / Platform Owner | ⏳ Pending VPS Infra Action |

---

*End of Hermes Transport Hardening Runbook — Phase 1A*
