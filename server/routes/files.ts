import { createHash } from "crypto";
import express from "express";
import multer from "multer";

import { ownerContextFromRequest } from "../core/OwnerContext.js";
import { requireOwner } from "../core/requireOwner.js";
import { MAX_UPLOAD_BYTES, parseFileCategory, safeDownloadName, validateFileForCategory } from "../files/fileUpload.js";
import { prisma } from "../storage-prisma.js";

const router = express.Router();
const receiveFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

function acceptSingleFile(req: express.Request, res: express.Response, next: express.NextFunction) {
  receiveFile.single("file")(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(Object.assign(new Error("Files must be 20 MB or smaller"), { status: 413 }));
      return;
    }
    next(error);
  });
}

function publicArtifact(file: {
  id: string; category: string; originalName: string; mimeType: string; byteSize: number;
  contentHash: string; version: number; status: string; galaxyId: string; createdAt: Date; updatedAt: Date;
}) {
  return {
    id: file.id,
    category: file.category,
    originalName: file.originalName,
    mimeType: file.mimeType,
    byteSize: file.byteSize,
    contentHash: file.contentHash,
    version: file.version,
    status: file.status,
    galaxyId: file.galaxyId,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    contentUrl: `/api/zcos/files/${file.id}/content`,
  };
}

router.get("/", requireOwner, async (req, res, next) => {
  try {
    const owner = ownerContextFromRequest(req);
    const files = await prisma.fileArtifact.findMany({
      where: { ownerUserId: owner.ownerUserId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ files: files.map(publicArtifact) });
  } catch (error) { next(error); }
});

router.post("/", requireOwner, acceptSingleFile, async (req, res, next) => {
  try {
    const owner = ownerContextFromRequest(req);
    if (!req.file) return res.status(400).json({ error: "A file is required" });
    const category = parseFileCategory(req.body?.category);
    validateFileForCategory(req.file, category);
    const contentHash = createHash("sha256").update(req.file.buffer).digest("hex");

    const artifact = await prisma.$transaction(async (tx) => {
      const previous = await tx.fileArtifact.findFirst({
        where: { ownerUserId: owner.ownerUserId, originalName: req.file!.originalname },
        orderBy: { version: "desc" },
        select: { version: true },
      });
      const stored = await tx.fileArtifact.create({
        data: {
          ownerUserId: owner.ownerUserId,
          galaxyId: "zenith",
          uploadedFromGalaxyId: owner.originGalaxyId,
          category,
          originalName: req.file!.originalname,
          mimeType: req.file!.mimetype || "application/octet-stream",
          byteSize: req.file!.size,
          contentHash,
          content: req.file!.buffer,
          version: (previous?.version ?? 0) + 1,
          status: "stored",
        },
      });
      await tx.auditEvent.create({
        data: {
          ownerUserId: owner.ownerUserId,
          galaxyId: "zenith",
          eventType: "file.uploaded",
          targetType: "file",
          targetId: stored.id,
          details: { category, originalName: stored.originalName, byteSize: stored.byteSize, contentHash, version: stored.version },
        },
      });
      return stored;
    });

    res.status(201).json({ file: publicArtifact(artifact) });
  } catch (error) { next(error); }
});

router.get("/:id/content", requireOwner, async (req, res, next) => {
  try {
    const owner = ownerContextFromRequest(req);
    const artifact = await prisma.fileArtifact.findFirst({ where: { id: req.params.id, ownerUserId: owner.ownerUserId } });
    if (!artifact) return res.status(404).json({ error: "File not found" });
    res.setHeader("Content-Type", artifact.mimeType);
    res.setHeader("Content-Length", String(artifact.byteSize));
    res.setHeader("Content-Disposition", `inline; filename="${safeDownloadName(artifact.originalName)}"`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(artifact.content);
  } catch (error) { next(error); }
});

export default router;
