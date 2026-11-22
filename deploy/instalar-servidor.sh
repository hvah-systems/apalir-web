#!/usr/bin/env bash
# Configura Nginx + HTTPS (Let's Encrypt) para el sitio de la Iglesia Apalir en Debian 13.
# Se ejecuta EN EL SERVIDOR como root. Los archivos del sitio deben estar ya en $RAIZ
# (los sube publicar.sh desde la Mac).
#
# Uso: instalar-servidor.sh <dominio-iglesia> <correo-letsencrypt> [dominio-fundacion]
#   El dominio de la fundación sirve el mismo sitio y lleva a la sección de la Fundación.
set -euo pipefail

DOMINIO="${1:?Falta el dominio de la iglesia (ej. apalir.org.do)}"
CORREO="${2:?Falta el correo para los avisos del certificado}"
FUNDACION="${3:-}"
RAIZ=/var/www/apalir
CONF=/etc/nginx/sites-available/apalir

[ "$(id -u)" -eq 0 ] || { echo "Ejecuta como root"; exit 1; }

# No pisar otro servidor web que ya use el puerto 80.
if ss -ltnp 2>/dev/null | grep -q ':80 ' && ! ss -ltnp | grep ':80 ' | grep -q nginx; then
  echo "Otro programa usa el puerto 80 (no es Nginx). Revisa antes de seguir:"; ss -ltnp | grep ':80 '; exit 1
fi

apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nginx certbot python3-certbot-nginx rsync curl >/dev/null

[ -f "$RAIZ/index.html" ] || { echo "No está $RAIZ/index.html: sube el sitio primero"; exit 1; }
chown -R www-data:www-data "$RAIZ"

IP_SERVIDOR=$(curl -4 -s https://ifconfig.me || hostname -I | awk '{print $1}')

# Solo pide certificado para los nombres que ya apuntan a este servidor.
apunta() { getent ahostsv4 "$1" | awk '{print $1}' | grep -qx "$IP_SERVIDOR"; }

NOMBRES_IGLESIA="$DOMINIO"; apunta "www.$DOMINIO" && NOMBRES_IGLESIA="$DOMINIO www.$DOMINIO"
apunta "$DOMINIO" || { echo "$DOMINIO no apunta a $IP_SERVIDOR todavía. Corrige el DNS y vuelve a ejecutar."; exit 1; }

NOMBRES_FUND=""
if [ -n "$FUNDACION" ]; then
  for n in "$FUNDACION" "www.$FUNDACION"; do apunta "$n" && NOMBRES_FUND="$NOMBRES_FUND $n"; done
  [ -n "$NOMBRES_FUND" ] || echo "AVISO: $FUNDACION aún no apunta a $IP_SERVIDOR; se configura solo la iglesia."
fi

cat > "$CONF" <<NGINX
# Iglesia Apalir — generado por instalar-servidor.sh
server {
    listen 80;
    listen [::]:80;
    server_name $NOMBRES_IGLESIA;
    root $RAIZ;
    index index.html;
    charset utf-8;

    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header X-Frame-Options SAMEORIGIN always;

    location / { try_files \$uri \$uri/ =404; }
    location /assets/ { expires 30d; add_header Cache-Control "public"; }
    location ~ /\. { deny all; }

    gzip on;
    gzip_types text/css application/javascript image/svg+xml;
}
NGINX

if [ -n "$NOMBRES_FUND" ]; then
cat >> "$CONF" <<NGINX

# Fundación Apalir: mismo sitio, abre en la sección de la Fundación
server {
    listen 80;
    listen [::]:80;
    server_name$NOMBRES_FUND;
    return 301 https://$DOMINIO/#fundacion;
}
NGINX
fi

ln -sf "$CONF" /etc/nginx/sites-enabled/apalir
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

DOMINIOS_CERT=""
for n in $NOMBRES_IGLESIA $NOMBRES_FUND; do DOMINIOS_CERT="$DOMINIOS_CERT -d $n"; done
# shellcheck disable=SC2086
certbot --nginx --non-interactive --agree-tos --redirect -m "$CORREO" $DOMINIOS_CERT

systemctl reload nginx
echo "LISTO: https://$DOMINIO"
[ -z "$NOMBRES_FUND" ] || echo "Fundación:$NOMBRES_FUND -> https://$DOMINIO/#fundacion"
