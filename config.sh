#!/bin/bash

PLUGIN_NAME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd | xargs basename )"

echo "Running ./Plugins/$PLUGIN_NAME"
cd ./Plugins/$PLUGIN_NAME
source config.sh
