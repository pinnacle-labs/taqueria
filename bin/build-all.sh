#!/usr/bin/env bash
set -e # exiting on error

if [ "$0" == "./bin/build-all.sh" ] && [ -f index.ts ]; then
    echo '**********************************************'
    echo '******* BUILDING ALL TAQUERIA PACKAGES *******'
    echo '**********************************************'

    echo ""
    echo '**********************************************'
    echo "** Checking Dependencies"
    docker ps

    echo ""
    echo '**********************************************'
    echo "** Installing NPM dependencies"
    npm ci

    echo ""
    echo '**********************************************'
    echo "** Building taqueria"
    npm run build:binary

    echo ""
    echo '**********************************************'
    echo "** Building packages"
    npm run build:packages

    echo ""
    echo '**********************************************'
    echo "** Building docker images"
    npm run build:docker

    echo ""
    echo '**********************************************'
    echo "** Builds complete!"

else
    echo "Usage: ./bin/build-all.sh"
    echo "(please run from within project root)"
fi
