# Abstract EVM RPC Monitor

A Node.js TypeScript application that monitors both the official and leaked Abstract EVM RPC endpoints, sending notifications via ntfy.sh when either RPC becomes functional.

## Features

- Parallel monitoring of both Abstract EVM RPC endpoints:
  - Official RPC (`api.mainnet.abs.xyz`)
  - Leaked/Test RPC (`abstract.leakedrpc.com`)
- Comprehensive RPC health checks:
  - Block number verification
  - Latest block details retrieval
  - Block timestamp staleness check (5-minute threshold)
- Differentiated push notifications:
  - 🌟 Official RPC status updates
  - 🎉 Leaked RPC status updates
  - Block numbers included in notifications

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd abstract
```

2. Install dependencies:
```bash
npm install
```

## Usage

1. Start the monitor:
```bash
npm start
```

2. Set up notifications:
   - Install the ntfy app on your mobile device
   - Subscribe to the topic: `abs`
   - Or visit https://ntfy.sh/abs in your web browser

The monitor will:
- Check both RPCs every second in parallel
- Send notifications when either RPC becomes functional
- Display real-time status and block numbers in the console
- Track each RPC's status independently

## Configuration

The following constants can be modified in `src/monitor.ts`:

- `LEAKED_RPC_URL`: The leaked/test Abstract EVM RPC endpoint
- `OFFICIAL_RPC_URL`: The official Abstract EVM RPC endpoint
- `NTFY_URL`: The ntfy.sh webhook URL
- `CHECK_INTERVAL`: Time between RPC checks (in milliseconds)

## Notifications

You'll receive different notifications depending on which RPC becomes available:
- 🌟 Official RPC: Indicates the main network RPC is operational
- 🎉 Leaked RPC: Indicates the test/leaked RPC is operational
- 🚀 Startup: Indicates the monitoring service has started

Each notification includes the current block number when an RPC comes online.

## License

ISC 