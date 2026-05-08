import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to handle canvas resizing with ResizeObserver instead of checking every frame.
 * This is more efficient than checking canvas size in the animation loop since it only
 * triggers when the element actually resizes.
 *
 * @param canvasRef - Reference to canvas element
 * @param onResize - Callback when canvas is resized
 *
 * @example
 * const canvasRef = useRef<HTMLCanvasElement>(null);
 * useCanvasResize(canvasRef, () => {
 *   console.log('Canvas resized!');
 * });
 */
export function useCanvasResize(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  onResize?: () => void
): void {
  const lastSizeRef = useRef<{ width: number; height: number } | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const logicalWidth = rect.width;
    const logicalHeight = rect.height;
    const physicalWidth = logicalWidth * dpr;
    const physicalHeight = logicalHeight * dpr;

    // Only update if size actually changed
    if (
      !lastSizeRef.current ||
      lastSizeRef.current.width !== physicalWidth ||
      lastSizeRef.current.height !== physicalHeight
    ) {
      canvas.width = physicalWidth;
      canvas.height = physicalHeight;

      // Apply DPI scaling to context
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      lastSizeRef.current = { width: physicalWidth, height: physicalHeight };

      // Notify caller
      onResize?.();
    }
  }, [canvasRef, onResize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set up ResizeObserver to watch for size changes
    resizeObserverRef.current = new ResizeObserver(() => {
      handleResize();
    });

    // Also handle DPI changes (when device pixel ratio changes, e.g., moving between displays)
    const mediaQueryList = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const handleDPIChange = () => {
      handleResize();
    };

    // Initial resize
    handleResize();

    // Start observing
    resizeObserverRef.current.observe(canvas);
    mediaQueryList.addEventListener('change', handleDPIChange);

    // Cleanup
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      mediaQueryList.removeEventListener('change', handleDPIChange);
    };
  }, [canvasRef, handleResize]);
}

/**
 * Hook to get current canvas dimensions accounting for DPI scaling.
 * Returns logical dimensions (CSS pixels) and physical dimensions (device pixels).
 *
 * @param canvasRef - Reference to canvas element
 * @returns Object with logical and physical dimensions
 *
 * @example
 * const dims = useCanvasDimensions(canvasRef);
 * console.log(`Logical: ${dims.logicalWidth}x${dims.logicalHeight}`);
 * console.log(`Physical: ${dims.physicalWidth}x${dims.physicalHeight}`);
 */
export interface CanvasDimensions {
  logicalWidth: number;
  logicalHeight: number;
  physicalWidth: number;
  physicalHeight: number;
  dpr: number;
}

export function useCanvasDimensions(
  canvasRef: React.RefObject<HTMLCanvasElement>
): CanvasDimensions {
  const getDimensions = useCallback((): CanvasDimensions => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;

    if (!canvas) {
      return {
        logicalWidth: 0,
        logicalHeight: 0,
        physicalWidth: 0,
        physicalHeight: 0,
        dpr
      };
    }

    const rect = canvas.getBoundingClientRect();
    const logicalWidth = rect.width;
    const logicalHeight = rect.height;

    return {
      logicalWidth,
      logicalHeight,
      physicalWidth: logicalWidth * dpr,
      physicalHeight: logicalHeight * dpr,
      dpr
    };
  }, [canvasRef]);

  // Return dimensions (will be updated when ResizeObserver triggers)
  return getDimensions();
}
