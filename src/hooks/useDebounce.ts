import { useCallback, useRef } from 'react';

/**
 * Hook to debounce a callback function, ensuring it's not called more frequently
 * than a specified interval.
 *
 * @param callback - Function to debounce
 * @param delayMs - Minimum time (in ms) between calls
 * @returns Debounced callback function
 *
 * @example
 * const debouncedUpdate = useDebounce(() => {
 *   setDisplayValue(currentValue);
 * }, 100);
 *
 * // In animation loop:
 * debouncedUpdate();
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delayMs: number
): T {
  const lastCallTimeRef = useRef<number>(0);

  return useCallback(
    ((...args: any[]) => {
      const now = performance.now();
      if (now - lastCallTimeRef.current >= delayMs) {
        lastCallTimeRef.current = now;
        callback(...args);
      }
    }) as T,
    [callback, delayMs]
  );
}

/**
 * Hook to debounce state updates in animation loops or high-frequency callbacks.
 * Call the returned function whenever you want to update, but it will only actually
 * update the state at the specified interval.
 *
 * @param setValue - State setter function
 * @param delayMs - Minimum time (in ms) between state updates
 * @returns Function to call (will debounce updates)
 *
 * @example
 * const debouncedSetPeakFreq = useDebouncedState(setPeakFreq, 100);
 *
 * // In animation loop:
 * debouncedSetPeakFreq(frequencyValue);
 */
export function useDebouncedState<T>(
  setValue: (value: T) => void,
  delayMs: number
): (value: T) => void {
  const lastCallTimeRef = useRef<number>(0);
  const latestValueRef = useRef<T | undefined>(undefined);

  return useCallback(
    (value: T) => {
      latestValueRef.current = value;
      const now = performance.now();

      if (now - lastCallTimeRef.current >= delayMs) {
        lastCallTimeRef.current = now;
        setValue(value);
      }
    },
    [setValue, delayMs]
  );
}
