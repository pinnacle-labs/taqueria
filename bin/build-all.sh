#!/usr/bin/env bash

if [ "$0" == "./bin/build-all.sh" ] && [ -f index.ts ]; then
    echo '**********************************************'
    echo '******* BUILDING ALL TAQUERIA PACKAGES *******'
    echo '**********************************************'

    echo ""
    echo '**********************************************'
    echo "** Checking Dependencies"
    (
        set -e
        docker ps > /dev/null
        echo "✅ Docker is installed, running, and the user has permission."
    )
    errorCode=$?
    if [ $errorCode -ne 0 ]; then
        echo "❌ Docker is not installed, not running, or the user needs permission."
        exit $errorCode
    fi
    if [ -n `which deno || ""` ]; then
        deno --version | grep 1.23 >/dev/null
        errorCode=$?
        if [ $errorCode -ne 0 ]; then
            echo "❌ Deno is installed, but not using v1.23.x. Please use Deno v1.23.x."
            exit $errorCode
        else
            echo "✅ Deno is installed, and running v1.23.x"
        fi
    else
        echo "❌ Deno is not installed."
        echo -2
    fi
    echo "** Dependency checks passed"

    set -e # exiting on error

    echo ""
    echo '**********************************************'
    echo "** Installing NPM dependencies"
    npm ci

    echo ""
    echo '**********************************************'
    echo "** Generating Types"
    npm run build-types

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
