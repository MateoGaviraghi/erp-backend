#!/usr/bin/env bash
# =============================================================================
# test-endpoints.sh — Prueba completa de endpoints Fase 4
# Uso: bash test-endpoints.sh
# =============================================================================

BASE_URL="http://localhost:3001/api/v1"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS=0
FAIL=0

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
print_header() {
  echo ""
  echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
}

assert_status() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo -e "  ${GREEN}✔ PASS${NC} — $label (HTTP $actual)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✘ FAIL${NC} — $label (esperaba HTTP $expected, obtuvo HTTP $actual)"
    FAIL=$((FAIL + 1))
  fi
}

assert_contains() {
  local label="$1"
  local needle="$2"
  local haystack="$3"
  if echo "$haystack" | grep -q "$needle"; then
    echo -e "  ${GREEN}✔ PASS${NC} — $label contiene '$needle'"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✘ FAIL${NC} — $label NO contiene '$needle'"
    echo -e "         Body: ${haystack:0:200}"
    FAIL=$((FAIL + 1))
  fi
}

# GET con auth opcional; retorna "STATUS:::BODY"
do_get() {
  local path="$1"
  local token="${2:-}"
  local response
  response=$(curl -s -w "\n%{http_code}" "$BASE_URL$path" \
    ${token:+-H "Authorization: Bearer $token"})
  local body
  body=$(echo "$response" | head -n -1)
  local status
  status=$(echo "$response" | tail -n1)
  echo "${status}:::${body}"
}

# POST con JSON body; retorna "STATUS:::BODY"
# $1=path $2=json_body $3=token(opcional)
do_post() {
  local path="$1"
  local body="$2"
  local token="${3:-}"
  local response
  response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$path" \
    -H "Content-Type: application/json" \
    ${token:+-H "Authorization: Bearer $token"} \
    -d "$body")
  local resp_body
  resp_body=$(echo "$response" | head -n -1)
  local status
  status=$(echo "$response" | tail -n1)
  echo "${status}:::${resp_body}"
}

# PATCH con JSON body; retorna "STATUS:::BODY"
do_patch() {
  local path="$1"
  local body="$2"
  local token="${3:-}"
  local response
  response=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL$path" \
    -H "Content-Type: application/json" \
    ${token:+-H "Authorization: Bearer $token"} \
    -d "$body")
  local resp_body
  resp_body=$(echo "$response" | head -n -1)
  local status
  status=$(echo "$response" | tail -n1)
  echo "${status}:::${resp_body}"
}

# Extrae un campo JSON sin jq — extract_field <campo> <json>
extract_field() {
  echo "$2" | sed "s/.*\"$1\":\"\([^\"]*\)\".*/\1/"
}

# =============================================================================
# 1. HEALTH CHECK (público)
# =============================================================================
print_header "1. HEALTH CHECK"

result=$(do_get "/health")
status="${result%%:::*}"
body="${result#*:::}"

assert_status "GET /health" "200" "$status"
assert_contains "database connected" '"database":"connected"' "$body"

# =============================================================================
# 2. PROTECCIÓN — sin token debe retornar 401
# =============================================================================
print_header "2. PROTECCIÓN — sin token"

result=$(do_get "/auth/profile")
assert_status "GET /auth/profile sin token → 401" "401" "${result%%:::*}"

result=$(do_get "/usuarios")
assert_status "GET /usuarios sin token → 401" "401" "${result%%:::*}"

# =============================================================================
# 3. LOGIN — password incorrecta (usuario existente)
#    La estrategia local lanza UnauthorizedException → 401
# =============================================================================
print_header "3. LOGIN — password incorrecta"

result=$(do_post "/auth/login" '{"email":"admin@empresa.com","password":"WRONG_PASSWORD"}')
assert_status "POST /auth/login (password mal) → 401" "401" "${result%%:::*}"

# =============================================================================
# 4. LOGIN — admin  (el controller tiene @HttpCode(200))
# =============================================================================
print_header "4. LOGIN — admin@empresa.com"

result=$(do_post "/auth/login" '{"email":"admin@empresa.com","password":"admin123"}')
status="${result%%:::*}"
body="${result#*:::}"

assert_status "POST /auth/login (admin) → 200" "200" "$status"
assert_contains "accessToken presente" '"accessToken"' "$body"
assert_contains "refreshToken presente" '"refreshToken"' "$body"
assert_contains "user.rol = Administrador" '"rol":"Administrador"' "$body"

ADMIN_ACCESS=$(extract_field "accessToken" "$body")
ADMIN_REFRESH=$(extract_field "refreshToken" "$body")
ADMIN_ID=$(echo "$body" | sed 's/.*"user":{"id":"\([^"]*\)".*/\1/')

if [[ "$ADMIN_ACCESS" == *"eyJ"* ]]; then
  echo -e "  ${GREEN}✔ PASS${NC} — accessToken tiene formato JWT"
  PASS=$((PASS + 1))
else
  echo -e "  ${RED}✘ FAIL${NC} — accessToken no parece JWT"
  FAIL=$((FAIL + 1))
fi

# =============================================================================
# 5. LOGIN — vendedor  (también 200)
# =============================================================================
print_header "5. LOGIN — vendedor@empresa.com"

result=$(do_post "/auth/login" '{"email":"vendedor@empresa.com","password":"vendedor123"}')
status="${result%%:::*}"
body="${result#*:::}"

assert_status "POST /auth/login (vendedor) → 200" "200" "$status"
assert_contains "user.rol = Vendedor" '"rol":"Vendedor"' "$body"

VENDOR_ACCESS=$(extract_field "accessToken" "$body")
VENDOR_ID=$(echo "$body" | sed 's/.*"user":{"id":"\([^"]*\)".*/\1/')

# =============================================================================
# 6. PROFILE
# =============================================================================
print_header "6. GET /auth/profile"

result=$(do_get "/auth/profile" "$ADMIN_ACCESS")
status="${result%%:::*}"
body="${result#*:::}"

assert_status "GET /auth/profile (admin) → 200" "200" "$status"
assert_contains "email admin en profile" '"email":"admin@empresa.com"' "$body"

# =============================================================================
# 7. USUARIOS — control de acceso por rol
# =============================================================================
print_header "7. USUARIOS — control de acceso"

# Admin puede listar todos
result=$(do_get "/usuarios" "$ADMIN_ACCESS")
status="${result%%:::*}"
body="${result#*:::}"
assert_status "GET /usuarios (admin) → 200" "200" "$status"
assert_contains "lista contiene admin" '"admin@empresa.com"' "$body"

# Vendedor NO puede listar (requiere rol Administrador)
result=$(do_get "/usuarios" "$VENDOR_ACCESS")
assert_status "GET /usuarios (vendedor) → 403" "403" "${result%%:::*}"

# Admin puede ver usuario por ID
result=$(do_get "/usuarios/$ADMIN_ID" "$ADMIN_ACCESS")
status="${result%%:::*}"
body="${result#*:::}"
assert_status "GET /usuarios/:id (admin) → 200" "200" "$status"
assert_contains "nombre Administrador" '"Administrador"' "$body"

# Vendedor puede ver su propio perfil por ID
result=$(do_get "/usuarios/$VENDOR_ID" "$VENDOR_ACCESS")
assert_status "GET /usuarios/:id (vendedor propio) → 200" "200" "${result%%:::*}"

# =============================================================================
# 8. CREAR USUARIO (solo Admin)
#    CreateUsuarioDto: nombre, email, password, rol (Administrador|Vendedor|Contable), localId (opcional)
#    No se envía empresaId — el servicio la toma del token del admin autenticado
# =============================================================================
print_header "8. POST /usuarios — crear usuario"

# Usar timestamp para email único en cada ejecución
TS=$(date +%s)
NEW_USER_BODY="{\"nombre\":\"Usuario Test\",\"email\":\"test.${TS}@empresa.com\",\"password\":\"Test1234\",\"rol\":\"Contable\"}"

result=$(do_post "/usuarios" "$NEW_USER_BODY" "$ADMIN_ACCESS")
status="${result%%:::*}"
body="${result#*:::}"

assert_status "POST /usuarios (admin) → 201" "201" "$status"
assert_contains "nuevo usuario email" "\"test.${TS}@empresa.com\"" "$body"

NEW_USER_ID=$(echo "$body" | sed 's/.*"id":"\([^"]*\)".*/\1/')

# Vendedor NO puede crear usuarios
result=$(do_post "/usuarios" "$NEW_USER_BODY" "$VENDOR_ACCESS")
assert_status "POST /usuarios (vendedor) → 403" "403" "${result%%:::*}"

# =============================================================================
# 9. ACTUALIZAR USUARIO
# =============================================================================
print_header "9. PATCH /usuarios/:id"

result=$(do_patch "/usuarios/$NEW_USER_ID" '{"nombre":"Usuario Editado"}' "$ADMIN_ACCESS")
status="${result%%:::*}"
body="${result#*:::}"

assert_status "PATCH /usuarios/:id (admin) → 200" "200" "$status"
assert_contains "nombre actualizado" '"Usuario Editado"' "$body"

# =============================================================================
# 10. REFRESH TOKEN
#     El guard jwt-refresh lee el token desde el header Authorization: Bearer
# =============================================================================
print_header "10. POST /auth/refresh"

# Login fresco para obtener un refresh token limpio (sin que nadie lo haya usado)
fresh_login=$(do_post "/auth/login" '{"email":"admin@empresa.com","password":"admin123"}')
FRESH_REFRESH=$(extract_field "refreshToken" "${fresh_login#*:::}")

# El endpoint /auth/refresh usa AuthGuard('jwt-refresh') → Bearer header
result=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FRESH_REFRESH")
status=$(echo "$result" | tail -n1)
body=$(echo "$result" | head -n -1)

assert_status "POST /auth/refresh → 200" "200" "$status"
assert_contains "nuevo accessToken" '"accessToken"' "$body"

NEW_ACCESS=$(extract_field "accessToken" "$body")

# El nuevo token debe ser funcional
result=$(do_get "/auth/profile" "$NEW_ACCESS")
assert_status "Token refrescado funciona en /profile → 200" "200" "${result%%:::*}"

# El refresh token viejo debe quedar inválido (rotación)
result=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FRESH_REFRESH")
status=$(echo "$result" | tail -n1)
assert_status "Refresh token ya usado → 401" "401" "$status"

# =============================================================================
# 11. LOGOUT
# =============================================================================
print_header "11. POST /auth/logout"

login_result=$(do_post "/auth/login" '{"email":"admin@empresa.com","password":"admin123"}')
LOGOUT_TOKEN=$(extract_field "accessToken" "${login_result#*:::}")

result=$(do_post "/auth/logout" '{}' "$LOGOUT_TOKEN")
assert_status "POST /auth/logout → 200" "200" "${result%%:::*}"

# Después del logout, el access token sigue siendo válido hasta su expiración
# (el JWT es stateless; solo se revoca el refreshToken en BD)
result=$(do_get "/auth/profile" "$LOGOUT_TOKEN")
echo -e "  ${YELLOW}INFO${NC} — GET /profile tras logout → HTTP ${result%%:::*} (JWT stateless: válido hasta expirar)"

# =============================================================================
# RESUMEN FINAL
# =============================================================================
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  RESUMEN${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Pasaron: $PASS${NC}"
if [[ $FAIL -gt 0 ]]; then
  echo -e "  ${RED}Fallaron: $FAIL${NC}"
  echo ""
  exit 1
else
  echo -e "  ${RED}Fallaron: 0${NC}"
  echo ""
  echo -e "  ${GREEN}Todos los tests pasaron ✔${NC}"
fi
