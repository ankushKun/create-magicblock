#!/bin/bash

set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# sync program address
anchor keys sync

# compile the program
anchor build

# Generate TypeScript IDL using the JavaScript script
echo "Generating TypeScript IDL..."
node "$SCRIPT_DIR/generate-idl.mjs"

