import { ethers } from 'ethers';
import axios from 'axios';

const LEAKED_RPC_URL = 'https://abstract.leakedrpc.com';
const OFFICIAL_RPC_URL = 'https://api.abs.xyz';
const MAINNET_RPC_URL = 'https://api.mainnet.abs.xyz';
const ROOT_RPC_URL = 'https://abs.xyz';
const BLAST_RPC_URL = 'https://abstract-mainnet.public.blastapi.io';
const NTFY_URL = 'https://ntfy.sh/abs';
const CHECK_INTERVAL = 1000; // Check every second

interface RPCStatus {
    isUp: boolean;
    blockNumber?: number;
    timestamp?: number;
}

type RPCUrls = typeof LEAKED_RPC_URL | typeof OFFICIAL_RPC_URL | typeof MAINNET_RPC_URL | typeof ROOT_RPC_URL | typeof BLAST_RPC_URL;

// Track if we've shown the network detection message for each RPC
const networkDetectionShown: Record<RPCUrls, boolean> = {
    [LEAKED_RPC_URL]: false,
    [OFFICIAL_RPC_URL]: false,
    [MAINNET_RPC_URL]: false,
    [ROOT_RPC_URL]: false,
    [BLAST_RPC_URL]: false
};

function getErrorMessage(error: any, url: RPCUrls): string {
    if (error.code === 'ENOTFOUND') return 'DNS lookup failed';
    if (error.code === 'SERVER_ERROR') {
        if (error.shortMessage?.includes('502')) return '502 Bad Gateway';
        if (error.shortMessage?.includes('301')) return 'URL has moved - needs updated RPC path';
        return error.shortMessage || 'Server error';
    }
    if (error.message?.includes('failed to detect network')) {
        // Only show network detection message once per RPC
        if (!networkDetectionShown[url]) {
            networkDetectionShown[url] = true;
            return 'Network detection failed - will keep retrying';
        }
        return '';
    }
    return 'Connection failed';
}

async function checkRPCStatus(url: RPCUrls, name: string): Promise<RPCStatus> {
    try {
        const provider = new ethers.JsonRpcProvider(url, undefined, {
            staticNetwork: true, // Prevent automatic network detection and retries
            polling: true, // Enable polling mode
            pollingInterval: 1000, // Match our check interval
            batchMaxCount: 1 // Minimize concurrent requests
        });
        
        // Reset the network detection message flag on successful connection
        networkDetectionShown[url] = false;
        
        const blockNumber = await provider.getBlockNumber();
        
        const latestBlock = await provider.getBlock(blockNumber);
        if (!latestBlock) {
            return { isUp: false };
        }
        
        const blockTimestamp = Number(latestBlock.timestamp) * 1000;
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (now - blockTimestamp > fiveMinutes) {
            console.log(`${name}: Chain appears stale (last block: ${Math.floor((now - blockTimestamp) / 1000 / 60)} minutes old)`);
            return { isUp: false };
        }

        console.log(`${name}: Block #${blockNumber}`);
        return { 
            isUp: true,
            blockNumber,
            timestamp: blockTimestamp
        };
    } catch (error) {
        const errorMsg = getErrorMessage(error, url);
        if (errorMsg) {
            console.log(`${name}: ${errorMsg}`);
        }
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
    let mainnetWasDown = true;
    let rootWasDown = true;
    let blastWasDown = true;
    let lastLeakedBlock = 0;
    let lastOfficialBlock = 0;
    let lastMainnetBlock = 0;
    let lastRootBlock = 0;
    let lastBlastBlock = 0;
    
    console.log('🚀 Starting Abstract RPC monitoring...');
    await sendNotification('🚀 Starting Abstract RPC monitoring...');
    
    console.log(`\nMonitoring RPCs:`);
    console.log(`- Official: ${OFFICIAL_RPC_URL}`);
    console.log(`- Mainnet: ${MAINNET_RPC_URL}`);
    console.log(`- Root: ${ROOT_RPC_URL}`);
    console.log(`- Blast: ${BLAST_RPC_URL}`);
    console.log(`- Leaked: ${LEAKED_RPC_URL}\n`);

    while (true) {
        // Check all RPCs
        const [leakedStatus, officialStatus, mainnetStatus, rootStatus, blastStatus] = await Promise.all([
            checkRPCStatus(LEAKED_RPC_URL, 'Leaked RPC'),
            checkRPCStatus(OFFICIAL_RPC_URL, 'Official RPC'),
            checkRPCStatus(MAINNET_RPC_URL, 'Mainnet RPC'),
            checkRPCStatus(ROOT_RPC_URL, 'Root RPC'),
            checkRPCStatus(BLAST_RPC_URL, 'Blast RPC')
        ]);
        
        // Handle leaked RPC status changes
        if (leakedStatus.isUp && leakedWasDown) {
            const msg = `🎉 Leaked RPC is back online! Block: ${leakedStatus.blockNumber}`;
            console.log(`\n${msg}`);
            await sendNotification(msg);
            leakedWasDown = false;
        } else if (!leakedStatus.isUp && !leakedWasDown) {
            leakedWasDown = true;
        }

        // Handle official RPC status changes
        if (officialStatus.isUp && officialWasDown) {
            const msg = `🌟 Official RPC is back online! Block: ${officialStatus.blockNumber}`;
            console.log(`\n${msg}`);
            await sendNotification(msg);
            officialWasDown = false;
        } else if (!officialStatus.isUp && !officialWasDown) {
            officialWasDown = true;
        }

        // Handle mainnet RPC status changes
        if (mainnetStatus.isUp && mainnetWasDown) {
            const msg = `⭐ Mainnet RPC is back online! Block: ${mainnetStatus.blockNumber}`;
            console.log(`\n${msg}`);
            await sendNotification(msg);
            mainnetWasDown = false;
        } else if (!mainnetStatus.isUp && !mainnetWasDown) {
            mainnetWasDown = true;
        }

        // Handle root RPC status changes
        if (rootStatus.isUp && rootWasDown) {
            const msg = `💫 Root RPC is back online! Block: ${rootStatus.blockNumber}`;
            console.log(`\n${msg}`);
            await sendNotification(msg);
            rootWasDown = false;
        } else if (!rootStatus.isUp && !rootWasDown) {
            rootWasDown = true;
        }

        // Handle blast RPC status changes
        if (blastStatus.isUp && blastWasDown) {
            const msg = `⚡ Blast RPC is back online! Block: ${blastStatus.blockNumber}`;
            console.log(`\n${msg}`);
            await sendNotification(msg);
            blastWasDown = false;
        } else if (!blastStatus.isUp && !blastWasDown) {
            blastWasDown = true;
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