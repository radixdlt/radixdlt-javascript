#!/bin/sh

set -e

SCHEMA_PATH=$1

if [ -z "$1" ]
  then
    echo "Missing open api schema path"
    exit 1
fi

npx @openapitools/openapi-generator-cli generate \
  -i $SCHEMA_PATH \
  -g typescript-fetch \
  -o src/open-api