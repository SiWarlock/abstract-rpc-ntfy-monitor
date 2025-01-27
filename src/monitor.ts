import { ethers } from 'ethers';
import axios from 'axios';

const LEAKED_RPC_URL = 'https://abstract.leakedrpc.com';
const OFFICIAL_RPC_URL = 'https://api.mainnet.abs.xyz';
const NTFY_URL = 'https://ntfy.sh/abs';
const CHECK_INTERVAL = 1000; // Check every second

interface RPCStatus {
    isUp: boolean;
    blockNumber?: number;
    timestamp?: number;
}

async function checkRPCStatus(url: string, name: string): Promise<RPCStatus> {
    try {
        const provider = new ethers.JsonRpcProvider(url);
        
        // 1. Check block number
        const blockNumber = await provider.getBlockNumber();
        console.log(`${name} Block number:`, blockNumber);
        
        // 2. Get latest block details
        const latestBlock = await provider.getBlock(blockNumber);
        if (!latestBlock) {
            console.log(`${name}: Failed to get latest block details`);
            return { isUp: false };
        }
        
        // 3. Check if block timestamp is recent (within last 5 minutes)
        const blockTimestamp = Number(latestBlock.timestamp) * 1000; // Convert to milliseconds
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (now - blockTimestamp > fiveMinutes) {
            console.log(`${name}: Chain appears stale - last block too old`);
            return { isUp: false };
        }

        console.log(`${name}: All RPC checks passed successfully`);
        return { 
            isUp: true,
            blockNumber,
            timestamp: blockTimestamp
        };
    } catch (error) {
        console.error(`${name} RPC check failed:`, error);
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
        console.log('Notification sent successfully');
    } catch (error) {
        console.error('Failed to send notification:', error);
    }
}

async function monitorRPC() {
    let leakedWasDown = true;
    let officialWasDown = true;
    
    await sendNotification('🚀 Starting Abstract RPC monitoring...');
    console.log('Starting RPC monitoring...');

    while (true) {
        // Check both RPCs
        const [leakedStatus, officialStatus] = await Promise.all([
            checkRPCStatus(LEAKED_RPC_URL, 'Leaked RPC'),
            checkRPCStatus(OFFICIAL_RPC_URL, 'Official RPC')
        ]);
        
        // Handle leaked RPC status changes
        if (leakedStatus.isUp && leakedWasDown) {
            const msg = `🎉 Leaked RPC is back online! Block: ${leakedStatus.blockNumber}`;
            console.log(msg);
            await sendNotification(msg);
            leakedWasDown = false;
        } else if (!leakedStatus.isUp && !leakedWasDown) {
            console.log('Leaked RPC is down');
            leakedWasDown = true;
        }

        // Handle official RPC status changes
        if (officialStatus.isUp && officialWasDown) {
            const msg = `🌟 Official RPC is back online! Block: ${officialStatus.blockNumber}`;
            console.log(msg);
            await sendNotification(msg);
            officialWasDown = false;
        } else if (!officialStatus.isUp && !officialWasDown) {
            console.log('Official RPC is down');
            officialWasDown = true;
        }

        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
}

monitorRPC().catch(console.error); 