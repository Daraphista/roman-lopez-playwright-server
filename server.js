// server.js
import express from 'express';
import { getQueue } from './utils/queues.js';
import { logEvent } from './utils/logger.js';

const app = express();
app.use(express.json());

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.post('/run', async (req, res) => {
  const scriptName = req.body.script;
  if (!scriptName) return res.status(400).json({ error: 'Missing script name' });

  try {
    const scriptPath = `./scripts/${scriptName}`;
    const { default: runScript } = await import(scriptPath);

    const queue = getQueue(scriptName);

    queue.enqueue(async () => {
      const startTime = Date.now();
      logEvent({
        automation: scriptName,
        action: 'start',
        status: 'in-progress',
        startTime,
        metadata: { input: req.body.input }
      });

      try {
        const result = await runScript(req.body.input || {});

        logEvent({
          automation: scriptName,
          action: 'run',
          status: 'success',
          startTime,
          endTime: Date.now(),
          metadata: { result }
        });

        res.json({ success: true, result });
      } catch (err) {
        console.error(err);

        logEvent({
          automation: scriptName,
          action: 'run',
          status: 'failure',
          startTime,
          endTime: Date.now(),
          metadata: { error: err.message }
        });

        res.status(500).json({ error: err.message });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('🚀 Automation server running on port 3000'));
