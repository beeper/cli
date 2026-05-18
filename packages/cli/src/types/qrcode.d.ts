declare module 'qrcode' {
  export type TerminalQRCodeOptions = {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
    small?: boolean
    type: 'terminal'
  }

  const QRCode: {
    toString(data: string, options: TerminalQRCodeOptions): Promise<string>
  }

  export default QRCode
}
