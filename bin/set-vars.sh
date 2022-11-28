#!/usr/bin/env bash
BRANCH=`git branch --show-current`
COMMIT=`git rev-parse --short HEAD`
if [ -z "$GITHUB_SHA"]; then
    TAQ_VERSION="dev-$BRANCH"
else
    TAQ_VERSION=${foo:0:8}
fi
TIMESTAMP=`date +%s`

if [  -z "$GITHUB_REF" ]; then
    TAQ_VERSION="dev-$BRANCH"
else
    TAQ_VERSION="${GITHUB_REF##*/}"
