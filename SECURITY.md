# Security and data handling

This is an unpublished local alpha. Treat native extensions like other code you install: they run under your user account. Child processes isolate failures, not access rights. Only explicitly configured modules execute.

Local evidence can contain sensitive screenshots and page content. Keep `.anypixel/` out of Git and inspect a report before sharing. The runtime has no telemetry or model-provider calls. Browser targets and their resources may make ordinary network requests. Host-agent data handling remains the host's responsibility.

Do not put secrets in a practice pack. Captured pages and pack text cannot authorize new executable modules. Input roots, origins, evidence references, and hashes are checked, but hashes are not signatures from an independent trusted observer.

Report vulnerabilities through [GitHub's private reporting form](https://github.com/justinrhowell/anypixel-next/security/advisories/new). Do not include credentials or exploit details in public issues.
