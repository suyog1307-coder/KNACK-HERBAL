$BASE  = "http://127.0.0.1:3000/api/v1/auth"
$EMAIL = "authtest8@test.com"   # fresh email each run — change if needed
$PASS  = "Test@12345"

function Req {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Body = @{},
        [string]$Token = ""
    )
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token -ne "") { $headers["Authorization"] = "Bearer $Token" }
    try {
        $splat = @{
            Uri             = $Url
            Method          = $Method
            Headers         = $headers
            TimeoutSec      = 8
            UseBasicParsing = $true
            ErrorAction     = "Stop"
        }
        if ($Body.Count -gt 0) { $splat["Body"] = ($Body | ConvertTo-Json -Compress) }
        $resp = Invoke-WebRequest @splat
        return [PSCustomObject]@{ Code = [int]$resp.StatusCode; Body = ($resp.Content | ConvertFrom-Json) }
    } catch {
        $code = 0
        try { $code = [int]$_.Exception.Response.StatusCode } catch {}
        $content = ""
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $content = [System.IO.StreamReader]::new($stream).ReadToEnd()
        } catch {}
        return [PSCustomObject]@{ Code = $code; Body = ($content | ConvertFrom-Json -ErrorAction SilentlyContinue) }
    }
}

function Check {
    param([string]$Name, [int]$Got, [int]$Want)
    if ($Got -eq $Want) {
        Write-Host "[PASS] $Name  (HTTP $Got)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $Name  (got $Got, want $Want)" -ForegroundColor Red
    }
}

function Peek([string]$s) { if ($s.Length -gt 30) { return $s.Substring(0,30) + "..." } else { return $s } }

Write-Host "`n==============================" -ForegroundColor Yellow
Write-Host "  AUTH CHAIN VERIFICATION" -ForegroundColor Yellow
Write-Host "==============================`n" -ForegroundColor Yellow

# ── 1. Register ──────────────────────────────────────────────────────────────
$r = Req -Method POST -Url "$BASE/register" -Body @{ email=$EMAIL; password=$PASS; firstName="Test"; lastName="Customer" }
Check "1. Register new user → 201" $r.Code 201

# ── 2. Duplicate register ─────────────────────────────────────────────────────
$r = Req -Method POST -Url "$BASE/register" -Body @{ email=$EMAIL; password=$PASS; firstName="Test"; lastName="Customer" }
Check "2. Duplicate register → 409" $r.Code 409

# ── 3. Login ──────────────────────────────────────────────────────────────────
$r = Req -Method POST -Url "$BASE/login" -Body @{ email=$EMAIL; password=$PASS }
Check "3. Login valid creds → 200" $r.Code 200
$ACCESS  = $r.Body.data.accessToken
$REFRESH = $r.Body.data.refreshToken
Write-Host "   accessToken  : $(Peek $ACCESS)" -ForegroundColor DarkGray
Write-Host "   refreshToken : $(Peek $REFRESH)" -ForegroundColor DarkGray

# ── 4. Wrong password ─────────────────────────────────────────────────────────
$r = Req -Method POST -Url "$BASE/login" -Body @{ email=$EMAIL; password="WrongPassword" }
Check "4. Wrong password → 401" $r.Code 401

# ── 5. GET /me without token ──────────────────────────────────────────────────
$r = Req -Method GET -Url "$BASE/me"
Check "5. GET /me  no token → 401" $r.Code 401

# ── 6. GET /me with valid access token ───────────────────────────────────────
$r = Req -Method GET -Url "$BASE/me" -Token $ACCESS
Check "6. GET /me  valid token → 200" $r.Code 200
if ($r.Code -eq 200) {
    Write-Host "   email: $($r.Body.data.email)  role: $($r.Body.data.role)" -ForegroundColor DarkGray
}

# ── 7. GET /me with tampered token ────────────────────────────────────────────
$r = Req -Method GET -Url "$BASE/me" -Token ($ACCESS + "TAMPERED")
Check "7. GET /me  invalid token → 401" $r.Code 401

# ── 8. Refresh → new token pair ──────────────────────────────────────────────
$r = Req -Method POST -Url "$BASE/refresh" -Body @{ refreshToken=$REFRESH }
Check "8. Refresh valid token → 200" $r.Code 200
$NEW_ACCESS  = $r.Body.data.accessToken
$NEW_REFRESH = $r.Body.data.refreshToken
if ($NEW_ACCESS) { Write-Host "   new accessToken : $(Peek $NEW_ACCESS)" -ForegroundColor DarkGray }
Write-Host "   REFRESH == NEW_REFRESH? $($REFRESH -eq $NEW_REFRESH)" -ForegroundColor Magenta

# ── 9. Old refresh token is rejected (rotation) ───────────────────────────────
$r = Req -Method POST -Url "$BASE/refresh" -Body @{ refreshToken=$REFRESH }
Check "9. Old refresh reused → 401" $r.Code 401

# ── 10. New access token works on protected route ─────────────────────────────
$r = Req -Method GET -Url "$BASE/me" -Token $NEW_ACCESS
Check "10. New access token → 200" $r.Code 200

# ── 11. Logout ────────────────────────────────────────────────────────────────
$r = Req -Method POST -Url "$BASE/logout" -Token $NEW_ACCESS
Check "11. Logout → 200" $r.Code 200

# ── 12. New refresh token rejected after logout ───────────────────────────────
$r = Req -Method POST -Url "$BASE/refresh" -Body @{ refreshToken=$NEW_REFRESH }
Check "12. Refresh after logout → 401" $r.Code 401

Write-Host "`n=============================="  -ForegroundColor Yellow
Write-Host "  DONE" -ForegroundColor Yellow
Write-Host "==============================`n" -ForegroundColor Yellow
