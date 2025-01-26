# Abstract EVM RPC Monitor

A Node.js TypeScript application that monitors the Abstract EVM RPC endpoint and sends notifications via ntfy.sh when the RPC becomes functional.

## Features

- Continuous monitoring of Abstract EVM RPC endpoint
- Comprehensive RPC health checks:
  - Block number verification
  - Latest block details retrieval
  - Block timestamp staleness check
- Push notifications via ntfy.sh when RPC comes back online

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
- Check the RPC status every second
- Send a notification when the RPC becomes functional
- Display real-time status in the console

## Configuration

The following constants can be modified in `src/monitor.ts`:

- `RPC_URL`: The Abstract EVM RPC endpoint
- `NTFY_URL`: The ntfy.sh webhook URL
- `CHECK_INTERVAL`: Time between RPC checks (in milliseconds)

## License

ISC 