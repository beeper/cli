# media

Read when: downloading a media file attached to a message.

## Commands

```sh
beeper media download <url> [-o, --out DIR | -]
```

## Notes

- `<url>` accepts `mxc://` and `localmxc://` URLs (typically taken from a message payload).
- `--out` defaults to `.` (current directory); the file is named from the URL path.
- `--out -` streams the binary to stdout for piping.

## Examples

```sh
beeper media download mxc://beeper.com/abc --out ./downloads
beeper media download mxc://beeper.com/abc -o - > photo.jpg
```
