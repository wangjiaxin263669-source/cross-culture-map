import { createHash } from 'crypto';

/** 测试用设备指纹（每次传入不同 seed 避免互相冲突） */
export function testDeviceFingerprint(seed = 'default') {
  return createHash('sha256').update(`test-device:${seed}:${Date.now()}`).digest('hex');
}
