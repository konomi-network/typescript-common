export const ONE_ETHER = BigInt('1000000000000000000');

/**
 * ensure
 */
export function ensure(predicate: boolean, errorMessage: string) {
  if (!predicate) {
    throw new Error(errorMessage);
  }
}

export function isBitSet(n: number, offset: number): boolean {
  return ((n >> offset) & 1) === 1;
}

/**
 * pause the current thread for a while.
 * @param ms The millisecond to sleep.
 */
export async function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('');
    }, ms);
  });
}
