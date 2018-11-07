#!/bin/bash

PLUGIN_NAME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd | xargs basename )"

echo "Checking if $PLUGIN_NAME part 2 exists..."

if [ ! -f ./Plugins/$PLUGIN_NAME/config.sh ]; then
    echo "Part 2 does not exists..."
    echo "Exiting installation!"
    exit 0
fi

echo "Running ./Plugins/$PLUGIN_NAME"
cd ./Plugins/$PLUGIN_NAME
source config.sh
