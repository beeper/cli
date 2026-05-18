const iconSource = String.raw`
           @@@@@@@@@@@@@@@@@@@@@@@@@@
       @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
     @@@@@@@@@                    @@@@@@@@@
   @@@@@@@                            @@@@@@@
  @@@@@@                                @@@@@@
 @@@@@                                    @@@@@
@@@@@                                      @@@@@
@@@@@                                      @@@@@
@@@@@                                      @@@@@
@@@@@                                      @@@@@
@@@@@                                      @@@@
 @@@@@                                    @@@@@
  @@@@@@                                @@@@@@
   @@@@@@@                            @@@@@@@
     @@@@@@@@@@@                    @@@@@@@
        @@@@@@@@@@@@@@            @@@@@@@
        @@@@@@@@@@@@@@          @@@@@@@@
        @@@@@@@@@@@@@@        @@@@@@@@@@@@@
        @@@@@@@@@@@@@       @@@@@@@@@@@@@@@@@
        @@@@@@@@@@@@@     @@@@@@@@@@@@@@@@@@@@
        @@@@@@@@@@@@    @@@@@@@@@@@@@@@@@@@@@@@
        @@@@@@@@@@@@  @@@@@@@@@@@@@@@@@@@@@@@@@@
        @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
        @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
        @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
        @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
        @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
        @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
        @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
        @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
`

const wordmarkSource = String.raw`
@@@@@@@   @@@@@@@@  @@@@@@@@  @@@@@@@   @@@@@@@@  @@@@@@@
@@    @@  @@        @@        @@    @@  @@        @@    @@
@@@@@@@   @@@@@@    @@@@@@    @@@@@@@   @@@@@@    @@@@@@@
@@    @@  @@        @@        @@        @@        @@  @@
@@    @@  @@        @@        @@        @@        @@   @@
@@@@@@@   @@@@@@@@  @@@@@@@@  @@        @@@@@@@@  @@    @@
`

const normalize = source => {
  const lines = source.trim().split('\n')
  const width = Math.max(...lines.map(line => line.length))
  return lines.map(line => line.padEnd(width, ' '))
}

const scale = (source, width, height) => {
  const lines = normalize(source)
  const sourceHeight = lines.length
  const sourceWidth = lines[0]?.length ?? 0
  const result = []

  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.min(sourceHeight - 1, Math.floor(((y + 0.5) / height) * sourceHeight))
    let line = ''

    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(sourceWidth - 1, Math.floor(((x + 0.5) / width) * sourceWidth))
      line += lines[sourceY]?.[sourceX] === '@' ? '@' : ' '
    }

    result.push(line)
  }

  return result
}

const combine = (icon, wordmark, gap) => {
  const iconWidth = icon[0]?.length ?? 0
  const height = Math.max(icon.length, wordmark.length)
  const wordTop = Math.max(0, Math.floor((height - wordmark.length) / 2))
  const result = []

  for (let y = 0; y < height; y += 1) {
    const iconLine = icon[y] ?? ' '.repeat(iconWidth)
    const wordLine = wordmark[y - wordTop] ?? ''
    result.push(`${iconLine}${' '.repeat(gap)}${wordLine}`.trimEnd())
  }

  return result
}

export function renderStartupLogo(columns = process.stdout.columns ?? 80) {
  const maxWidth = Math.max(36, columns - 2)
  const gap = maxWidth < 60 ? 2 : 4
  const iconWidth = Math.min(20, Math.max(14, Math.floor(maxWidth * 0.25)))
  const iconHeight = Math.max(8, Math.round(iconWidth * 0.55))
  const wordWidth = Math.max(20, maxWidth - iconWidth - gap)
  const wordHeight = 6

  const icon = scale(iconSource, iconWidth, iconHeight)
  const wordmark = scale(wordmarkSource, wordWidth, wordHeight)

  return combine(icon, wordmark, gap).join('\n')
}
