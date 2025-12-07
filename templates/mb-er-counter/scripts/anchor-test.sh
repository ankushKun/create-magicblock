#!/bin/bash

set -e

# Get environment from argument, default to localnet
ENV="${1:-localnet}"

# Validate environment
if [[ "$ENV" != "devnet" && "$ENV" != "localnet" && "$ENV" != "mainnet" ]]; then
  echo "Error: Invalid environment '$ENV'. Must be one of: devnet, localnet, mainnet"
  exit 1
fi

echo "Running tests on $ENV..."

# Kill any existing validators only for localnet
# if [[ "$ENV" == "localnet" ]]; then
#   pkill -f solana-test-validator || true
# fi

# Run tests
if [[ "$ENV" == "localnet" ]]; then
  # Set ER endpoints to local validator for localnet testing
  export EPHEMERAL_PROVIDER_ENDPOINT="http://0.0.0.0:7799"
  export EPHEMERAL_WS_ENDPOINT="ws://0.0.0.0:7800" 
fi
anchor test --provider.cluster "$ENV" --skip-local-validator