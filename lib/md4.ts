import { WASMInterface, IWASMInterface, IHasher } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/md4.wasm.json';
import lockedCreate from './lockedCreate';
import { IDataType } from './util';

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

export function md4(data: IDataType): Promise<string> {
  if (wasmCache === null) {
    return lockedCreate(mutex, wasmJson, 16)
      .then((wasm) => {
        wasmCache = wasm;
        return wasmCache.calculate(data);
      });
  }

  try {
    const hash = wasmCache.calculate(data);
    return Promise.resolve(hash);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function createMD4(): Promise<IHasher> {
  return WASMInterface(wasmJson, 16).then((wasm) => {
    wasm.init();
    const obj: IHasher = {
      init: () => { wasm.init(); return obj; },
      update: (data) => { wasm.update(data); return obj; },
      digest: (outputType) => wasm.digest(outputType) as any,
      blockSize: 64,
      digestSize: 16,
    };
    return obj;
  });
}
