#!/bin/sh

set -e

SPEC_PATH=$1

if [ -z "$1" ]
  then
    echo "Missing open api specification path"
    exit 1
fi

npx @openapitools/openapi-generator-cli generate \
  -i $SPEC_PATH \
  -g typescript-fetch \
  -o src/generated-open-api-client