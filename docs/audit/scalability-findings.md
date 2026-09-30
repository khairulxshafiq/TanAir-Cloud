# Scalability Findings
## Phase 0B — TanAir Cloud Audit

**Generated:** 2026-09-20  
**Auditor:** Antigravity (Platform & Scalability Engineer)  
**Phase:** 0B — Audit & Risk Register

---

## 1. Executive Summary

TanAir Cloud is currently architected as a thin client-side wrapper over Next.js Serverless routes, connecting to a single-node Hermes instance running on an unscaled Tencent Cloud VPS (`43.134.124.127:9119`). While the frontend (Vercel) and database (Supabase) have inherent multi-tenant autoscaling mechanisms, the backend inference and gateway tier is a hard single point of failure (SPOF) that will experience degradation and bottlenecking under concurrent loads.

**Overall Scalability Score: 3/10** (Prototype baseline — severe backend constraints)

---

## 2. Scalability Tier Assessment

### Tier 1: 100 Users (Closed Beta / Early Access)

* **Suitability:** 🟢 **Viable with Minor Fixes**
* **Frontend (Vercel):** Seamlessly handles 100 concurrent/daily active users on Vercel Free/Pro tier edge networks.
* **Database (Supabase):** Supabase Free tier provides 500MB DB storage and 50,000 monthly active users. Easily handles 100 users.
* **Hermes VPS (Port 9119):**
  * *Concurrency:* Assuming 5–10 concurrent streaming sessions, the single-node Python ReAct engine will hold up if CPU/memory utilization remains bounded.
  * *Bottlenecks:* Timeout issues (3500ms AbortController) when multiple users invoke heavy LLM ReAct tool loops simultaneously.
* **Key Risks:**
  * In-memory session loss causes user frustration on mobile reload.
  * Lack of rate limiting allows one erratic user or script to exhaust VPS worker threads.

---

### Tier 2: 1,000 Users (Public Beta / Commercial Launch)

* **Suitability:** 🟡 **Requires Architecture Upgrades**
* **Frontend (Vercel):**
  * Serverless function execution limits on Vercel Free Tier (100 GB-hours/month, max duration 10–60s) will be breached by continuous SSE streaming.
  * Must upgrade to Vercel Pro ($20/mo) for longer SSE timeouts and higher execution quotas.
* **Database (Supabase):**
  * Direct client connection pool exhaustion if connections aren't pooled via PgBouncer/Supabase Supavisor.
  * Storage for chat history and media will require automated partitioning and indexes.
* **Hermes VPS (Port 9119):**
  * *Failure Mode:* A single Python gateway process cannot handle 50–100 concurrent SSE streams without asynchronous concurrency bottlenecks or thread starvation.
  * *Latency Spikes:* ReAct agent reasoning cycles will queue up, causing timeouts (>3500ms) and triggering the fallback BM script for real paying customers.
* **Key Risks:**
  * VPS network bandwidth saturation (plain HTTP without Brotli/gzip compression).
  * Single IP rate limiting by upstream LLM providers (e.g., OpenAI/Anthropic/DeepSeek API quotas hit from single VPS IP).

---

### Tier 3: 10,000 Users (Full Scale Production)

* **Suitability:** 🔴 **Catastrophic Failure under Current Design**
* **Frontend (Vercel):** Requires multi-region edge middleware, optimized caching, and CDN tiering.
* **Database (Supabase):**
  * Free/Pro tier limits exceeded; requires Enterprise or Dedicated Compute add-ons with connection pooling, table partitioning, and read replicas for analytics/admin queries.
  * Row Level Security (RLS) query overhead will degrade chat query times if composite indexes on `(user_id, created_at)` and `(session_id)` are not optimized.
* **Hermes VPS (Port 9119):**
  * Single VPS instance will crash completely under load.
  * No load balancer, no horizontal pod autoscaling (HPA), no queue/buffer (Kafka, RabbitMQ, Celery, or Redis Streams).
  * OpenD Docker instance (`127.0.0.1:11111`) cannot handle thousands of concurrent Bursa Malaysia quotation requests.

---

## 3. Bottlenecks & Architectural Risks

```
[10,000 Users]
      │
      ▼
┌───────────────────────────────┐
│ Vercel Serverless Functions   │ ──► [Pro Tier Required, Bandwidth Costs]
└──────────────┬────────────────┘
               │
        [Direct HTTP]  <-- SPOF & Bottleneck
               │
               ▼
┌───────────────────────────────┐
│ Single VPS (43.134.124.127)   │ ──► [Process Crash, Thread Starvation,
│ Port :9119 Gateway           │      Queue Overflow, Memory Exhaustion]
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ Hermes ReAct Core Engine      │ ──► [LLM Token Rate Limits, Tool Latency]
└───────────────────────────────┘
```

| Component | Scalability Bottleneck | Mitigating Architectural Pattern |
|---|---|---|
| **Gateway Ingress** | Single VPS IP (`:9119`), non-load-balanced | Cloudflare Load Balancer + Multiple Hermes worker nodes |
| **Request Handling** | Synchronous HTTP POST-and-stream | Asynchronous Task Queue (Redis/Upstash + BullMQ/Celery) |
| **State & Memory** | Ephemeral browser React state | Supabase Postgres with connection pooling & optimistic client cache |
| **OpenD Container** | Local socket connection, single session | Dedicated market data caching layer (Redis with 10s TTL for ticker data) |
| **Observability** | No metrics, no APM, console logs only | Prometheus/Grafana or Datadog tracing, OpenTelemetry |

---

## 4. Monitoring & Logging Limitations

1. **Zero Centralized Telemetry:** Currently, API route failures are silently handled or printed via `console.error`.
2. **Missing Correlation IDs:** No `x-request-id` or tracing headers passed between browser, Vercel Serverless, and Hermes VPS.
3. **No APM (Application Performance Monitoring):** Impossible to diagnose whether latency is originating from Vercel edge, internet transit, VPS Python runtime, or upstream LLM inference.

---

*End of Scalability Findings — Phase 0B*

