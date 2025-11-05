const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Baca list server dari file
const serverList = JSON.parse(fs.readFileSync('server-list.json', 'utf8'));

function updateServer(serverName, url) {
    return new Promise((resolve) => {
        const lib = url.startsWith('https') ? https : http;
        
        lib.get(url, { timeout: 5000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    let players = [];
                    
                    // Auto detect format
                    const json = JSON.parse(data);
                    if (json.Data && json.Data.players) {
                        players = json.Data.players; // Format Kitarp
                    } else if (Array.isArray(json)) {
                        players = json; // Format langsung players.json
                    } else if (json.players) {
                        players = json.players; // Format lain
                    }
                    
                    const result = {
                        last_update: new Date().toISOString(),
                        players: players
                    };
                    
                    const filePath = path.join('servers', serverName + '.json');
                    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
                    
                    console.log(`✅ ${serverName}: ${players.length} players`);
                    resolve(true);
                } catch (e) {
                    console.log(`❌ ${serverName}: ${e.message}`);
                    resolve(false);
                }
            });
        }).on('error', () => {
            console.log(`❌ ${serverName}: connection error`);
            resolve(false);
        });
    });
}

async function main() {
    console.log('🔄 Updating...', new Date().toLocaleTimeString());
    
    for (const [name, url] of Object.entries(serverList)) {
        await updateServer(name, url);
    }
    
    console.log('✅ Done!');
}

main();