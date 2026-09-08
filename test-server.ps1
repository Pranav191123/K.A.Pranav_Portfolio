$testUrls = @(
  "http://localhost:8080/",
  "http://localhost:8080/styles.css",
  "http://localhost:8080/app.js",
  "http://localhost:8080/assets/portrait.jpg",
  "http://localhost:8080/assets/air-cargo-deck.jpg",
  "http://localhost:8080/assets/strip-flattening.jpg"
)

$allPassed = $true
foreach ($target in $testUrls) {
  try {
    $res = Invoke-WebRequest -Uri $target -UseBasicParsing
    Write-Host "[PASS] $target - Status: $($res.StatusCode) - Size: $($res.RawContentLength) bytes"
  } catch {
    Write-Host "[FAIL] $target - Error: $_"
    $allPassed = $false
  }
}

if ($allPassed) {
  Write-Host "`nAll 6 endpoints verified with 200 OK!"
} else {
  Write-Host "`nSome endpoints failed."
}
