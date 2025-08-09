// This project developed with AI assistance (Cursor/Claude)
// Human review and testing applied to all AI-generated code

import { StartClient } from "@tanstack/react-start/client";
import { hydrateRoot } from "react-dom/client";
import { createRouter } from "./router";

const router = createRouter();

hydrateRoot(document, <StartClient router={router} />);
