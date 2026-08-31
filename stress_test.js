// OMNIMESH CONCURRENT LOAD SIMULATOR
const TARGET_WEBHOOK_URL = 'http://localhost:4000/api/v3/omnimesh/webhook';

// Configuration parameters for the traffic simulation blast
const CONCURRENT_REQUESTS = 250; 

async function fireSimulatedPacket(nodeIndex) {
    const mockPayload = {
        entry: [{
            changes: [{
                value: {
                    messages: [{
                        from: `23324${Math.floor(1000000 + Math.random() * 9000000)}`, // Randomized Ghana phone node token
                        text: {
                            body: `RENEW ID_GH_NODE_${nodeIndex}`
                        }
                    }]
                }
            }]
        }]
    };

    const startTime = performance.now();
    try {
        const response = await fetch(TARGET_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mockPayload)
        });
        
        const duration = (performance.now() - startTime).toFixed(2);
        return { status: response.status, success: response.ok, time: duration };
    } catch (error) {
        return { status: 'CRASHED', success: false, error: error.message };
    }
}

async function runHighVelocityStressTest() {
    console.log(`🚀 [INITIALIZING TRAFFIC INJECTION]: Blasting ${CONCURRENT_REQUESTS} parallel WhatsApp packets...`);
    
    const startExecutionTime = performance.now();
    
    // Allocate all data requests into an instant execution array loop
    const trafficPromises = [];
    for (let i = 1; i <= CONCURRENT_REQUESTS; i++) {
        trafficPromises.push(fireSimulatedPacket(i));
    }

    // Resolve all promises concurrently down the network channel
    const results = await Promise.all(trafficPromises);
    const totalExecutionTime = (performance.now() - startExecutionTime).toFixed(2);

    // Compute load metrics and network bottlenecks
    let successCount = 0;
    let failedCount = 0;
    let totalLatencies = 0;

    results.forEach(res => {
        if (res.success) {
            successCount++;
            totalLatencies += Number(res.time);
        } else {
            failedCount++;
        }
    });

    const averageLatency = (totalLatencies / successCount).toFixed(2);

    console.log('\n======================================================');
    console.log('📊 [STRESS TEST REPORT METRICS]');
    console.log('======================================================');
    console.log(`Total Concurrent Ingress Packets : ${CONCURRENT_REQUESTS}`);
    console.log(`Successfully Committed State     : ${successCount}`);
    console.log(`Failed / Dropped Packets         : ${failedCount}`);
    console.log(`Average Processing Latency       : ${averageLatency} ms`);
    console.log(`Total Transmission Loop Time     : ${totalExecutionTime} ms`);
    console.log('======================================================\n');
}

runHighVelocityStressTest();
