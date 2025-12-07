#!/bin/bash

set -e

# Get environment from argument, default to localnet
ENV="${1:-localnet}"

# Validate environment
if [[ "$ENV" != "devnet" && "$ENV" != "localnet" && "$ENV" != "mainnet" ]]; then
  echo "Error: Invalid environment '$ENV'. Must be one of: devnet, localnet, mainnet"
  exit 1
fi

echo "Deploying to $ENV..."

# Deploy program
anchor deploy --provider.cluster "$ENV"