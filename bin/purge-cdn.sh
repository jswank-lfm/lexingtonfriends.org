#!/usr/bin/env bash

set -o errexit
set -o nounset

# Purge all files from a Cloudflare Zone
#
# Reference: https://www.cloudflare.com/docs/next/#zone-purge-all-files

CLOUDFLARE_ZONE_ID=${CLOUDFLARE_ZONE_ID:=""}
CLOUDFLARE_AUTH_EMAIL=${CLOUDFLARE_AUTH_EMAIL:="cloudflare@scalene.net"}
CLOUDFLARE_AUTH_KEY=${CLOUDFLARE_AUTH_KEY:=""}

status=$(curl -X DELETE \
  --output /dev/stderr \
  --write-out "%{http_code}" \
  --silent \
  -H "X-Auth-Email: ${CLOUDFLARE_AUTH_EMAIL}" \
  -H "X-Auth-Key: ${CLOUDFLARE_AUTH_KEY}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}' \
  "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache")

if [[ $status -gt 399 ]] ; then
  exit 2
fi
