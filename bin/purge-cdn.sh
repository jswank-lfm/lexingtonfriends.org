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

fail() {

  echo $1 >&2
  exit 1

}

init() {

  if [[ -z ${CLOUDFLARE_ZONE_ID} ]]; then
    fail "CLOUDFLARE_ZONE_ID is unset"
  fi

  if [[ -z ${CLOUDFLARE_AUTH_EMAIL} ]]; then
    fail "CLOUDFLARE_AUTH_EMAIL is unset"
  fi

  if [[ -z ${CLOUDFLARE_AUTH_KEY} ]]; then
    fail "CLOUDFLARE_AUTH_KEY is unset"
  fi

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

