import express from "express";
import { ZCOS_GALAXIES } from "../zcos-core/GalaxyRegistry.js";

const router = express.Router();

router.get("/partitions", (_req, res) => {
  res.json({
    galaxies: ZCOS_GALAXIES,
    domains: ["identity", "memory", "knowledge", "apps", "desk", "settings", "portal"],
  });
});

export default router;
