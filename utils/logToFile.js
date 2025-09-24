import fs from 'fs';

export function logToFile(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  console.log(line.trim());
  fs.appendFileSync('./logs.txt', line);
}