export interface TarEntry {
  name: string;
  data: Uint8Array;
}

export function createTarBlob(entries: TarEntry[]): Blob {
  const blocks: Uint8Array[] = [];
  const encoder = new TextEncoder();

  function writeString(buf: Uint8Array, offset: number, str: string, length: number): void {
    const bytes = encoder.encode(str);
    const size = Math.min(bytes.length, length);
    for (let i = 0; i < size; i++) buf[offset + i] = bytes[i];
    for (let i = size; i < length; i++) buf[offset + i] = 0;
  }

  function writeOctal(buf: Uint8Array, offset: number, value: number, length: number): void {
    const str = value.toString(8).padStart(length - 1, '0');
    writeString(buf, offset, str, length - 1);
    buf[offset + length - 1] = 0;
  }

  function computeChecksum(header: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < 512; i++) sum += header[i];
    return sum;
  }

  function splitName(name: string): { name: string; prefix: string } {
    if (name.length <= 100) return { name, prefix: '' };
    const idx = name.lastIndexOf('/');
    if (idx > 0 && idx < 156 && name.length - idx - 1 <= 100) {
      return { name: name.slice(idx + 1), prefix: name.slice(0, idx) };
    }
    return { name: name.slice(-100), prefix: '' };
  }

  const mtime = Math.floor(Date.now() / 1000);

  for (const entry of entries) {
    const { name, data } = entry;
    const header = new Uint8Array(512);
    header.fill(0);

    const parts = splitName(name);
    writeString(header, 0, parts.name, 100);
    writeString(header, 100, '0000777', 8);
    writeString(header, 108, '0000000', 8);
    writeString(header, 116, '0000000', 8);
    writeOctal(header, 124, data.length, 12);
    writeOctal(header, 136, mtime, 12);
    for (let i = 148; i < 156; i++) header[i] = 0x20;
    header[156] = 0x30;
    writeString(header, 157, '', 100);
    writeString(header, 257, 'ustar', 6);
    header[262] = 0x30;
    header[263] = 0x30;
    writeString(header, 265, 'user', 32);
    writeString(header, 297, 'group', 32);
    writeString(header, 329, '', 8);
    writeString(header, 337, '', 8);
    writeString(header, 345, parts.prefix, 155);

    const checksum = computeChecksum(header);
    const chkStr = checksum.toString(8).padStart(6, '0');
    writeString(header, 148, chkStr, 6);
    header[154] = 0;
    header[155] = 0x20;

    blocks.push(header);
    blocks.push(data);
    const pad = (512 - (data.length % 512)) % 512;
    if (pad) blocks.push(new Uint8Array(pad));
  }

  blocks.push(new Uint8Array(512));
  blocks.push(new Uint8Array(512));
  const arrayBuffers = blocks.map((b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  return new Blob(arrayBuffers, { type: 'application/x-tar' });
}
