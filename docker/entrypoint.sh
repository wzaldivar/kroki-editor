#!/bin/sh
set -e

# Optional same-origin reverse proxy to Kroki. The browser makes the Kroki requests, so
# it cannot use a container-network hostname directly; with KROKI_PROXY_TARGET set
# (e.g. http://kroki:8000) nginx forwards KROKI_PROXY_PATH to it, and Kroki needs no
# published port. KROKI_ENDPOINT then defaults to that path.
: "${KROKI_PROXY_TARGET:=}"
: "${KROKI_PROXY_PATH:=/kroki-render}"
KROKI_PROXY_PATH="/$(printf '%s' "$KROKI_PROXY_PATH" | sed 's:^/*::; s:/*$::')"
mkdir -p /etc/nginx/kroki-proxy.d
rm -f /etc/nginx/kroki-proxy.d/kroki.conf
if [ -n "$KROKI_PROXY_TARGET" ]; then
  printf 'location %s/ {\n  proxy_pass %s/;\n}\n' "$KROKI_PROXY_PATH" "${KROKI_PROXY_TARGET%/}" \
    > /etc/nginx/kroki-proxy.d/kroki.conf
  : "${KROKI_ENDPOINT:=$KROKI_PROXY_PATH}"
  export KROKI_ENDPOINT
fi

: "${PAGE_TITLE:=}"
: "${KROKI_ENDPOINT:=https://kroki.io}"
: "${EXAMPLE_KROKI_ENDPOINT:=}"
: "${ENABLED_DIAGRAMS:=}"
: "${DEFAULT_DIAGRAM:=plantuml}"
: "${MERMAID_CLIENT_SIDE:=false}"
: "${EXAMPLE_PLANTUML:=}"
: "${EXAMPLE_MERMAID:=}"
: "${EXAMPLE_GRAPHVIZ:=}"
: "${EXAMPLE_D2:=}"

envsubst '$PAGE_TITLE $KROKI_ENDPOINT $EXAMPLE_KROKI_ENDPOINT $ENABLED_DIAGRAMS $DEFAULT_DIAGRAM $MERMAID_CLIENT_SIDE $EXAMPLE_PLANTUML $EXAMPLE_MERMAID $EXAMPLE_GRAPHVIZ $EXAMPLE_D2' \
  < /usr/share/nginx/html/config.js.template \
  > /usr/share/nginx/html/config.js

exec nginx -g 'daemon off;'
