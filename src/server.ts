// src/server.ts
// This project developed with AI assistance (Cursor/Claude)
// Human review and testing applied to all AI-generated code

import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { createRouter } from "./router";

export default createStartHandler({
  createRouter,
})(defaultStreamHandler);
