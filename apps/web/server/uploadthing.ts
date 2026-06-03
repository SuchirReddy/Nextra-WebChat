import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const uploadRouter = {
  chatMedia: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 6
    },
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 4
    },
    text: {
      maxFileSize: "4MB",
      maxFileCount: 4
    }
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) {
        throw new Error("Unauthorized");
      }

      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => ({
      uploadedBy: metadata.userId,
      url: file.ufsUrl,
      name: file.name,
      size: file.size,
      type: file.type
    }))
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
