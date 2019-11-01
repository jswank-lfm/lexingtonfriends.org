#!/usr/bin/env bash
# Purge all files from a Cloudflare Zone
#
# Reference: https://www.cloudflare.com/docs/next/#zone-purge-all-files
#
# Required environment variables:
#   CLOUDFLARE_ZONE_ID
#   CLOUDFLARE_AUTH_EMAIL
#   CLOUDFLARE_AUTH_KEY

set -o errexit
set -o nounset

CLOUDFLARE_ZONE_ID=${CLOUDFLARE_ZONE_ID:?CLOUDFLARE_ZONE_ID is unset}
CLOUDFLARE_AUTH_EMAIL=${CLOUDFLARE_AUTH_EMAIL:?CLOUDFLARE_AUTH_EMAIL is unset}
CLOUDFLARE_AUTH_KEY=${CLOUDFLARE_AUTH_KEY:?CLOUDFLARE_AUTH_KEY is unset}

fail() {

  echo $1 >&2
  exit 1

}

init() {

  which curl > /dev/null || fail "curl command is not available"

}

main() {
  
  init $*

  curl -X DELETE --fail \
    --output /dev/stderr \
    --silent \
    -H "X-Auth-Email: ${CLOUDFLARE_AUTH_EMAIL}" \
    -H "Authorization: Bearer ${CLOUDFLARE_AUTH_KEY}" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}' \
    "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache"

}

main $*

