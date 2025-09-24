// utils/queues.js
import { TaskQueue } from './queue.js';

const queues = {};

export function getQueue(scriptName) {
  if (!queues[scriptName]) {
    queues[scriptName] = new TaskQueue();
  }
  return queues[scriptName];
}
