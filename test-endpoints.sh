#!/usr/bin/env bash
# ============================================================
# test-endpoints.sh  —  ERP Backend · Fase 4 + Fase 5
# ============================================================
BASE="http://localhost:3001/api/v1"
PASS=0
FAIL=0

# ── helpers ─────────────────────────────────────────────────
check() {
  local desc="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  ✅ PASS  ($actual) $desc"
    ((PASS++))
  else
    echo "  ❌ FAIL  (expected=$expected actual=$actual) $desc"
    ((FAIL++))
  fi
}

status() {
  curl -s -o /dev/null -w "%{http_code}" "$@"
}

# ── 1. LOGIN — get tokens ────────────────────────────────────
echo ""
echo "=== SETUP: obtener tokens ==="
ADMIN_RESP=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"admin123"}')
ADMIN_TOKEN=$(echo "$ADMIN_RESP" | grep -oP '"accessToken":"\K[^"]+')
ADMIN_REFRESH=$(echo "$ADMIN_RESP" | grep -oP '"refreshToken":"\K[^"]+')

VEND_RESP=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"vendedor@empresa.com","password":"vendedor123"}')
VEND_TOKEN=$(echo "$VEND_RESP" | grep -oP '"accessToken":"\K[^"]+')

if [ -z "$ADMIN_TOKEN" ]; then echo "❌ No se pudo obtener token admin. ¿El servidor está corriendo?"; exit 1; fi
if [ -z "$VEND_TOKEN" ];  then echo "❌ No se pudo obtener token vendedor."; exit 1; fi
echo "  ✔ Token admin obtenido"
echo "  ✔ Token vendedor obtenido"

# ── 2. IDs dinámicos ─────────────────────────────────────────
echo ""
echo "=== SETUP: obtener IDs de empresa y local ==="
EMPRESAS_RESP=$(curl -s "$BASE/empresas" -H "Authorization: Bearer $ADMIN_TOKEN")
EMPRESA_ID=$(echo "$EMPRESAS_RESP" | grep -oP '"id":"\K[0-9a-f-]{36}' | head -1)

LOCALES_RESP=$(curl -s "$BASE/locales" -H "Authorization: Bearer $ADMIN_TOKEN")
LOCAL_ID=$(echo "$LOCALES_RESP" | grep -oP '"id":"\K[0-9a-f-]{36}' | head -1)

USUARIOS_RESP=$(curl -s "$BASE/usuarios" -H "Authorization: Bearer $ADMIN_TOKEN")
VENDEDOR_ID=$(echo "$USUARIOS_RESP" | grep -oP '"id":"\K[0-9a-f-]{36}' | tail -1)

if [ -z "$EMPRESA_ID" ]; then echo "❌ No se encontró empresa en DB."; exit 1; fi
if [ -z "$LOCAL_ID" ];   then echo "❌ No se encontró local en DB."; exit 1; fi
echo "  ✔ EMPRESA_ID=$EMPRESA_ID"
echo "  ✔ LOCAL_ID=$LOCAL_ID"
echo "  ✔ VENDEDOR_ID=$VENDEDOR_ID"

# ============================================================
echo ""
echo "=== [1/5] HEALTH ==="
check "GET /health → 200" "200" \
  "$(status "$BASE/health")"

# ============================================================
echo ""
echo "=== [2/5] AUTH — protección sin token ==="
check "GET /auth/profile sin token → 401" "401" \
  "$(status "$BASE/auth/profile")"

check "GET /usuarios sin token → 401" "401" \
  "$(status "$BASE/usuarios")"

check "GET /empresas sin token → 401" "401" \
  "$(status "$BASE/empresas")"

check "GET /locales sin token → 401" "401" \
  "$(status "$BASE/locales")"

# ============================================================
echo ""
echo "=== [3/5] AUTH — login, profile, refresh, logout ==="
check "POST /auth/login (admin) → 200" "200" \
  "$(status -X POST "$BASE/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@empresa.com","password":"admin123"}')"

check "POST /auth/login (vendedor) → 200" "200" \
  "$(status -X POST "$BASE/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"vendedor@empresa.com","password":"vendedor123"}')"

check "POST /auth/login (credenciales inválidas) → 401" "401" \
  "$(status -X POST "$BASE/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"nadie@empresa.com","password":"wrongpass"}')"

check "GET /auth/profile (admin) → 200" "200" \
  "$(status "$BASE/auth/profile" -H "Authorization: Bearer $ADMIN_TOKEN")"

check "POST /auth/refresh (admin refresh token) → 200" "200" \
  "$(status -X POST "$BASE/auth/refresh" \
     -H "Authorization: Bearer $ADMIN_REFRESH")"

check "POST /auth/logout (admin) → 200" "200" \
  "$(status -X POST "$BASE/auth/logout" \
     -H "Authorization: Bearer $ADMIN_TOKEN")"

# Re-login admin after logout
ADMIN_RESP2=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"admin123"}')
ADMIN_TOKEN=$(echo "$ADMIN_RESP2" | grep -oP '"accessToken":"\K[^"]+')

# ============================================================
echo ""
echo "=== [4/5] USUARIOS ==="
check "GET /usuarios (admin) → 200" "200" \
  "$(status "$BASE/usuarios" -H "Authorization: Bearer $ADMIN_TOKEN")"

check "GET /usuarios (vendedor) → 403" "403" \
  "$(status "$BASE/usuarios" -H "Authorization: Bearer $VEND_TOKEN")"

check "GET /usuarios/:id (admin) → 200" "200" \
  "$(status "$BASE/usuarios/$VENDEDOR_ID" \
     -H "Authorization: Bearer $ADMIN_TOKEN")"

check "GET /usuarios/:id (vendedor sobre otro usuario) → 403" "403" \
  "$(status "$BASE/usuarios/$VENDEDOR_ID" \
     -H "Authorization: Bearer $VEND_TOKEN")"

TS=$(date +%s)
NEW_USER_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/usuarios" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Test User\",\"email\":\"test_${TS}@empresa.com\",\"password\":\"test123\",\"rol\":\"Vendedor\",\"localId\":\"$LOCAL_ID\"}")
NEW_USER_ID=$(echo "$NEW_USER_RESP" | grep -oP '"id":"\K[0-9a-f-]{36}' | head -1)
NEW_USER_CODE=$(echo "$NEW_USER_RESP" | tail -1)
check "POST /usuarios (admin crea usuario) → 201" "201" "$NEW_USER_CODE"

check "POST /usuarios (vendedor) → 403" "403" \
  "$(status -X POST "$BASE/usuarios" \
     -H "Authorization: Bearer $VEND_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"nombre":"X","email":"x@x.com","password":"123456","rol":"Vendedor"}')"

if [ -n "$NEW_USER_ID" ]; then
  check "PATCH /usuarios/:id (admin actualiza) → 200" "200" \
    "$(status -X PATCH "$BASE/usuarios/$NEW_USER_ID" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"nombre":"Test User Actualizado"}')"

  check "PATCH /usuarios/:id/password (admin) → 200" "200" \
    "$(status -X PATCH "$BASE/usuarios/$NEW_USER_ID/password" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"currentPassword":"test123","newPassword":"nuevo123"}')"
else
  echo "  ⚠ SKIP  PATCH /usuarios (no se creó usuario de prueba)"
  echo "  ⚠ SKIP  PATCH /usuarios/:id/password"
fi

# ============================================================
echo ""
echo "=== [5a/5] EMPRESAS ==="
check "GET /empresas (admin) → 200" "200" \
  "$(status "$BASE/empresas" -H "Authorization: Bearer $ADMIN_TOKEN")"

check "GET /empresas (vendedor) → 200 (ve su empresa)" "200" \
  "$(status "$BASE/empresas" -H "Authorization: Bearer $VEND_TOKEN")"

check "GET /empresas/:id (admin) → 200" "200" \
  "$(status "$BASE/empresas/$EMPRESA_ID" \
     -H "Authorization: Bearer $ADMIN_TOKEN")"

check "GET /empresas/:id (vendedor, su empresa) → 200" "200" \
  "$(status "$BASE/empresas/$EMPRESA_ID" \
     -H "Authorization: Bearer $VEND_TOKEN")"

NEW_EMP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/empresas" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"TEST$(date +%s | tail -c 4)\",\"name\":\"Empresa Test\",\"taxId\":\"TEST$(date +%s | tail -c 8)\"}")
check "POST /empresas (admin crea empresa) → 201" "201" "$NEW_EMP_CODE"

check "POST /empresas (vendedor) → 403" "403" \
  "$(status -X POST "$BASE/empresas" \
     -H "Authorization: Bearer $VEND_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"code":"FAIL","name":"Fail","taxId":"FAIL999"}')"

check "PATCH /empresas/:id (admin) → 200" "200" \
  "$(status -X PATCH "$BASE/empresas/$EMPRESA_ID" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"city":"Buenos Aires"}')"

check "PATCH /empresas/:id (vendedor) → 403" "403" \
  "$(status -X PATCH "$BASE/empresas/$EMPRESA_ID" \
     -H "Authorization: Bearer $VEND_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"city":"Hack"}')"

# ============================================================
echo ""
echo "=== [5b/5] LOCALES ==="
check "GET /locales (admin) → 200" "200" \
  "$(status "$BASE/locales" -H "Authorization: Bearer $ADMIN_TOKEN")"

check "GET /locales (vendedor) → 200" "200" \
  "$(status "$BASE/locales" -H "Authorization: Bearer $VEND_TOKEN")"

check "GET /locales?search=MAIN (admin) → 200" "200" \
  "$(status "$BASE/locales?search=MAIN" -H "Authorization: Bearer $ADMIN_TOKEN")"

check "GET /locales/:id (admin) → 200" "200" \
  "$(status "$BASE/locales/$LOCAL_ID" \
     -H "Authorization: Bearer $ADMIN_TOKEN")"

check "GET /locales/:id (vendedor) → 200" "200" \
  "$(status "$BASE/locales/$LOCAL_ID" \
     -H "Authorization: Bearer $VEND_TOKEN")"

NEW_LOCAL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/locales" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"LOC$(date +%s | tail -c 4)\",\"name\":\"Local Test\",\"address\":\"Av. Corrientes 1234\"}")
check "POST /locales (admin crea local) → 201" "201" "$NEW_LOCAL_CODE"

check "POST /locales (vendedor) → 403" "403" \
  "$(status -X POST "$BASE/locales" \
     -H "Authorization: Bearer $VEND_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"code":"FAIL","name":"Fail"}')"

check "PATCH /locales/:id (admin) → 200" "200" \
  "$(status -X PATCH "$BASE/locales/$LOCAL_ID" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"city":"Rosario"}')"

check "PATCH /locales/:id (vendedor) → 403" "403" \
  "$(status -X PATCH "$BASE/locales/$LOCAL_ID" \
     -H "Authorization: Bearer $VEND_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"city":"Hack"}')"

# ============================================================
echo ""
echo "══════════════════════════════════════════════"
TOTAL=$((PASS + FAIL))
echo "  RESULTADO: $PASS/$TOTAL pruebas pasadas"
if [ "$FAIL" -eq 0 ]; then
  echo "  ✅ TODOS LOS TESTS PASARON"
else
  echo "  ❌ $FAIL TEST(S) FALLARON"
fi
echo "══════════════════════════════════════════════"
echo ""
exit "$FAIL"
