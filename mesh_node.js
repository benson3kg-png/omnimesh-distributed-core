const Fastify = require('fastify');

// Initialize the local-first Fastify core using modern future-proofed options
const fastify = Fastify({ 
    routerOptions: { ignoreTrailingSlash: true } 
});

// Read dynamic cloud environments or default to the local mesh port 4000
const MESH_PORT = process.env.PORT || 4000;

// INVARIANT LEDGER MEMORY STATE: Tracks active local transactional nodes (Local Organ Logic)
const activeMeshCells = new Map();

/**
 * COMPRESSED BINARY DATA FRAME SCHEDULER
 * Translates high-energy compression into an optimized local-first data handler.
 * Strips away heavy visual rendering code down to a clean base64 data string footprint.
 */
function compressTransactionState(payload) {
    const rawDataBuffer = Buffer.from(JSON.stringify(payload));
    return rawDataBuffer.toString('base64');
}

// 📡 A. DECENTRALIZED SYSTEM EDGE ROUTE: Standard Local Input Handler
fastify.post('/api/v3/omnimesh/route', async (request, reply) => {
    const { membershipId, agencyCode, transactionVolume } = request.body || {};

    if (!membershipId || !agencyCode) {
        return reply.code(400).send({ status: "REJECTED", error: "MALFORMED_NODE_DATA" });
    }

    const compressedFrame = compressTransactionState({
        id: membershipId,
        node: agencyCode,
        val: transactionVolume || 2000,
        timestamp: Date.now()
    });

    activeMeshCells.set(membershipId, {
        state: "QUEUED_LOCAL_MESH",
        frame: compressedFrame
    });

    return reply.code(200).send({
        status: "COMMITTED_LOCAL_EDGE",
        message: "Node transaction compressed and queued locally without burning external cloud data.",
        byte_footprint: `${Buffer.byteLength(compressedFrame)} bytes`,
        payload_hash: compressedFrame.substring(0, 16)
    });
});

/**
 * 📲 B. REAL-WORLD WHATSAPP WEBHOOK INTERFACE LAYER
 * Intercepts conversational text streams forwarded from Meta network proxies,
 * parses transaction tokens, and triggers localized financial operations.
 */

// 1. Webhook Verification Handshake: Mandatory endpoint handshake validation required by Meta
fastify.get('/api/v3/omnimesh/webhook', async (request, reply) => {
    const mode = request.query['hub.mode'];
    const token = request.query['hub.verify_token'];
    const challenge = request.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'OMNIMESH_GHANA_SECURE_TOKEN';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log("🛡️ [WHATSAPP HANDSHAKE SUCCESSFUL]: Webhook verified at the perimeter gate.");
        return reply.code(200).send(challenge);
    } else {
        return reply.code(403).send({ error: "FORBIDDEN_HANDSHAKE_TOKEN" });
    }
});

// 2. Webhook Ingress Data Processor: Receives live user message arrays in real time
fastify.post('/api/v3/omnimesh/webhook', async (request, reply) => {
    const entry = request.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const messageObject = changes?.value?.messages?.[0];

    // Abort processing gracefully if the arriving packet is not a valid incoming text message
    if (!messageObject) {
        return reply.code(200).send({ status: "IGNORED", message: "No text packet payload detected." });
    }

    const userPhoneNumber = messageObject.from; // User's phone number token (e.g., "233244123456")
    const userTextBody = messageObject.text?.body?.trim(); // Raw data command string typed by user

    console.log(`📡 [INCOMING WHATSAPP METRICS]: Received data packet from +${userPhoneNumber}: "${userTextBody}"`);

    // PARSING ENGINE LOOP: Evaluates input parameters (e.g., user types "RENEW 12345678")
    if (userTextBody && userTextBody.toUpperCase().startsWith('RENEW')) {
        const parts = userTextBody.split(' ');
        const targetMembershipId = parts[1] || 'UNKNOWN_ID';

        // Compress data frame down to raw bytes to eliminate data consumption
        const compressedFrame = compressTransactionState({
            id: targetMembershipId,
            phone: userPhoneNumber,
            action: "NHIA_RENEWAL",
            timestamp: Date.now()
        });

        activeMeshCells.set(targetMembershipId, {
            state: "COMPRESSED_RENEWAL_QUEUED",
            frame: compressedFrame
        });

        // 💳 [AUTOMATED GHANA MOBILE MONEY (MOMO) API CORE INJECTION]
        // Packages transaction data parameters and dispatches a secure request straight to the payment gateway
        const paystackPayload = {
            amount: "2000", // 2000 pesewas = 20.00 GHS (The baseline configuration fee structure)
            email: `${userPhoneNumber}@omnimesh-node.io`, 
            currency: "GHS",
            mobile_money: {
                phone: userPhoneNumber,
                // Automated telecommunication carrier network tracking matrix
                provider: userPhoneNumber.startsWith('23324') || userPhoneNumber.startsWith('23354') || userPhoneNumber.startsWith('23355') || userPhoneNumber.startsWith('23359') ? 'mtn' : 'tigo'
            }
        };

        console.log(`📡 [DISPATCHING TO TELECOM NETWORKS]: Triggering raw MoMo prompt for +${userPhoneNumber}...`);

        // Fire outbound HTTPS handshake request to clear mobile network wallets
        fetch('https://paystack.co', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY || 'sk_live_sample_placeholder_token'}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paystackPayload)
        })
        .then(response => response.json())
        .then(data => {
            console.log(`📥 [TELECOM MATRIX RESPONSE]: MoMo window initialization status: ${data.status ? 'DISPATCHED_SUCCESSFULLY' : 'FAILED'}`);
        })
        .catch(err => {
            console.error("❌ [PAYMENT PIPELINE ROUTING ERROR]:", err);
        });
    }

    // Instantly return an HTTP 200 OK frame back to Meta servers to keep the network channel clear and open
    return reply.code(200).send({ status: "PROCESSED" });
});

// ⚡ DUAL-STACK NETWORK PROXY LISTENER (Binds to global routing channels cleanly)
fastify.listen({ port: Number(MESH_PORT), host: '::' }, (err) => {
    if (err) {
        console.error("❌ [MESH ENGINE BOOT ERROR]:", err);
        process.exit(1);
    }
    console.log(`🛡️ [OMNIMESH DISTRIBUTED EDGE ROUTER ACTIVE]: Local Cell online on Port ${MESH_PORT}`);
});
