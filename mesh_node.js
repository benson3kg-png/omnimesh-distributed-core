const http = require('http');
const crypto = require('crypto');

const port = process.env.PORT || 4000;
const secret = process.env.PAYSTACK_SECRET_KEY || 'sk_live_sample_placeholder_token';
const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'OMNIMESH_GHANA_SECURE_TOKEN';

const cache = new Map();

function pack(data) {
    return Buffer.from(JSON.stringify(data)).toString('base64');
}

function processMomoPayment(phone, amt, provider) {
    const payload = JSON.stringify({
        amount: amt,
        email: `${phone}@omnimesh-node.io`,
        currency: "GHS",
        mobile_money: { phone: phone, provider: provider }
    });

    const req = http.request({
        hostname: 'api.paystack.co',
        path: '/transaction/initialize',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${secret}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    }, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
            try {
                const out = JSON.parse(body);
                process.stdout.write(`[PAYMENT] Gateway status: ${out.status ? 'DISPATCHED' : 'FAILED'}\n`);
            } catch (ex) {
                process.stderr.write(`[ERR] Paystack parse err: ${ex.message}\n`);
            }
        });
    });

    req.on('error', err => process.stderr.write(`[ERR] Gateway network fault: ${err.message}\n`););
    req.write(payload);
    req.end();
}

const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const u = new URL(req.url, `http://${req.headers.host}`);

    // Ingress Endpoint 1: Edge Router Data Ingestion Channel
    if (req.method === 'POST' && u.pathname === '/api/v3/omnimesh/route') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (!data.membershipId || !data.agencyCode) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: "BAD_PARAMS" }));
                }

                const seal = pack({
                    id: data.membershipId,
                    node: data.agencyCode,
                    val: data.transactionVolume || 2000,
                    ts: Date.now()
                });

                cache.set(data.membershipId, { status: "QUEUED", frame: seal });
                
                res.writeHead(200);
                res.end(JSON.stringify({
                    status: "COMMITTED",
                    sz: `${Buffer.byteLength(seal)} bytes`,
                    hash: seal.substring(0, 16)
                }));
                body = null;
            } catch (ex) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: "ERR_PARSE" }));
            }
        });
    }

    // Ingress Endpoint 2: Verification Handshake Channel
    else if (req.method === 'GET' && u.pathname === '/api/v3/omnimesh/webhook') {
        const mode = u.searchParams.get('hub.mode');
        const token = u.searchParams.get('hub.verify_token');
        const challenge = u.searchParams.get('hub.challenge');

        if (mode === 'subscribe' && token === verifyToken) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            return res.end(challenge);
        }
        res.writeHead(403);
        res.end(JSON.stringify({ error: "FORBIDDEN" }));
    }

    // Ingress Endpoint 3: Webhook Data Processing Conduit
    else if (req.method === 'POST' && u.pathname === '/api/v3/omnimesh/webhook') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const msg = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

                if (!msg) {
                    res.writeHead(200);
                    return res.end(JSON.stringify({ status: "IGNORED" }));
                }

                const phone = msg.from;
                const cmd = msg.text?.body?.trim() || '';

                process.stdout.write(`[INGRESS] Data payload from +${phone}: "${cmd}"\n`);

                if (cmd.toUpperCase().startsWith('RENEW')) {
                    const id = cmd.split(' ')[1] || 'UNKNOWN_ID';
                    const seal = pack({ id: id, phone: phone, action: "NHIA_RENEWAL", ts: Date.now() });

                    cache.set(id, { status: "QUEUED_RENEWAL", frame: seal });

                    const isMtn = phone.startsWith('23324') || phone.startsWith('23354') || phone.startsWith('23355') || phone.startsWith('23359');
                    const provider = isMtn ? 'mtn' : 'tigo';

                    processMomoPayment(phone, "2000", provider);
                }

                res.writeHead(200);
                res.end(JSON.stringify({ status: "PROCESSED" }));
                body = null;
            } catch (ex) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: "ERR_WEBHOOK" }));
            }
        });
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "NOT_FOUND" }));
    }
});

server.listen(port, '::', () => {
    process.stdout.write(`Server initialized on Port ${port}\n`);
});
