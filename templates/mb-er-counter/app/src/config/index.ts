export const Endpoints = {
    Solana: {
        localnet: "http://127.0.0.1:8899",
        localnetWs: "ws://127.0.0.1:8900",
        devnet: "https://api.devnet.solana.com",
        devnetWs: "wss://api.devnet.solana.com",
    },
    Er: {
        localnet: "http://127.0.0.1:7799",
        localnetWs: "ws://127.0.0.1:7800",
        devnet: "https://rpc.magicblock.app/devnet",
        devnetWs: "wss://rpc.magicblock.app/devnet",
    }
}

// These public validators are supported for development.Make sure to add the specific ER validator account when delegating
export const ErValidators = {
    asia: { address: "MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57", endpoint: "https://devnet-as.magicblock.app" },
    eu: { address: "MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e", endpoint: "https://devnet-eu.magicblock.app" },
    us: { address: "MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd", endpoint: "https://devnet-us.magicblock.app" },
    tee: { address: "FnE6VJT5QNZdedZPnCoLsARgBwoE6DeJNjBs2H1gySXA", endpoint: "https://devnet-tee.magicblock.app" },
    local: { address: "mAGicPQYBMvcYveUZA5F5UNNwyHvfYh5xkLS2Fr1mev", endpoint: "http://127.0.0.1:7799" }
}

export const MagicRouter = {
    devnet: "https://devnet-router.magicblock.app",
    devnetWs: "wss://devnet-router.magicblock.app"
}