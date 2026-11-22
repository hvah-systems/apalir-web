#!/usr/bin/env bash
# Sube el sitio al servidor desde la Mac. Solo copia index.html y assets/ (nada de git ni deploy/).
# Uso: deploy/publicar.sh root@IP-DEL-SERVIDOR
set -euo pipefail
DESTINO="${1:?Uso: deploy/publicar.sh usuario@servidor}"
cd "$(dirname "$0")/.."
ssh "$DESTINO" 'mkdir -p /var/www/apalir'
rsync -az --delete --exclude '.*' index.html galeria.html assets "$DESTINO:/var/www/apalir/"
echo "Sitio subido a $DESTINO:/var/www/apalir"
