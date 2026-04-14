"use client";

import { useEffect } from "react";
import { installErrorBuffer } from "@/lib/client/error-buffer";

export function ErrorBufferInstaller() {
  useEffect(() => {
    installErrorBuffer();
  }, []);
  return null;
}
