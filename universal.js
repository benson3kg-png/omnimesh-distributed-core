const http = require('http');
const crypto = require('crypto');

const CONFIG = {
    PORT: process.env.PORT || 4000,
    PATH: "/api/v4/omnimesh/ingress",
    KEY_HASH: crypto.createHash('sha256').update("SOVEREIGN_CONTRACT_VALIDATION_TOKEN").digest('hex'),
    TTL_MS: 3600000 
};

const registry = new Map();

function pack(nodeId, data) {
    return Buffer.from(JSON.stringify({
        id: crypto.randomBytes(16).toString('hex'),
        node: nodeId,
        hash: crypto.createHash('md5').update(data).digest('hex'),
        ts: Date.now()
    })).toString('base64');
}

const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    const u = new URL(req.url, `http://${req.headers.host}`);
    const token = req.headers['x-omnimesh-auth-token'];
    const h = crypto.createHash('sha256').update(token || '').digest('hex');

    if (u.pathname === CONFIG.PATH && req.method === 'POST') {
        if (h !== CONFIG.KEY_HASH) {
            res.writeHead(401);
            return res.end(JSON.stringify({ error: "AUTH_DENIED" }));
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const client = payload?.client_id;
                const cmd = payload?.command_body?.trim();

                if (!client || !cmd) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: "BAD_FRAME" }));
                }

                const seal = pack(client, cmd);
                registry.set(client, {
                    seal: seal,
                    status: "LOCKED",
                    sz: Buffer.byteLength(seal)
                });

                res.writeHead(200);
                res.end(JSON.stringify({ status: "PROCESSED", load: "500B" }));
                body = null;
            } catch (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: "ERR_CORE" }));
            }
        });
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "NOT_FOUND" }));
    }
});

setInterval(() => { registry.clear(); }, CONFIG.TTL_MS);

server.listen(CONFIG.PORT, '::');
