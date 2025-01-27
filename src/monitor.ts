import { ethers } from 'ethers';
import axios from 'axios';

const LEAKED_RPC_URL = 'https://abstract.leakedrpc.com';
const OFFICIAL_RPC_URL = 'https://api.abs.xyz'; // Added /rpc path
const NTFY_URL = 'https://ntfy.sh/abs';
const CHECK_INTERVAL = 1000; // Check every second

interface RPCStatus {
    isUp: boolean;
    blockNumber?: number;
    timestamp?: number;
}

function getErrorMessage(error: any): string {
    if (error.code === 'ENOTFOUND') return 'DNS lookup failed';
    if (error.code === 'SERVER_ERROR') {
        if (error.shortMessage?.includes('502')) return '502 Bad Gateway';
        if (error.shortMessage?.includes('301')) return 'URL has moved - needs updated RPC path';
        return error.shortMessage || 'Server error';
    }
    if (error.message?.includes('failed to detect network')) return 'Network detection failed';
    return 'Connection failed';
}

async function checkRPCStatus(url: string, name: string): Promise<RPCStatus> {
    try {
        const provider = new ethers.JsonRpcProvider(url);
        
        // 1. Check block number
        const blockNumber = await provider.getBlockNumber();
        
        // 2. Get latest block details
        const latestBlock = await provider.getBlock(blockNumber);
        if (!latestBlock) {
            return { isUp: false };
        }
        
        // 3. Check if block timestamp is recent (within last 5 minutes)
        const blockTimestamp = Number(latestBlock.timestamp) * 1000;
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (now - blockTimestamp > fiveMinutes) {
            console.log(`${name}: Chain appears stale (last block: ${Math.floor((now - blockTimestamp) / 1000 / 60)} minutes old)`);
            return { isUp: false };
        }

        // Only log block number when there's a change
        console.log(`${name}: Block #${blockNumber}`);
        return { 
            isUp: true,
            blockNumber,
            timestamp: blockTimestamp
        };
    } catch (error) {
        const errorMsg = getErrorMessage(error);
        // Log errors without the full stack trace
        console.log(`${name}: ${errorMsg}`);
        return { isUp: false };
    }
}

async function sendNotification(message: string) {
    try {
        await axios.post(NTFY_URL, message, {
            headers: {
                'Content-Type': 'text/plain',
            },
        });
    } catch (error) {
        console.log('Failed to send notification');
    }
}

async function monitorRPC() {
    let leakedWasDown = true;
    let officialWasDown = true;
    let lastLeakedBlock = 0;
    let lastOfficialBlock = 0;
    
    console.log('🚀 Starting Abstract RPC monitoring...');
    await sendNotification('🚀 Starting Abstract RPC monitoring...');
    
    console.log(`Monitoring RPCs:`);
    console.log(`- Official: ${OFFICIAL_RPC_URL}`);
    console.log(`- Leaked: ${LEAKED_RPC_URL}\n`);

    while (true) {
        // Check both RPCs
        const [leakedStatus, officialStatus] = await Promise.all([
            checkRPCStatus(LEAKED_RPC_URL, 'Leaked RPC'),
            checkRPCStatus(OFFICIAL_RPC_URL, 'Official RPC')
        ]);
        
        // Handle leaked RPC status changes
        if (leakedStatus.isUp && leakedWasDown) {
            const msg = `🎉 Leaked RPC is back online! Block: ${leakedStatus.blockNumber}`;
            console.log(`\n${msg}`);
            await sendNotification(msg);
            leakedWasDown = false;
        } else if (!leakedStatus.isUp && !leakedWasDown) {
            console.log('\nLeaked RPC is down');
            leakedWasDown = true;
        }

        // Handle official RPC status changes
        if (officialStatus.isUp && officialWasDown) {
            const msg = `🌟 Official RPC is back online! Block: ${officialStatus.blockNumber}`;
            console.log(`\n${msg}`);
            await sendNotification(msg);
            officialWasDown = false;
        } else if (!officialStatus.isUp && !officialWasDown) {
            console.log('\nOfficial RPC is down');
            officialWasDown = true;
        }

        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\nShutting down monitor...');
    await sendNotification('⏹️ RPC monitoring stopped');
    process.exit(0);
});

monitorRPC().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 