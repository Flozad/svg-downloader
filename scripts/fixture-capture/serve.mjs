// Serves the real extension/content.js with permissive CORS so a page probe can
// fetch + eval the shipped source instead of a hand-ported copy.

import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';

const ROOT = new URL('../../', import.meta.url).pathname;

// /capture writes a file into test/fixtures/, and those fixtures are what
// renders.test.js trusts. The documented capture flow deliberately sends
// text/plain to dodge the CORS preflight, which means *any* page open in the
// browser could otherwise POST here and plant a fixture. A per-run token in the
// path keeps that property (still no preflight) while making the endpoint
// unguessable. Printed at startup; paste it into the console snippet.
const TOKEN = randomUUID();

createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    if (req.url.startsWith('/content.js')) {
      const src = await readFile(`${ROOT}/extension/content.js`, 'utf8');
      res.setHeader('Content-Type', 'text/javascript');
      res.end(src);
      return;
    }
    if (req.method === 'POST' && req.url.startsWith('/capture')) {
      if (req.url !== `/capture/${TOKEN}`) {
        res.statusCode = 403;
        res.end('bad or missing capture token');
        return;
      }
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = Buffer.concat(chunks).toString('utf8');
      const { name, items } = JSON.parse(body);
      const slug = String(name)
        .replace(/[^a-z0-9]+/gi, '-')
        .toLowerCase();
      await writeFile(`${ROOT}/test/fixtures/${slug}.json`, JSON.stringify(items, null, 2));
      res.end(`wrote ${items.length} items to ${slug}.json`);
      return;
    }
    if (req.url.startsWith('/probe.js')) {
      const src = await readFile(new URL('./probe.js', import.meta.url), 'utf8');
      res.setHeader('Content-Type', 'text/javascript');
      res.end(src);
      return;
    }
    res.statusCode = 404;
    res.end('not found');
  } catch (err) {
    res.statusCode = 500;
    res.end(String(err));
  }
  // Loopback only. The harness is driven from a devtools console on the same
  // machine and has no reason to be reachable from the network.
}).listen(8931, '127.0.0.1', () => {
  console.log('probe server on http://localhost:8931');
  console.log(`capture endpoint: /capture/${TOKEN}`);
});
