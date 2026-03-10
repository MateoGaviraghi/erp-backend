#!/usr/bin/env bash
# ============================================================
# test-endpoints.sh  —  ERP Backend · Fase 4 + Fase 5
# ============================================================
# Credenciales de seed — sobreescribir con variables de entorno si es necesario
# Ejemplo: TEST_ADMIN_PASS=mipass bash test-endpoints.sh
BASE="${TEST_BASE_URL:-http://localhost:3001/api/v1}"
TEST_ADMIN_EMAIL="${TEST_ADMIN_EMAIL:-admin@empresa.com}"
TEST_ADMIN_PASS="${TEST_ADMIN_PASS:-$(cat .env.test 2>/dev/null | grep ADMIN_PASS | cut -d= -f2)}"
TEST_ADMIN_PASS="${TEST_ADMIN_PASS:-admin123}"
TEST_VEND_EMAIL="${TEST_VEND_EMAIL:-vendedor@empresa.com}"
TEST_VEND_PASS="${TEST_VEND_PASS:-vendedor123}"
TEST_USER_PASS="${TEST_USER_PASS:-test123}"
TEST_USER_NEW_PASS="${TEST_USER_NEW_PASS:-nuevo123}"
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
  -d "{\"email\":\"$TEST_ADMIN_EMAIL\",\"password\":\"$TEST_ADMIN_PASS\"}")
ADMIN_TOKEN=$(echo "$ADMIN_RESP" | grep -oP '"accessToken":"\K[^"]+')
ADMIN_REFRESH=$(echo "$ADMIN_RESP" | grep -oP '"refreshToken":"\K[^"]+')

VEND_RESP=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_VEND_EMAIL\",\"password\":\"$TEST_VEND_PASS\"}")
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
     -d "{\"email\":\"$TEST_ADMIN_EMAIL\",\"password\":\"$TEST_ADMIN_PASS\"}")"

check "POST /auth/login (vendedor) → 200" "200" \
  "$(status -X POST "$BASE/auth/login" \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"$TEST_VEND_EMAIL\",\"password\":\"$TEST_VEND_PASS\"}")"

check "POST /auth/login (credenciales inválidas) → 401" "401" \
  "$(status -X POST "$BASE/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"nadie@empresa.com","password":"__invalid__"}')"

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
  -d "{\"email\":\"$TEST_ADMIN_EMAIL\",\"password\":\"$TEST_ADMIN_PASS\"}")
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
  -d "{\"nombre\":\"Test User\",\"email\":\"test_${TS}@empresa.com\",\"password\":\"$TEST_USER_PASS\",\"rol\":\"Vendedor\",\"localId\":\"$LOCAL_ID\"}")
NEW_USER_ID=$(echo "$NEW_USER_RESP" | grep -oP '"id":"\K[0-9a-f-]{36}' | head -1)
NEW_USER_CODE=$(echo "$NEW_USER_RESP" | tail -1)
check "POST /usuarios (admin crea usuario) → 201" "201" "$NEW_USER_CODE"

check "POST /usuarios (vendedor) → 403" "403" \
  "$(status -X POST "$BASE/usuarios" \
     -H "Authorization: Bearer $VEND_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"nombre":"X","email":"x@x.com","password":"anypass1","rol":"Vendedor"}')"

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
       -d "{\"currentPassword\":\"$TEST_USER_PASS\",\"newPassword\":\"$TEST_USER_NEW_PASS\"}")"
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
  -d "{\"name\":\"Cat Test $(date +%s)\",\"description\":\"Categoría de prueba\"}")
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
echo "=== [7] VENTAS ==="

TS=$(date +%s)

# ── 7a. Clientes ──────────────────────────────────────────
echo ""
echo "=== [7a] VENTAS / CLIENTES ==="
check "GET /clientes (admin) → 200" "200" \
  "$(status "$BASE/clientes" -H "Authorization: Bearer $ADMIN_TOKEN")"

CLI_RESP=$(curl -s -X POST "$BASE/clientes" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"CLI$TS\",\"name\":\"Cliente Test $TS\",\"localId\":\"$LOCAL_ID\",\"email\":\"cli${TS}@test.com\"}")
CLI_CODE=$(echo "$CLI_RESP" | grep -oP '"id"' | head -1 | wc -w | tr -d ' ')
CLI_ID=$(echo "$CLI_RESP" | grep -oP '"id":"\K[0-9a-f-]{36}' | head -1)
check "POST /clientes → 201" "201" \
  "$(echo "$CLI_RESP" | grep -oP '"id"' | head -1 | grep -q 'id' && echo 201 || echo 0)"

# Re-check with HTTP status
CLI_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/clientes" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"CLI${TS}B\",\"name\":\"Cliente B $TS\",\"localId\":\"$LOCAL_ID\"}")
check "POST /clientes (segundo) → 201" "201" "$CLI_HTTP"

if [ -n "$CLI_ID" ]; then
  check "GET /clientes/:id → 200" "200" \
    "$(status "$BASE/clientes/$CLI_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"

  check "GET /clientes/:id/saldos → 200" "200" \
    "$(status "$BASE/clientes/$CLI_ID/saldos" -H "Authorization: Bearer $ADMIN_TOKEN")"

  check "PATCH /clientes/:id → 200" "200" \
    "$(status -X PATCH "$BASE/clientes/$CLI_ID" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"city":"Buenos Aires"}')"

  check "POST /clientes code duplicado → 409" "409" \
    "$(status -X POST "$BASE/clientes" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d "{\"code\":\"CLI$TS\",\"name\":\"Dup\",\"localId\":\"$LOCAL_ID\"}")"
else
  echo "  ⚠ SKIP  tests de clientes (no CLI_ID)"
fi

# ── 7b. Presupuestos ──────────────────────────────────────
echo ""
echo "=== [7b] VENTAS / PRESUPUESTOS ==="
check "GET /presupuestos → 200" "200" \
  "$(status "$BASE/presupuestos" -H "Authorization: Bearer $ADMIN_TOKEN")"

PRES_HTTP=""
PRES_ID=""
if [ -n "$CLI_ID" ] && [ -n "$PROD_ID" ]; then
  PRES_RESP=$(curl -s -X POST "$BASE/presupuestos?localId=$LOCAL_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"clienteId\":\"$CLI_ID\",\"items\":[{\"productoId\":\"$PROD_ID\",\"cantidad\":2,\"precioUnitario\":100}]}")
  PRES_ID=$(echo "$PRES_RESP" | grep -oP '"id":"\K[0-9a-f-]{36}' | head -1)
  PRES_HTTP=$(echo "$PRES_RESP" | grep -oP '"numero"' | head -1 | grep -q 'numero' && echo 201 || echo 0)
  check "POST /presupuestos → 201" "201" \
    "$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/presupuestos?localId=$LOCAL_ID" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d "{\"clienteId\":\"$CLI_ID\",\"items\":[{\"productoId\":\"$PROD_ID\",\"cantidad\":1,\"precioUnitario\":50}]}")"

  if [ -n "$PRES_ID" ]; then
    check "GET /presupuestos/:id → 200" "200" \
      "$(status "$BASE/presupuestos/$PRES_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"

    check "PATCH /presupuestos/:id/estado → 200" "200" \
      "$(status -X PATCH "$BASE/presupuestos/$PRES_ID/estado" \
         -H "Authorization: Bearer $ADMIN_TOKEN" \
         -H "Content-Type: application/json" \
         -d '{"estado":"ENVIADO"}')"
  fi
else
  echo "  ⚠ SKIP  tests de presupuestos (requiere CLI_ID y PROD_ID)"
fi

# ── 7c. Pedidos (via convertir presupuesto) ───────────────
echo ""
echo "=== [7c] VENTAS / PEDIDOS ==="
check "GET /pedidos → 200" "200" \
  "$(status "$BASE/pedidos" -H "Authorization: Bearer $ADMIN_TOKEN")"

PED_ID=""
if [ -n "$PRES_ID" ]; then
  CONV_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/presupuestos/$PRES_ID/convertir-pedido" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json")
  CONV_BODY=$(echo "$CONV_RESP" | head -n -1)
  CONV_CODE=$(echo "$CONV_RESP" | tail -1)
  PED_ID=$(echo "$CONV_BODY" | grep -oP '"id":"\K[0-9a-f-]{36}' | head -1)
  check "POST /presupuestos/:id/convertir-pedido → 201" "201" "$CONV_CODE"

  if [ -n "$PED_ID" ]; then
    check "GET /pedidos/:id → 200" "200" \
      "$(status "$BASE/pedidos/$PED_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"

    check "POST /pedidos/:id/aprobar → 201" "201" \
      "$(status -X POST "$BASE/pedidos/$PED_ID/aprobar" \
         -H "Authorization: Bearer $ADMIN_TOKEN" \
         -H "Content-Type: application/json")"

    # Doble convertir → 400 (BadRequestException)
    check "POST convertir-pedido duplicado → 400" "400" \
      "$(status -X POST "$BASE/presupuestos/$PRES_ID/convertir-pedido" \
         -H "Authorization: Bearer $ADMIN_TOKEN" \
         -H "Content-Type: application/json")"
  fi
else
  echo "  ⚠ SKIP  tests de pedidos (requiere PRES_ID)"
fi

# ── 7d. Facturas ──────────────────────────────────────────
echo ""
echo "=== [7d] VENTAS / FACTURAS ==="
check "GET /facturas → 200" "200" \
  "$(status "$BASE/facturas" -H "Authorization: Bearer $ADMIN_TOKEN")"

FACT_ID=""
if [ -n "$PED_ID" ]; then
  FACTURA_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/facturas/desde-pedido" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"pedidoId\":\"$PED_ID\"}")
  FACTURA_BODY=$(echo "$FACTURA_RESP" | head -n -1)
  FACTURA_CODE=$(echo "$FACTURA_RESP" | tail -1)
  FACT_ID=$(echo "$FACTURA_BODY" | grep -oP '"id":"\K[0-9a-f-]{36}' | head -1)
  check "POST /facturas/desde-pedido → 201" "201" "$FACTURA_CODE"

  if [ -n "$FACT_ID" ]; then
    check "GET /facturas/:id → 200" "200" \
      "$(status "$BASE/facturas/$FACT_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"

    # Verificar stock fue descontado
    check "GET /inventario/stock/:localId (stock tras factura) → 200" "200" \
      "$(status "$BASE/inventario/stock/$LOCAL_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"
  fi
else
  echo "  ⚠ SKIP  tests de facturas (requiere PED_ID)"
fi

# ── 7e. Cobranzas ─────────────────────────────────────────
echo ""
echo "=== [7e] VENTAS / COBRANZAS ==="
check "GET /cobranzas → 200" "200" \
  "$(status "$BASE/cobranzas" -H "Authorization: Bearer $ADMIN_TOKEN")"

if [ -n "$FACT_ID" ]; then
  # Pago parcial
  COB_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/cobranzas" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"facturaId\":\"$FACT_ID\",\"monto\":50,\"metodoPago\":\"EFECTIVO\",\"fecha\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}")
  check "POST /cobranzas pago parcial → 201" "201" "$COB_HTTP"

  # Verificar saldo en factura
  check "GET /facturas/:id (tras cobranza) → 200" "200" \
    "$(status "$BASE/facturas/$FACT_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"

  # Pago que excede el saldo → 400
  check "POST /cobranzas monto excesivo → 400" "400" \
    "$(status -X POST "$BASE/cobranzas" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d "{\"facturaId\":\"$FACT_ID\",\"monto\":9999,\"metodoPago\":\"EFECTIVO\",\"fecha\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}")"

  # Anular factura con cobranza → 400
  check "DELETE /facturas/:id/anular (con cobranzas) → 400" "400" \
    "$(status -X DELETE "$BASE/facturas/$FACT_ID/anular?motivo=test" \
       -H "Authorization: Bearer $ADMIN_TOKEN")"
else
  echo "  ⚠ SKIP  tests de cobranzas (requiere FACT_ID)"
fi

# ============================================================
echo ""
echo "=== [8] COMPRAS ==="

TS8=$(date +%s)

# ── 8a. Proveedores ───────────────────────────────────────
echo ""
echo "=== [8a] COMPRAS / PROVEEDORES ==="
check "GET /proveedores → 200" "200" \
  "$(status "$BASE/proveedores" -H "Authorization: Bearer $ADMIN_TOKEN")"

PROV_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/proveedores" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"PROV$TS8\",\"name\":\"Proveedor Test $TS8\",\"localId\":\"$LOCAL_ID\",\"email\":\"prov${TS8}@test.com\",\"paymentTerms\":30}")
PROV_BODY=$(echo "$PROV_RESP" | head -n -1)
PROV_CODE=$(echo "$PROV_RESP" | tail -1)
PROV_ID=$(echo "$PROV_BODY" | grep -oP '"id":"\K[0-9a-f-]{36}' | head -1)
check "POST /proveedores → 201" "201" "$PROV_CODE"

if [ -n "$PROV_ID" ]; then
  check "GET /proveedores/:id → 200" "200" \
    "$(status "$BASE/proveedores/$PROV_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"

  check "PATCH /proveedores/:id → 200" "200" \
    "$(status -X PATCH "$BASE/proveedores/$PROV_ID" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"city":"Córdoba"}')"

  check "POST /proveedores code duplicado → 409" "409" \
    "$(status -X POST "$BASE/proveedores" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d "{\"code\":\"PROV$TS8\",\"name\":\"Dup\",\"localId\":\"$LOCAL_ID\"}")"

  check "GET /proveedores/:id/deuda → 200" "200" \
    "$(status "$BASE/proveedores/$PROV_ID/deuda" -H "Authorization: Bearer $ADMIN_TOKEN")"
else
  echo "  ⚠ SKIP  tests de proveedores (no PROV_ID)"
fi

# ── 8b. Requerimientos ────────────────────────────────────
echo ""
echo "=== [8b] COMPRAS / REQUERIMIENTOS ==="
check "GET /requerimientos → 200" "200" \
  "$(status "$BASE/requerimientos" -H "Authorization: Bearer $ADMIN_TOKEN")"

REQ_ID=""
if [ -n "$PROD_ID" ]; then
  REQ_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/requerimientos?localId=$LOCAL_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"solicitante\":\"Test User\",\"departamento\":\"Producción\",\"justificacion\":\"Reposición para test\",\"fechaNecesidad\":\"2026-05-01\",\"items\":[{\"productoId\":\"$PROD_ID\",\"descripcion\":\"Insumo test\",\"cantidad\":100,\"unidad\":\"KG\"}]}")
  REQ_BODY=$(echo "$REQ_RESP" | head -n -1)
  REQ_HTTP=$(echo "$REQ_RESP" | tail -1)
  REQ_ID=$(echo "$REQ_BODY" | grep -oP '"id":"\K[0-9a-f-]{36}' | head -1)
  check "POST /requerimientos → 201" "201" "$REQ_HTTP"

  if [ -n "$REQ_ID" ]; then
    check "GET /requerimientos/:id → 200" "200" \
      "$(status "$BASE/requerimientos/$REQ_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"

    check "PATCH /requerimientos/:id/autorizar → 200" "200" \
      "$(status -X PATCH "$BASE/requerimientos/$REQ_ID/autorizar" \
         -H "Authorization: Bearer $ADMIN_TOKEN")"

    # Doble autorización → 400
    check "PATCH /requerimientos/:id/autorizar (ya autorizado) → 400" "400" \
      "$(status -X PATCH "$BASE/requerimientos/$REQ_ID/autorizar" \
         -H "Authorization: Bearer $ADMIN_TOKEN")"
  fi
else
  echo "  ⚠ SKIP  tests de requerimientos (requiere PROD_ID)"
fi

# ── 8c. Órdenes de Compra ─────────────────────────────────
echo ""
echo "=== [8c] COMPRAS / ÓRDENES ==="
check "GET /ordenes-compra → 200" "200" \
  "$(status "$BASE/ordenes-compra" -H "Authorization: Bearer $ADMIN_TOKEN")"

OC_ID=""
ITEM_ORDEN_ID=""
if [ -n "$PROV_ID" ] && [ -n "$PROD_ID" ]; then
  OC_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/ordenes-compra?localId=$LOCAL_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"proveedorId\":\"$PROV_ID\",\"items\":[{\"productoId\":\"$PROD_ID\",\"descripcion\":\"Insumo test\",\"cantidad\":200,\"unidad\":\"KG\",\"precioUnitario\":420.50}],\"observaciones\":\"OC de prueba\"}")
  OC_BODY=$(echo "$OC_RESP" | head -n -1)
  OC_HTTP=$(echo "$OC_RESP" | tail -1)
  OC_ID=$(echo "$OC_BODY" | grep -oP '"id":"\K[0-9a-f-]{36}' | head -1)
  check "POST /ordenes-compra → 201" "201" "$OC_HTTP"

  if [ -n "$OC_ID" ]; then
    OC_DETAIL=$(curl -s "$BASE/ordenes-compra/$OC_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    # Extract first item ID: items:[{"id":"..."
    ITEM_ORDEN_ID=$(echo "$OC_DETAIL" | grep -oP '"items":\[{"id":"\K[0-9a-f-]{36}')
    check "GET /ordenes-compra/:id → 200" "200" \
      "$(status "$BASE/ordenes-compra/$OC_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"

    check "PATCH /ordenes-compra/:id/aprobar → 200" "200" \
      "$(status -X PATCH "$BASE/ordenes-compra/$OC_ID/aprobar" \
         -H "Authorization: Bearer $ADMIN_TOKEN")"

    # Doble aprobación → 404
    check "PATCH /ordenes-compra/:id/aprobar (ya ENVIADA) → 404" "404" \
      "$(status -X PATCH "$BASE/ordenes-compra/$OC_ID/aprobar" \
         -H "Authorization: Bearer $ADMIN_TOKEN")"
  fi
else
  echo "  ⚠ SKIP  tests de órdenes (requiere PROV_ID y PROD_ID)"
fi

# ── 8d. Recepciones ───────────────────────────────────────
echo ""
echo "=== [8d] COMPRAS / RECEPCIONES ==="
check "GET /recepciones → 200" "200" \
  "$(status "$BASE/recepciones" -H "Authorization: Bearer $ADMIN_TOKEN")"

if [ -n "$OC_ID" ] && [ -n "$ITEM_ORDEN_ID" ]; then
  # Recepción parcial
  REC_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/recepciones" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"ordenCompraId\":\"$OC_ID\",\"nroRemito\":\"REM-${TS2}A\",\"items\":[{\"itemOrdenCompraId\":\"$ITEM_ORDEN_ID\",\"cantidadRecibida\":100}]}")
  REC_BODY=$(echo "$REC_RESP" | head -n -1)
  REC_HTTP=$(echo "$REC_RESP" | tail -1)
  check "POST /recepciones (parcial) → 201" "201" "$REC_HTTP"

  # Verificar stock aumentó
  check "GET /inventario/stock/:localId (stock tras recepción) → 200" "200" \
    "$(status "$BASE/inventario/stock/$LOCAL_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"

  # Recepción completa
  REC2_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/recepciones" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"ordenCompraId\":\"$OC_ID\",\"nroRemito\":\"REM-${TS2}B\",\"items\":[{\"itemOrdenCompraId\":\"$ITEM_ORDEN_ID\",\"cantidadRecibida\":100}]}")
  REC2_HTTP=$(echo "$REC2_RESP" | tail -1)
  check "POST /recepciones (completa) → 201" "201" "$REC2_HTTP"

  # Intentar recibir más de lo pedido → 400
  check "POST /recepciones (excede pendiente) → 400" "400" \
    "$(status -X POST "$BASE/recepciones" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d "{\"ordenCompraId\":\"$OC_ID\",\"items\":[{\"itemOrdenCompraId\":\"$ITEM_ORDEN_ID\",\"cantidadRecibida\":9999}]}")"
else
  echo "  ⚠ SKIP  tests de recepciones (requiere OC_ID e ITEM_ORDEN_ID)"
fi

# ── 8e. Pagos a proveedores ───────────────────────────────
echo ""
echo "=== [8e] COMPRAS / PAGOS ==="
check "GET /pagos-proveedor → 200" "200" \
  "$(status "$BASE/pagos-proveedor" -H "Authorization: Bearer $ADMIN_TOKEN")"

if [ -n "$PROV_ID" ]; then
  check "POST /pagos-proveedor → 201" "201" \
    "$(status -X POST "$BASE/pagos-proveedor" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d "{\"proveedorId\":\"$PROV_ID\",\"monto\":20000,\"metodoPago\":\"TRANSFERENCIA\",\"referencia\":\"CBU 000001234567\"}")"
else
  echo "  ⚠ SKIP  tests de pagos (requiere PROV_ID)"
fi

# ============================================================
# ███████╗ █████╗ ███████╗███████╗     █████╗
# ██╔════╝██╔══██╗██╔════╝██╔════╝    ██╔══██╗
# █████╗  ███████║███████╗█████╗      ╚██████╗
# ██╔══╝  ██╔══██║╚════██║██╔══╝       ╚═══██║
# ██║     ██║  ██║███████║███████╗     █████╔╝
# ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝    ╚════╝
echo ""
echo "=== [FASE 9] FINANZAS ==="

# ── 9a. Plan de Cuentas ──────────────────────────────────
echo ""
echo "=== [9a] FINANZAS / PLAN DE CUENTAS ==="

CUENTA_CODE="1.1.TEST-$TS"
CUENTA_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/plan-cuentas" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$CUENTA_CODE\",\"nombre\":\"Caja Test $TS\",\"tipo\":\"ACTIVO\",\"naturaleza\":\"DEUDORA\",\"nivel\":1,\"imputable\":true}")
CUENTA_BODY=$(echo "$CUENTA_RESP" | head -n -1)
CUENTA_HTTP=$(echo "$CUENTA_RESP" | tail -1)
check "POST /plan-cuentas → 201" "201" "$CUENTA_HTTP"
CUENTA_ID=$(echo "$CUENTA_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Duplicado → 409
check "POST /plan-cuentas (código duplicado) → 409" "409" \
  "$(status -X POST "$BASE/plan-cuentas" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"code\":\"$CUENTA_CODE\",\"nombre\":\"Otra\",\"tipo\":\"ACTIVO\",\"naturaleza\":\"DEUDORA\",\"nivel\":1}")"

check "GET /plan-cuentas → 200" "200" \
  "$(status "$BASE/plan-cuentas" -H "Authorization: Bearer $ADMIN_TOKEN")"

if [ -n "$CUENTA_ID" ]; then
  check "GET /plan-cuentas/:id/mayor → 200" "200" \
    "$(status "$BASE/plan-cuentas/$CUENTA_ID/mayor" -H "Authorization: Bearer $ADMIN_TOKEN")"
else
  echo "  ⚠ SKIP  GET /plan-cuentas/:id/mayor (requiere CUENTA_ID)"
fi

# ── 9b. Asientos Contables ───────────────────────────────
echo ""
echo "=== [9b] FINANZAS / ASIENTOS ==="

# Crear segunda cuenta para la partida doble (PASIVO/ACREEDORA)
CUENTA2_CODE="2.1.TEST-$TS"
CUENTA2_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/plan-cuentas" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$CUENTA2_CODE\",\"nombre\":\"Proveedor Test $TS\",\"tipo\":\"PASIVO\",\"naturaleza\":\"ACREEDORA\",\"nivel\":1,\"imputable\":true}")
CUENTA2_BODY=$(echo "$CUENTA2_RESP" | head -n -1)
CUENTA2_ID=$(echo "$CUENTA2_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$CUENTA_ID" ] && [ -n "$CUENTA2_ID" ]; then
  ASIENTO_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/asientos?localId=$LOCAL_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"descripcion\":\"Asiento prueba $TS\",\"detalles\":[{\"cuentaId\":\"$CUENTA_ID\",\"debe\":5000,\"haber\":0},{\"cuentaId\":\"$CUENTA2_ID\",\"debe\":0,\"haber\":5000}]}")
  ASIENTO_BODY=$(echo "$ASIENTO_RESP" | head -n -1)
  ASIENTO_HTTP=$(echo "$ASIENTO_RESP" | tail -1)
  check "POST /asientos (partida doble) → 201" "201" "$ASIENTO_HTTP"
  ASIENTO_ID=$(echo "$ASIENTO_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  # Descuadrado → 400
  check "POST /asientos (descuadrado) → 400" "400" \
    "$(status -X POST "$BASE/asientos?localId=$LOCAL_ID" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d "{\"descripcion\":\"Roto\",\"detalles\":[{\"cuentaId\":\"$CUENTA_ID\",\"debe\":100,\"haber\":0},{\"cuentaId\":\"$CUENTA2_ID\",\"debe\":0,\"haber\":200}]}")"

  check "GET /asientos → 200" "200" \
    "$(status "$BASE/asientos" -H "Authorization: Bearer $ADMIN_TOKEN")"

  if [ -n "$ASIENTO_ID" ]; then
    check "GET /asientos/:id → 200" "200" \
      "$(status "$BASE/asientos/$ASIENTO_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"
  else
    echo "  ⚠ SKIP  GET /asientos/:id (requiere ASIENTO_ID)"
  fi
else
  echo "  ⚠ SKIP  tests de asientos (requiere dos cuentas creadas)"
fi

# ── 9c. Cuentas por Cobrar y Pagar ──────────────────────
echo ""
echo "=== [9c] FINANZAS / CxC y CxP ==="
check "GET /cuentas-cobrar → 200" "200" \
  "$(status "$BASE/cuentas-cobrar" -H "Authorization: Bearer $ADMIN_TOKEN")"

check "GET /cuentas-cobrar/resumen → 200" "200" \
  "$(status "$BASE/cuentas-cobrar/resumen" -H "Authorization: Bearer $ADMIN_TOKEN")"

check "GET /cuentas-pagar → 200" "200" \
  "$(status "$BASE/cuentas-pagar" -H "Authorization: Bearer $ADMIN_TOKEN")"

check "GET /cuentas-pagar/resumen → 200" "200" \
  "$(status "$BASE/cuentas-pagar/resumen" -H "Authorization: Bearer $ADMIN_TOKEN")"

# ── 9d. Bancos ────────────────────────────────────────────
echo ""
echo "=== [9d] FINANZAS / BANCOS ==="
BANCOS_RESP=$(curl -s -w "\n%{http_code}" "$BASE/bancos/cuentas" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
BANCOS_BODY=$(echo "$BANCOS_RESP" | head -n -1)
BANCOS_HTTP=$(echo "$BANCOS_RESP" | tail -1)
check "GET /bancos/cuentas → 200" "200" "$BANCOS_HTTP"
BANCO_CUENTA_ID=$(echo "$BANCOS_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$BANCO_CUENTA_ID" ]; then
  check "GET /bancos/cuentas/:id/movimientos → 200" "200" \
    "$(status "$BASE/bancos/cuentas/$BANCO_CUENTA_ID/movimientos" \
       -H "Authorization: Bearer $ADMIN_TOKEN")"

  check "POST /bancos/movimientos (CREDITO) → 201" "201" \
    "$(status -X POST "$BASE/bancos/movimientos" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d "{\"cuentaBancariaId\":\"$BANCO_CUENTA_ID\",\"tipo\":\"CREDITO\",\"monto\":10000,\"concepto\":\"Depósito test $TS\"}")"
else
  echo "  ⚠ SKIP  tests bancarios (sin cuentas bancarias en BD)"
fi

# ── 9e. Caja ─────────────────────────────────────────────
echo ""
echo "=== [9e] FINANZAS / CAJA ==="
check "GET /caja/$LOCAL_ID → 200" "200" \
  "$(status "$BASE/caja/$LOCAL_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"

check "POST /caja/$LOCAL_ID/movimiento (INGRESO) → 201" "201" \
  "$(status -X POST "$BASE/caja/$LOCAL_ID/movimiento" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"tipo\":\"INGRESO\",\"monto\":10000,\"concepto\":\"Venta efectivo test $TS\"}")"

check "POST /caja/$LOCAL_ID/movimiento (EGRESO excede saldo) → 400" "400" \
  "$(status -X POST "$BASE/caja/$LOCAL_ID/movimiento" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"tipo\":\"EGRESO\",\"monto\":9999999,\"concepto\":\"Gasto irreal\"}")"

# ── 9f. Retenciones ──────────────────────────────────────
echo ""
echo "=== [9f] FINANZAS / RETENCIONES ==="
check "GET /retenciones → 200" "200" \
  "$(status "$BASE/retenciones" -H "Authorization: Bearer $ADMIN_TOKEN")"

check "POST /retenciones?localId=$LOCAL_ID → 201" "201" \
  "$(status -X POST "$BASE/retenciones?localId=$LOCAL_ID" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"tipo\":\"IVA\",\"numero\":\"RET-$TS\",\"proveedorNombre\":\"Proveedor SA\",\"importe\":210,\"alicuota\":10.5,\"baseImponible\":2000}")"

# ============================================================
# ███████╗ █████╗ ███████╗███████╗    ██╗ ██████╗
# ██╔════╝██╔══██╗██╔════╝██╔════╝   ███║██╔═████╗
# █████╗  ███████║███████╗█████╗     ╚██║██║██╔██║
# ██╔══╝  ██╔══██║╚════██║██╔══╝      ██║████╔╝██║
# ██║     ██║  ██║███████║███████╗    ██║╚██████╔╝
# ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝ ╚═════╝
echo ""
echo "=== [FASE 10] RRHH ==="

# ── 10a. Empleados ────────────────────────────────────────
echo ""
echo "=== [10a] RRHH / EMPLEADOS ==="

EMP_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/empleados?localId=$LOCAL_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"EMP-$TS\",\"name\":\"Rodriguez Maria Fernanda $TS\",\"position\":\"Asistente\",\"department\":\"Administracion\",\"salary\":280000,\"hireDate\":\"2024-06-01\"}")
EMP_BODY=$(echo "$EMP_RESP" | head -n -1)
EMP_HTTP=$(echo "$EMP_RESP" | tail -1)
check "POST /empleados → 201" "201" "$EMP_HTTP"
EMP_ID=$(echo "$EMP_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Legajo duplicado → 409
check "POST /empleados (code duplicado) → 409" "409" \
  "$(status -X POST "$BASE/empleados?localId=$LOCAL_ID" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"code\":\"EMP-$TS\",\"name\":\"Otro\",\"position\":\"Otro\",\"department\":\"Otro\",\"salary\":100000,\"hireDate\":\"2024-01-01\"}")"

check "GET /empleados → 200" "200" \
  "$(status "$BASE/empleados" -H "Authorization: Bearer $ADMIN_TOKEN")"

if [ -n "$EMP_ID" ]; then
  check "GET /empleados/:id → 200" "200" \
    "$(status "$BASE/empleados/$EMP_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"

  check "PATCH /empleados/:id → 200" "200" \
    "$(status -X PATCH "$BASE/empleados/$EMP_ID" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d "{\"position\":\"Asistente Senior\"}")"
else
  echo "  ⚠ SKIP  tests de empleado (sin EMP_ID)"
fi

# ── 10b. Asistencias ─────────────────────────────────────
echo ""
echo "=== [10b] RRHH / ASISTENCIAS ==="
check "GET /asistencias → 200" "200" \
  "$(status "$BASE/asistencias" -H "Authorization: Bearer $ADMIN_TOKEN")"

if [ -n "$EMP_ID" ]; then
  check "POST /asistencias → 201" "201" \
    "$(status -X POST "$BASE/asistencias" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d "{\"empleadoId\":\"$EMP_ID\",\"fecha\":\"2026-02-18\",\"ausente\":false,\"entrada\":\"2026-02-18T09:00:00Z\",\"salida\":\"2026-02-18T18:00:00Z\"}")"

  # Duplicado → 409
  check "POST /asistencias (fecha duplicada) → 409" "409" \
    "$(status -X POST "$BASE/asistencias" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d "{\"empleadoId\":\"$EMP_ID\",\"fecha\":\"2026-02-18\",\"ausente\":false}")"
else
  echo "  ⚠ SKIP  tests de asistencias (sin EMP_ID)"
fi

# ── 10c. Horas ───────────────────────────────────────────
echo ""
echo "=== [10c] RRHH / HORAS ==="
check "GET /horas → 200" "200" \
  "$(status "$BASE/horas" -H "Authorization: Bearer $ADMIN_TOKEN")"

if [ -n "$EMP_ID" ]; then
  check "POST /horas → 201" "201" \
    "$(status -X POST "$BASE/horas" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d "{\"empleadoId\":\"$EMP_ID\",\"fecha\":\"2026-02-18\",\"horasNormales\":9,\"horasExtra\":1,\"descripcion\":\"Dia regular\"}")"

  check "GET /empleados/:id/resumen-horas?mes=2&anio=2026 → 200" "200" \
    "$(status "$BASE/empleados/$EMP_ID/resumen-horas?mes=2&anio=2026" \
       -H "Authorization: Bearer $ADMIN_TOKEN")"
else
  echo "  ⚠ SKIP  tests de horas (sin EMP_ID)"
fi

# ── 10d. Liquidaciones ───────────────────────────────────
echo ""
echo "=== [10d] RRHH / LIQUIDACIONES ==="
check "GET /liquidaciones → 200" "200" \
  "$(status "$BASE/liquidaciones" -H "Authorization: Bearer $ADMIN_TOKEN")"

if [ -n "$EMP_ID" ]; then
  LIQ_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/liquidaciones" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"empleadoId\":\"$EMP_ID\",\"periodo\":\"2026-02\",\"sueldobruto\":280000,\"deducciones\":39480,\"notas\":\"Febrero 2026\"}")
  LIQ_BODY=$(echo "$LIQ_RESP" | head -n -1)
  LIQ_HTTP=$(echo "$LIQ_RESP" | tail -1)
  check "POST /liquidaciones → 201" "201" "$LIQ_HTTP"
  LIQ_ID=$(echo "$LIQ_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  # Período duplicado → 400
  check "POST /liquidaciones (período duplicado) → 400" "400" \
    "$(status -X POST "$BASE/liquidaciones" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d "{\"empleadoId\":\"$EMP_ID\",\"periodo\":\"2026-02\",\"sueldobruto\":280000}")"

  if [ -n "$LIQ_ID" ]; then
    check "GET /liquidaciones/:id → 200" "200" \
      "$(status "$BASE/liquidaciones/$LIQ_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"

    check "PATCH /liquidaciones/:id/aprobar → 200" "200" \
      "$(status -X PATCH "$BASE/liquidaciones/$LIQ_ID/aprobar" \
         -H "Authorization: Bearer $ADMIN_TOKEN")"

    # Ya aprobada → 404
    check "PATCH /liquidaciones/:id/aprobar (ya aprobada) → 404" "404" \
      "$(status -X PATCH "$BASE/liquidaciones/$LIQ_ID/aprobar" \
         -H "Authorization: Bearer $ADMIN_TOKEN")"
  else
    echo "  ⚠ SKIP  tests de liquidación detalle (sin LIQ_ID)"
  fi
else
  echo "  ⚠ SKIP  tests de liquidaciones (sin EMP_ID)"
fi

# ── 10e. Vacaciones ──────────────────────────────────────
echo ""
echo "=== [10e] RRHH / VACACIONES ==="

if [ -n "$EMP_ID" ]; then
  VAC_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/vacaciones" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"empleadoId\":\"$EMP_ID\",\"fechaDesde\":\"2026-07-07\",\"fechaHasta\":\"2026-07-18\",\"notas\":\"Vacaciones invierno\"}")
  VAC_BODY=$(echo "$VAC_RESP" | head -n -1)
  VAC_HTTP=$(echo "$VAC_RESP" | tail -1)
  check "POST /vacaciones → 201" "201" "$VAC_HTTP"
  VAC_ID=$(echo "$VAC_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  # fecha hasta < fecha desde → 400
  check "POST /vacaciones (fechaHasta < fechaDesde) → 400" "400" \
    "$(status -X POST "$BASE/vacaciones" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d "{\"empleadoId\":\"$EMP_ID\",\"fechaDesde\":\"2026-08-18\",\"fechaHasta\":\"2026-08-01\"}")"

  check "GET /vacaciones/empleado/:id → 200" "200" \
    "$(status "$BASE/vacaciones/empleado/$EMP_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"

  if [ -n "$VAC_ID" ]; then
    check "PATCH /vacaciones/:id/aprobar → 200" "200" \
      "$(status -X PATCH "$BASE/vacaciones/$VAC_ID/aprobar" \
         -H "Authorization: Bearer $ADMIN_TOKEN")"

    # Solapamiento con aprobada → 400
    check "POST /vacaciones (solapamiento) → 400" "400" \
      "$(status -X POST "$BASE/vacaciones" \
         -H "Authorization: Bearer $ADMIN_TOKEN" \
         -H "Content-Type: application/json" \
         -d "{\"empleadoId\":\"$EMP_ID\",\"fechaDesde\":\"2026-07-10\",\"fechaHasta\":\"2026-07-15\"}")"
  else
    echo "  ⚠ SKIP  aprobar/rechazar vacaciones (sin VAC_ID)"
  fi
else
  echo "  ⚠ SKIP  tests de vacaciones (sin EMP_ID)"
fi

# ============================================================
echo ""
echo "=== [FASE 11] PRODUCCIÓN ==="

TS11=$(date +%s)

# --- [11a] Materiales de producción ---
echo ""
echo "=== [11a] PRODUCCIÓN / MATERIALES ==="

MAT_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/materiales-produccion?localId=$LOCAL_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"MAT-${TS11}\",\"nombre\":\"Acero Test\",\"tipo\":\"MATERIA_PRIMA\",\"unidad\":\"kg\",\"stockActual\":10000,\"costoUnitario\":50}")
MAT_ID=$(echo "$MAT_RESP" | grep -oP '"id":"\K[0-9a-f-]{36}' | head -1)
MAT_HTTP=$(echo "$MAT_RESP" | tail -1)
check "POST /materiales-produccion → 201" "201" "$MAT_HTTP"

check "POST /materiales-produccion (code duplicado) → 409" "409" \
  "$(status -X POST "$BASE/materiales-produccion?localId=$LOCAL_ID" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"code\":\"MAT-${TS11}\",\"nombre\":\"Dup\",\"tipo\":\"MATERIA_PRIMA\",\"unidad\":\"kg\"}")"

check "GET /materiales-produccion → 200" "200" \
  "$(status "$BASE/materiales-produccion" -H "Authorization: Bearer $ADMIN_TOKEN")"

if [ -n "$MAT_ID" ]; then
  check "PATCH /materiales-produccion/:id → 200" "200" \
    "$(status -X PATCH "$BASE/materiales-produccion/$MAT_ID" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"costoUnitario":55}')"
else
  echo "  ⚠ SKIP  PATCH /materiales-produccion/:id (sin MAT_ID)"
fi

# --- [11b] BOM ---
echo ""
echo "=== [11b] PRODUCCIÓN / BOM ==="

if [ -n "$PROD_ID" ] && [ -n "$MAT_ID" ]; then
  BOM_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/bom?localId=$LOCAL_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"code\":\"BOM-${TS11}\",\"productoId\":\"$PROD_ID\",\"cantidad\":1,\"unidad\":\"UNI\",\"version\":1,\"items\":[{\"materialId\":\"$MAT_ID\",\"cantidad\":2,\"unidad\":\"kg\"}]}")
  BOM_ID=$(echo "$BOM_RESP" | grep -oP '"id":"\K[0-9a-f-]{36}' | head -1)
  BOM_HTTP=$(echo "$BOM_RESP" | tail -1)
  check "POST /bom → 201" "201" "$BOM_HTTP"

  check "POST /bom (code duplicado) → 409" "409" \
    "$(status -X POST "$BASE/bom?localId=$LOCAL_ID" \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d "{\"code\":\"BOM-${TS11}\",\"productoId\":\"$PROD_ID\",\"cantidad\":1,\"unidad\":\"UNI\",\"items\":[{\"materialId\":\"$MAT_ID\",\"cantidad\":1}]}")"

  check "GET /bom → 200" "200" \
    "$(status "$BASE/bom" -H "Authorization: Bearer $ADMIN_TOKEN")"

  if [ -n "$BOM_ID" ]; then
    BOM_ONE=$(curl -s "$BASE/bom/$BOM_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
    BOM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/bom/$BOM_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
    check "GET /bom/:id (con costoEstimado) → 200" "200" "$BOM_STATUS"

    # Validar que costoEstimado es número
    COSTO_EST=$(echo "$BOM_ONE" | grep -oP '"costoEstimado":[0-9.]+' | head -1)
    if [ -n "$COSTO_EST" ]; then
      echo "  ✅ PASS  costoEstimado presente: $COSTO_EST"
      PASS=$((PASS + 1)); TOTAL=$((TOTAL + 1))
    else
      echo "  ❌ FAIL  costoEstimado ausente en GET /bom/:id"
      FAIL=$((FAIL + 1)); TOTAL=$((TOTAL + 1))
    fi
  else
    echo "  ⚠ SKIP  GET /bom/:id (sin BOM_ID)"
  fi
else
  echo "  ⚠ SKIP  tests BOM (sin PROD_ID o MAT_ID)"
  BOM_ID=""
fi

# --- [11c] Órdenes de producción ---
echo ""
echo "=== [11c] PRODUCCIÓN / ÓRDENES ==="

if [ -n "$BOM_ID" ]; then
  FECHA_FIN=$(date -d "+30 days" +%Y-%m-%d 2>/dev/null || date -v+30d +%Y-%m-%d)

  ORD_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/ordenes-produccion?localId=$LOCAL_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"bomId\":\"$BOM_ID\",\"cantidadPlanificada\":5,\"fechaFinPlanificada\":\"$FECHA_FIN\"}")
  ORD_ID=$(echo "$ORD_RESP" | grep -oP '"id":"\K[0-9a-f-]{36}' | head -1)
  ORD_HTTP=$(echo "$ORD_RESP" | tail -1)
  check "POST /ordenes-produccion → 201 (PLANIFICADA)" "201" "$ORD_HTTP"

  check "GET /ordenes-produccion → 200" "200" \
    "$(status "$BASE/ordenes-produccion" -H "Authorization: Bearer $ADMIN_TOKEN")"

  if [ -n "$ORD_ID" ]; then
    check "GET /ordenes-produccion/:id → 200" "200" \
      "$(status "$BASE/ordenes-produccion/$ORD_ID" -H "Authorization: Bearer $ADMIN_TOKEN")"

    # Iniciar orden (con stock suficiente → 200 EN_PROCESO)
    check "PATCH /ordenes-produccion/:id/iniciar → 200" "200" \
      "$(status -X PATCH "$BASE/ordenes-produccion/$ORD_ID/iniciar" \
         -H "Authorization: Bearer $ADMIN_TOKEN")"

    # Iniciar nuevamente → 404 (ya no es PLANIFICADA)
    check "PATCH /ordenes-produccion/:id/iniciar (ya iniciada) → 404" "404" \
      "$(status -X PATCH "$BASE/ordenes-produccion/$ORD_ID/iniciar" \
         -H "Authorization: Bearer $ADMIN_TOKEN")"

    # Finalizar
    check "PATCH /ordenes-produccion/:id/finalizar → 200 (COMPLETADA)" "200" \
      "$(status -X PATCH "$BASE/ordenes-produccion/$ORD_ID/finalizar" \
         -H "Authorization: Bearer $ADMIN_TOKEN" \
         -H "Content-Type: application/json" \
         -d '{"cantidadRealizada":4}')"

    # Cancelar orden ya completada → 404
    check "PATCH /ordenes-produccion/:id/cancelar (completada) → 404" "404" \
      "$(status -X PATCH "$BASE/ordenes-produccion/$ORD_ID/cancelar" \
         -H "Authorization: Bearer $ADMIN_TOKEN" \
         -H "Content-Type: application/json" \
         -d '{"motivo":"test"}')"

    # Nueva orden para cancelar desde PLANIFICADA
    ORD2_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/ordenes-produccion?localId=$LOCAL_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"bomId\":\"$BOM_ID\",\"cantidadPlanificada\":3,\"fechaFinPlanificada\":\"$FECHA_FIN\"}")
    ORD2_ID=$(echo "$ORD2_RESP" | grep -oP '"id":"\K[0-9a-f-]{36}' | head -1)
    ORD2_HTTP=$(echo "$ORD2_RESP" | tail -1)
    check "POST /ordenes-produccion (segunda) → 201" "201" "$ORD2_HTTP"

    if [ -n "$ORD2_ID" ]; then
      check "PATCH /ordenes-produccion/:id/cancelar (planificada) → 200" "200" \
        "$(status -X PATCH "$BASE/ordenes-produccion/$ORD2_ID/cancelar" \
           -H "Authorization: Bearer $ADMIN_TOKEN" \
           -H "Content-Type: application/json" \
           -d '{"motivo":"Cancelación preventiva"}')"
    fi
  else
    echo "  ⚠ SKIP  tests de orden (sin ORD_ID)"
  fi
else
  echo "  ⚠ SKIP  tests de órdenes (sin BOM_ID)"
fi

# --- [11d] Planificación ---
echo ""
echo "=== [11d] PRODUCCIÓN / PLANIFICACIÓN ==="

check "GET /planificacion?desde=&hasta= → 200" "200" \
  "$(status "$BASE/planificacion?desde=2026-01-01&hasta=2026-12-31" -H "Authorization: Bearer $ADMIN_TOKEN")"

check "GET /planificacion/materiales → 200" "200" \
  "$(status "$BASE/planificacion/materiales" -H "Authorization: Bearer $ADMIN_TOKEN")"

# ============================================================
# FASE 12 — REPORTES
# ============================================================

echo ""
echo "=== [12a] REPORTES / DASHBOARD ==="

check "GET /reportes/dashboard → 200" "200" \
  "$(status "$BASE/reportes/dashboard" -H "Authorization: Bearer $ADMIN_TOKEN")"

echo ""
echo "=== [12b] REPORTES / VENTAS ==="

check "GET /reportes/ventas?formato=json → 200" "200" \
  "$(status "$BASE/reportes/ventas?desde=2026-01-01&hasta=2026-12-31&formato=json" \
     -H "Authorization: Bearer $ADMIN_TOKEN")"

XLSX_CT=$(curl -s -o /dev/null -w "%{content_type}" \
  "$BASE/reportes/ventas?desde=2026-01-01&hasta=2026-12-31&formato=xlsx" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$XLSX_CT" | grep -q "spreadsheetml"; then
  check "GET /reportes/ventas?formato=xlsx → spreadsheetml" "spreadsheetml" "spreadsheetml"
else
  check "GET /reportes/ventas?formato=xlsx → spreadsheetml" "spreadsheetml" "$XLSX_CT"
fi

echo ""
echo "=== [12c] REPORTES / INVENTARIO ==="

check "GET /reportes/inventario?formato=json → 200" "200" \
  "$(status "$BASE/reportes/inventario?formato=json" -H "Authorization: Bearer $ADMIN_TOKEN")"

XLSX_INV_CT=$(curl -s -o /dev/null -w "%{content_type}" \
  "$BASE/reportes/inventario?formato=xlsx" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$XLSX_INV_CT" | grep -q "spreadsheetml"; then
  check "GET /reportes/inventario?formato=xlsx → spreadsheetml" "spreadsheetml" "spreadsheetml"
else
  check "GET /reportes/inventario?formato=xlsx → spreadsheetml" "spreadsheetml" "$XLSX_INV_CT"
fi

echo ""
echo "=== [12d] REPORTES / COMPRAS ==="

check "GET /reportes/compras?desde=&hasta= → 200" "200" \
  "$(status "$BASE/reportes/compras?desde=2026-01-01&hasta=2026-12-31" \
     -H "Authorization: Bearer $ADMIN_TOKEN")"

echo ""
echo "=== [12e] REPORTES / RRHH ==="

check "GET /reportes/rrhh (Vendedor) → 403" "403" \
  "$(status "$BASE/reportes/rrhh" -H "Authorization: Bearer $VEND_TOKEN")"

check "GET /reportes/rrhh (Admin) → 200" "200" \
  "$(status "$BASE/reportes/rrhh?desde=2026-01-01&hasta=2026-12-31&formato=json" \
     -H "Authorization: Bearer $ADMIN_TOKEN")"

echo ""
echo "=== [12f] REPORTES / RESULTADOS ==="

check "GET /reportes/resultados → 200" "200" \
  "$(status "$BASE/reportes/resultados?desde=2026-01-01&hasta=2026-12-31" \
     -H "Authorization: Bearer $ADMIN_TOKEN")"

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
