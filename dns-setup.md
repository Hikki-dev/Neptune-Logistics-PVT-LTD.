# DNS for AI Discovery (DNS-AID) Setup Guide

To pass the DNS-AID (DNS-based Agent Discovery) checks for `neptunelogistics.lk`, you need to publish specific ServiceMode SVCB or HTTPS records in your domain's DNS zone and enable DNSSEC.

---

## 1. DNS Records to Add

Log into your DNS provider (e.g., Cloudflare, AWS Route 53, Namecheap) and add the following record:

### Option A: Standard SVCB Record (Recommended)
- **Record Type:** `SVCB`
- **Name / Host:** `_a2a._agents` (fully qualified: `_a2a._agents.neptunelogistics.lk`)
- **TTL:** `3600` (or `Auto`)
- **Priority:** `1`
- **Target / Value:** `neptunelogistics.lk`
- **Parameters (SvcParams):** `alpn="a2a" port=443 mandatory=alpn,port`

#### BIND Zone File Format:
```dns
_a2a._agents.neptunelogistics.lk. 3600 IN SVCB 1 neptunelogistics.lk. alpn="a2a" port=443 mandatory=alpn,port
```

---

### Option B: HTTPS Record (Alternative for providers without SVCB support)
If your DNS provider does not explicitly list `SVCB` but supports `HTTPS` records, add this instead:
- **Record Type:** `HTTPS`
- **Name / Host:** `_a2a._agents`
- **TTL:** `3600`
- **Priority:** `1`
- **Target / Value:** `neptunelogistics.lk`
- **Parameters:** `alpn="a2a" port=443 mandatory=alpn,port`

#### BIND Zone File Format:
```dns
_a2a._agents.neptunelogistics.lk. 3600 IN HTTPS 1 neptunelogistics.lk. alpn="a2a" port=443 mandatory=alpn,port
```

---

## 2. Enable DNSSEC (Required)

The DNS-AID scanner validates discovery records using DNS-over-HTTPS (DoH). For these records to be trusted:
1. **Enable DNSSEC** in your DNS provider control panel (e.g., Cloudflare DNSSEC card).
2. **Add DS Records** to your domain registrar (e.g., GoDaddy, Name.com) using the values provided by your DNS host.
3. This signs the zone, ensuring that resolvers return authenticated data (`AD` flag set) and prevent spoofing.
