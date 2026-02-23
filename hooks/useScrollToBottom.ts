import { useEffect, useRef } from "react";

export function useScrollToBottom(trigger: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [trigger]);
  return ref;
}
