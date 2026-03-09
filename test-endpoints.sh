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
echo "=== [6a/6] CATEGORIAS ==="
check "GET /categorias sin token → 401" "401" \
  "$(status "$BASE/categorias")"

check "GET /categorias (admin) → 200" "200" \
  "$(status "$BASE/categorias" -H "Authorization: Bearer $ADMIN_TOKEN")"

CAT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/categorias" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Cat Test Fase6","description":"Categoría de prueba"}')
check "POST /categorias (admin) → 201" "201" "$CAT_CODE"

check "POST /categorias (vendedor) → 403" "403" \
  "$(status -X POST "$BASE/categorias" \
     -H "Authorization: Bearer $VEND_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Cat Fail"}')"

CAT_RESP=$(curl -s "$BASE/categorias" -H "Authorization: Bearer $ADMIN_TOKEN")
CAT_ID=$(echo "$CAT_RESP" | grep -oP '"id":"\K[0-9a-f-]{36}' | head -1)

if [ -n "$CAT_ID" ]; then
  check "PATCH /categorias/:id (admin) → 200" "200" \
    "$(status -X PATCH "$BASE/categorias/$CAT_ID" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"description":"Actualizada"}')"
else
  echo "  ⚠ SKIP  PATCH /categorias/:id"
fi

# ============================================================
echo ""
echo "=== [6b/6] DEPOSITOS ==="
check "GET /depositos (admin) → 200" "200" \
  "$(status "$BASE/depositos" -H "Authorization: Bearer $ADMIN_TOKEN")"

DEP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/depositos" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"localId\":\"$LOCAL_ID\",\"code\":\"DEP$(date +%s | tail -c 4)\",\"name\":\"Depósito Test\"}")
check "POST /depositos (admin) → 201" "201" "$DEP_CODE"

check "POST /depositos (vendedor) → 403" "403" \
  "$(status -X POST "$BASE/depositos" \
     -H "Authorization: Bearer $VEND_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"localId\":\"$LOCAL_ID\",\"code\":\"FAIL\",\"name\":\"Fail\"}")"

# ============================================================
echo ""
echo "=== [6c/6] PRODUCTOS ==="
check "GET /productos (admin) → 200" "200" \
  "$(status "$BASE/productos" -H "Authorization: Bearer $ADMIN_TOKEN")"

check "GET /productos (vendedor) → 200" "200" \
  "$(status "$BASE/productos" -H "Authorization: Bearer $VEND_TOKEN")"

TS2=$(date +%s)
PROD_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/productos" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"PROD-${TS2}\",\"name\":\"Producto Test\",\"tipo\":\"TERMINADO\",\"unit\":\"UNI\",\"cost\":500,\"price\":800,\"minStock\":10}")
PROD_ID=$(echo "$PROD_RESP" | grep -oP '"id":"\K[0-9a-f-]{36}' | head -1)
PROD_HTTP=$(echo "$PROD_RESP" | tail -1)
check "POST /productos (admin) → 201" "201" "$PROD_HTTP"

check "POST /productos (vendedor) → 403" "403" \
  "$(status -X POST "$BASE/productos" \
     -H "Authorization: Bearer $VEND_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"code":"FAIL","name":"Fail","tipo":"TERMINADO","unit":"UNI","cost":0,"price":0,"minStock":0}')"

check "POST /productos código duplicado → 409" "409" \
  "$(status -X POST "$BASE/productos" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"code\":\"PROD-${TS2}\",\"name\":\"Duplicado\",\"tipo\":\"TERMINADO\",\"unit\":\"UNI\",\"cost\":0,\"price\":0,\"minStock\":0}")"

if [ -n "$PROD_ID" ]; then
  check "GET /productos/:id (admin) → 200" "200" \
    "$(status "$BASE/productos/$PROD_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"

  check "PATCH /productos/:id (admin) → 200" "200" \
    "$(status -X PATCH "$BASE/productos/$PROD_ID" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"price":900}')"
else
  echo "  ⚠ SKIP  GET/PATCH /productos/:id"
fi

check "GET /productos?stockBajo=true (admin) → 200" "200" \
  "$(status "$BASE/productos?stockBajo=true" -H "Authorization: Bearer $ADMIN_TOKEN")"

# ============================================================
echo ""
echo "=== [6d/6] INVENTARIO / STOCK / MOVIMIENTOS ==="
check "GET /inventario/alertas (admin) → 200" "200" \
  "$(status "$BASE/inventario/alertas" -H "Authorization: Bearer $ADMIN_TOKEN")"

check "GET /inventario/stock/:localId (admin) → 200" "200" \
  "$(status "$BASE/inventario/stock/$LOCAL_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"

check "GET /movimientos-stock (admin) → 200" "200" \
  "$(status "$BASE/movimientos-stock" -H "Authorization: Bearer $ADMIN_TOKEN")"

if [ -n "$PROD_ID" ]; then
  # Ajuste positivo
  AJ_POS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/inventario/ajuste?localId=$LOCAL_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"productoId\":\"$PROD_ID\",\"tipo\":\"AJUSTE_POSITIVO\",\"cantidad\":50,\"observaciones\":\"Test ingreso\"}")
  check "POST /inventario/ajuste positivo → 201" "201" "$AJ_POS"

  # Ajuste negativo con stock insuficiente (cantidad > stock)
  AJ_NEG=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/inventario/ajuste?localId=$LOCAL_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"productoId\":\"$PROD_ID\",\"tipo\":\"AJUSTE_NEGATIVO\",\"cantidad\":9999,\"observaciones\":\"Test insuficiente\"}")
  check "POST /inventario/ajuste negativo insuficiente → 400" "400" "$AJ_NEG"

  check "GET /inventario/stock/producto/:id → 200" "200" \
    "$(status "$BASE/inventario/stock/producto/$PROD_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"

  check "GET /movimientos-stock/producto/:id → 200" "200" \
    "$(status "$BASE/movimientos-stock/producto/$PROD_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"
else
  echo "  ⚠ SKIP  tests de stock (no se creó producto de prueba)"
fi

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
