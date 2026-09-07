# MCP Router — smoke test for the HTTP aggregator (remote / local)
# Usage:
#   .\scripts\smoke-gateway.ps1
#   .\scripts\smoke-gateway.ps1 -BaseUrl "http://127.0.0.1:3282" -Token $env:MCPR_TOKEN

param(
  [string]$BaseUrl = "http://127.0.0.1:3282",
  [string]$Token = $env:MCPR_TOKEN
)

$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd("/")

Write-Host "==> GET $BaseUrl/health"
$health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
if (-not $health.ok) {
  throw "Health check failed: $($health | ConvertTo-Json -Compress)"
}
Write-Host ("OK service={0} host={1} port={2}" -f $health.service, $health.host, $health.port)

if ([string]::IsNullOrWhiteSpace($Token)) {
  Write-Host "Skip /mcp/status (set -Token or MCPR_TOKEN for authenticated check)"
  exit 0
}

Write-Host "==> GET $BaseUrl/mcp/status (Bearer)"
$headers = @{ Authorization = "Bearer $Token" }
$status = Invoke-RestMethod -Uri "$BaseUrl/mcp/status" -Method Get -Headers $headers
if (-not $status.ok) {
  throw "Status check failed: $($status | ConvertTo-Json -Compress)"
}
Write-Host ("OK sessions={0}" -f $status.sessions)
Write-Host "Smoke passed."
