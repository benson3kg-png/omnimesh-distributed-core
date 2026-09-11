const url = 'http://localhost:4000/api/v3/omnimesh/webhook';
const count = 250;

async function fire(idx) {
    const payload = {
        entry: [{
            changes: [{
                value: {
                    messages: [{
                        from: `23324${Math.floor(1000000 + Math.random() * 9000000)}`,
                        text: { body: `RENEW ID_GH_NODE_${idx}` }
                    }]
                }
            }]
        }]
    };

    const t0 = performance.now();
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return { ok: res.ok, ms: performance.now() - t0 };
    } catch (err) {
        return { ok: false, ms: 0 };
    }
}

async function run() {
    process.stdout.write(`[TEST] Initiating execution loop for ${count} requests...\n`);
    const t0 = performance.now();
    
    const tasks = [];
    for (let i = 1; i <= count; i++) {
        tasks.push(fire(i));
    }

    const results = await Promise.all(tasks);
    const totalTime = (performance.now() - t0).toFixed(2);

    let passed = 0;
    let failed = 0;
    let sumMs = 0;

    results.forEach(res => {
        if (res.ok) {
            passed++;
            sumMs += res.ms;
        } else {
            failed++;
        }
    });

    const avgMs = passed > 0 ? (sumMs / passed).toFixed(2) : 0;

    process.stdout.write('\n----------------------------------------\n');
    process.stdout.write('PERFORMANCE MATRIX REPORT\n');
    process.stdout.write('----------------------------------------\n');
    process.stdout.write(`Requests : ${count}\n`);
    process.stdout.write(`Passed   : ${passed}\n`);
    process.stdout.write(`Failed   : ${failed}\n`);
    process.stdout.write(`Avg Time : ${avgMs} ms\n`);
    process.stdout.write(`Total    : ${totalTime} ms\n`);
    process.stdout.write('----------------------------------------\n\n');
}

run();
