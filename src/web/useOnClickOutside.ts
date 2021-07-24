import React from "react";

export function useOnClickOutside(
  ref: React.RefObject<any>,
  handler: Function
) {
  React.useEffect(
    () => {
      const listener = (event: MouseEvent | TouchEvent) => {
        const element = ref.current;
        // No ref? Do nothing
        if (!element) {
          return;
        }

        // Do nothing if clicking ref's element or descendent elements contain
        // the target element
        console.log({
          target: event.target,
        });
        if (element.contains(event.target)) {
          return;
        }

        handler(event);
      };

      document.addEventListener("mousedown", listener);
      document.addEventListener("touchstart", listener);

      return () => {
        document.removeEventListener("mousedown", listener);
        document.removeEventListener("touchstart", listener);
      };
    },
    // Add ref and handler to effect dependencies
    // It's worth noting that because passed in handler is a new ...
    // ... function on every render that will cause this effect ...
    // ... callback/cleanup to run every render. It's not a big deal ...
    // ... but to optimize you can wrap handler in useCallback before ...
    // ... passing it into this hook.
    [ref, handler]
  );
}
