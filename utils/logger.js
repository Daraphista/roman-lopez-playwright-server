// utils/logger.js
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'logs.txt');

export function logEvent({
  automation,
  action,
  status,
  startTime,
  endTime,
  metadata = {}
}) {
  const durationMs = endTime && startTime
    ? `${(endTime - startTime) / 1000}s`
    : null;

  const entry = {
    timestamp: new Date().toISOString(),
    automation,
    action,
    status,
    startTime: startTime ? new Date(startTime).toISOString() : null,
    endTime: endTime ? new Date(endTime).toISOString() : null,
    duration: durationMs,
    metadata
  };

  const line = JSON.stringify(entry) + '\n';

  console.log(
    `[${entry.timestamp}] ${automation}:${action} → ${status} (${durationMs || 'in-progress'})`
  );
  fs.appendFileSync(LOG_FILE, line);
}

// Simple helper for custom logs (no strict schema)
export function logMessage(automation, message, metadata = {}) {
  logEvent({
    automation,
    action: 'custom',
    status: 'info',
    metadata: { message, ...metadata }
  });
}
