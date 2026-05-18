# rpc

Read when: scripting many CLI commands from a long-lived process (an agent, a
web server) without spawning a new node process per command.

## Command

```sh
beeper rpc
```

Reads newline-delimited JSON requests on stdin and writes one response line
per request on stdout.

## Request shape

```json
{"id":1,"command":"chats list --json"}
{"id":2,"args":["send","text","--to","Family","--message","ack","--json"]}
```

Each request must include one of:

- `command` — a single string parsed with shell-like quoting
- `args`    — an explicit `argv` array
- `argv`    — alias for `args`

`id` is echoed back in the response (string, number, or null).

## Response shape

```json
{"id":1,"ok":true,"code":0,"signal":null,"stdout":"…","stderr":""}
{"id":2,"ok":false,"error":"…"}
```

`ok` mirrors `code === 0`. `stdout`/`stderr` capture the child command's output.

## Notes

- Nesting `rpc` or `shell` is rejected to avoid recursion.
- `--json` on inner commands produces the standard envelope inside `stdout`.
- Exit codes use the same table as direct CLI invocation; see [exit codes](../README.md#exit-codes).

## Examples

```sh
printf '{"id":1,"command":"auth status --json"}\n' | beeper rpc
printf '{"id":1,"args":["chats","list","--json"]}\n{"id":2,"args":["status","--json"]}\n' | beeper rpc
```
