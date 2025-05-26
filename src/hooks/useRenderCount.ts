import { useRef, useEffect } from "react";

/**
 * Hook to track the number of times a component renders
 * Useful for debugging and performance optimization
 *
 * @param componentName Optional name for the component (for logging)
 * @param logRenders Whether to log renders to the console (default: false)
 * @returns The number of times the component has rendered
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const renderCount = useRenderCount('MyComponent', true);
 *
 *   return (
 *     <div>Rendered {renderCount} times</div>
 *   );
 * }
 * ```
 */
export function useRenderCount(
  componentName?: string,
  logRenders = false,
): number {
  const renderCount = useRef(0);

  // Increment render count on each render
  renderCount.current += 1;

  // Log renders if enabled
  useEffect(() => {
    if (logRenders && process.env.NODE_ENV === "development") {
      const name = componentName || "Component";
      console.log(`[Render] ${name} rendered (count: ${renderCount.current})`);
    }
  });

  return renderCount.current;
}

/**
 * Hook to track the number of times a component renders and log when props change
 * Useful for debugging unnecessary re-renders
 *
 * @param props The component props to track
 * @param componentName Optional name for the component (for logging)
 * @returns The number of times the component has rendered
 *
 * @example
 * ```tsx
 * function MyComponent(props) {
 *   useRenderCountWithPropTracking(props, 'MyComponent');
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useRenderCountWithPropTracking<
  T extends Record<string, unknown>,
>(props: T, componentName = "Component"): number {
  const renderCount = useRef(0);
  const prevPropsRef = useRef<T | null>(null);

  // Increment render count on each render
  renderCount.current += 1;

  // Log when props change
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (prevPropsRef.current) {
        const changedProps: string[] = [];

        // Check which props have changed
        Object.keys(props).forEach((key) => {
          if (
            prevPropsRef.current &&
            props[key] !== prevPropsRef.current[key]
          ) {
            changedProps.push(key);
          }
        });

        // Log changed props
        if (changedProps.length > 0) {
          console.log(
            `[Render] ${componentName} re-rendered due to prop changes:`,
            changedProps.join(", "),
            `(render count: ${renderCount.current})`,
          );
        } else {
          console.log(
            `[Render] ${componentName} re-rendered but no props changed`,
            `(render count: ${renderCount.current})`,
          );
        }
      } else {
        console.log(
          `[Render] ${componentName} mounted (render count: ${renderCount.current})`,
        );
      }
    }

    // Update previous props
    prevPropsRef.current = { ...props };
  });

  return renderCount.current;
}
