import crc from 'crc'
import BufferPut from 'bufferput'

export type DATA_TYPES = 'INT' | 'UINT'

/**
 * Slice header, bytes count and crc. Return buffer only with data
 * @param {Buffer} buffer
 */
export function getDataBuffer(buffer: Buffer) {
  return buffer.slice(3, buffer.length - 2)
}

/**
 * Parse function 01 response packet (read coils)
 * @param {Buffer} buffer
 * @param {number} length
 * @returns {number[]}
 */
export function parseFc01Packet(buffer: Buffer, length: number) {
  const results = []

  let idx
  for (let i = 0; i < length; i++) {
    idx = i / 8
    results.push((buffer[idx] >> i % 8) & 1)
  }

  return results
}

/**
 * Parse function 03 response packet (read holding registers)
 * @param {Buffer} buffer
 * @param {number} [dataType]
 * @returns {number[]}
 */
export function parseFc03Packet(buffer: Buffer, dataType: DATA_TYPES) {
  const results = []

  for (let i = 0; i < buffer.length; i += 2) {
    results.push(readDataFromBuffer(buffer, i, dataType))
  }

  return results
}

/**
 * Returns new buffer signed with CRC
 * @param {Buffer} buf
 * @returns {Buffer}
 */
export function addCrc(buf: Buffer) {
  return new BufferPut().put(buf).word16le(crc.crc16modbus(buf)).buffer()
}

/**
 *
 * @param {Buffer} buffer
 * @returns boolean
 */
export function checkCrc(buffer: Buffer) {
  const pdu = buffer.slice(0, buffer.length - 2)
  return buffer.equals(addCrc(pdu))
}

/**
 *
 * @param {Buffer} buffer
 * @param {int} offset
 * @param {int} [dataType]
 * @returns {number | string}
 */
function readDataFromBuffer(buffer: Buffer, offset: number, dataType: DATA_TYPES) {
  switch (dataType) {
    case 'UINT':
      return buffer.readUInt16BE(offset)
    default:
      return buffer.readInt16BE(offset)
  }
}
