#!/usr/bin/env bash

set -o errexit

# Sync files to an S3 bucket, deleting what's there
#
# Required environment variables:
#   AWS_S3_BUCKET
#   AWS_S3_ACCESS_KEY_ID
#   AWS_S3_SECRET_ACCESS_KEY

fail() {
  echo $1 >&2
  exit 1
}

init() {

  if [[ -z ${AWS_S3_BUCKET} ]]; then
    fail "AWS_S3_BUCKET is unset"
  fi

  if [[ -z ${AWS_ACCESS_KEY_ID} ]]; then
    fail "AWS_ACCESS_KEY_ID is unset"
  fi

  if [[ -z ${AWS_SECRET_ACCESS_KEY} ]]; then
    fail "AWS_SECRET_ACCESS_KEY is unset"
  fi

  if [[ $# -lt 1 ]]; then
    fail "directory was not specified"
  fi

  SRCDIR=$1

}

main() {
  init $*
  aws s3 sync --delete ${SRCDIR} s3://${AWS_S3_BUCKET}
}

main $*
