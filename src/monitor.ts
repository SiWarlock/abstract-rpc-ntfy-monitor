import { ethers } from 'ethers';
import axios from 'axios';

const RPC_URL = 'https://abstract.leakedrpc.com';
const NTFY_URL = 'https://ntfy.sh/abs';
const CHECK_INTERVAL = 1000; // Check every second

async function checkRPCStatus(): Promise<boolean> {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        
        // 1. Check block number
        const blockNumber = await provider.getBlockNumber();
        console.log('Block number:', blockNumber);
        
        // 2. Get latest block details
        const latestBlock = await provider.getBlock(blockNumber);
        if (!latestBlock) {
            console.log('Failed to get latest block details');
            return false;
        }
        

        // 5. Check if block timestamp is recent (within last 5 minutes)
        const blockTimestamp = Number(latestBlock.timestamp) * 1000; // Convert to milliseconds
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (now - blockTimestamp > fiveMinutes) {
            console.log('Chain appears stale - last block too old');
            return false;
        }

        console.log('All RPC checks passed successfully');
        return true;
    } catch (error) {
        console.error('RPC check failed:', error);
        return false;
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
    let wasDown = true; // Initialize as true to send notification on first recovery
    await sendNotification('Starting RPC monitoring...');
    console.log('Starting RPC monitoring...');

    while (true) {
        const isUp = await checkRPCStatus();
        
        if (isUp && wasDown) {
            console.log('RPC is back online!');
            await sendNotification('🎉 RPC is back online!');
            wasDown = false;
        } else if (!isUp) {
            console.log('RPC is down');
            wasDown = true;
        }

        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
}

monitorRPC().catch(console.error); 