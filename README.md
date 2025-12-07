# create-magicblock

[![npm version](https://img.shields.io/npm/v/create-magicblock.svg?style=flat-square)](https://www.npmjs.com/package/create-magicblock)
[![npm downloads](https://img.shields.io/npm/dm/create-magicblock.svg?style=flat-square)](https://www.npmjs.com/package/create-magicblock)
[![GitHub stars](https://img.shields.io/github/stars/ankushKun/create-magicblock.svg?style=flat-square)](https://github.com/ankushKun/create-magicblock)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

A CLI tool to scaffold Solana applications powered by [MagicBlock](https://magicblock.gg) Ephemeral Rollups. Quickly bootstrap high-performance, gasless, and seamless on-chain games and dApps.

## Quick Start

To create a new project, simply run:

```bash
npm create magicblock@latest
# or
bun create magicblock@latest
```

## Templates

1. `Regular Counter` - Simple anchor program + frontend 
2. `ER Counter` - ER supported anchor program + frontend + session keys for 
3. `ER Phaser Grid` - 2D grid multiplayer movement (coming soon)
4. `MB VRF` - Verifiable Randomness (coming soon)
5. `MB PER` - Private Ephemeral Rollups (coming soon)

## 🛠 Prerequisites

Ensure you have the following installed to run the generated projects:

* Bun (frontend)
* Rust + Cargo
* Solana CLI
* Anchor CLI