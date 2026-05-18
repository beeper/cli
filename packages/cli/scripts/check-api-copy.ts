#!/usr/bin/env bun
import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join, resolve} from 'node:path';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const {apiCopy} = await import('../dist/lib/copy.js');

const checks = [
  ['accounts.list', 'resources/accounts/accounts.d.ts', 'list'],
  ['assets.download', 'resources/assets.d.ts', 'download'],
  ['assets.upload', 'resources/assets.d.ts', 'upload'],
  ['chats.archive', 'resources/chats/chats.d.ts', 'archive'],
  ['chats.create', 'resources/chats/chats.d.ts', 'create'],
  ['chats.list', 'resources/chats/chats.d.ts', 'list'],
  ['chats.markRead', 'resources/chats/chats.d.ts', 'markRead'],
  ['chats.markUnread', 'resources/chats/chats.d.ts', 'markUnread'],
  ['chats.notifyAnyway', 'resources/chats/chats.d.ts', 'notifyAnyway'],
  ['chats.retrieve', 'resources/chats/chats.d.ts', 'retrieve'],
  ['chats.search', 'resources/chats/chats.d.ts', 'search'],
  ['chats.start', 'resources/chats/chats.d.ts', 'start'],
  ['contacts.search', 'resources/accounts/contacts.d.ts', 'search'],
  ['messages.delete', 'resources/messages.d.ts', 'delete'],
  ['messages.list', 'resources/messages.d.ts', 'list'],
  ['messages.retrieve', 'resources/messages.d.ts', 'retrieve'],
  ['messages.search', 'resources/messages.d.ts', 'search'],
  ['messages.send', 'resources/messages.d.ts', 'send'],
  ['messages.update', 'resources/messages.d.ts', 'update'],
  ['reactions.add', 'resources/chats/messages/reactions.d.ts', 'add'],
  ['reactions.delete', 'resources/chats/messages/reactions.d.ts', 'delete'],
  ['reminders.create', 'resources/chats/reminders.d.ts', 'create'],
  ['reminders.delete', 'resources/chats/reminders.d.ts', 'delete'],
];

const failures = [];

for (const [copyPath, sdkPath, method] of checks) {
  const expected = getPath(apiCopy, copyPath);
  const actual = await sdkMethodDescription(sdkPath, method);
  if (expected !== actual) {
    failures.push(`${copyPath}\n  expected: ${expected}\n  actual:   ${actual}`);
  }
}

if (failures.length > 0) {
  console.error(`API copy drifted from @beeper/desktop-api:\n\n${failures.join('\n\n')}`);
  process.exit(1);
}

console.log(`api-copy: ${checks.length} SDK descriptions verified`);

function getPath(object, path) {
  return path.split('.').reduce((value, key) => value?.[key], object);
}

async function sdkMethodDescription(relativePath, method) {
  const packageRoot = join(root, 'node_modules', '@beeper', 'desktop-api');
  const sourcePath = join(packageRoot, relativePath);
  const source = await readFile(existsSync(sourcePath) ? sourcePath : join(packageRoot, 'dist', relativePath), 'utf8');
  const methodMatch = source.match(new RegExp(String.raw`^\s*${method}\(`, 'm'));
  const methodIndex = methodMatch?.index ?? -1;
  if (methodIndex === -1) throw new Error(`Could not find SDK method ${relativePath}#${method}`);

  const comments = [...source.slice(0, methodIndex).matchAll(/\/\*\*([\s\S]*?)\*\//g)];
  const match = comments.at(-1);
  if (!match) throw new Error(`Could not find SDK docs for ${relativePath}#${method}`);

  const lines = match[1]
    .split('\n')
    .map(line => line.replace(/^\s*\*\s?/, '').trimEnd())

  const exampleIndex = lines.findIndex(line => line.startsWith('@example'));
  return lines
    .slice(0, exampleIndex === -1 ? undefined : exampleIndex)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
