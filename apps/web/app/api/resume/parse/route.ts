import { NextRequest, NextResponse } from "next/server";
import { parseResumeText } from "@/lib/resumeParser";

// Never statically render/cache this route.
export const dynamic = "force-dynamic";

// Accepts a resume file (.pdf or .docx) from the onboarding page, extracts
// plain text, and returns a best-effort structured guess (skills, years of
// experience, phone, roles) that the form uses to auto-fill itself. Nothing
// is written to the database here — /api/profile still does the actual save,
// so the user can review/edit everything first.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  let text = "";
  try {
    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      // Import the inner implementation directly, not the package's top-level
      // index.js — that file runs a debug/self-test block on import when
      // `module.parent` is falsy (which Next.js's bundler triggers), and
      // throws ENOENT looking for a bundled sample PDF that isn't shipped.
      // @ts-expect-error — no published types for this internal subpath; it's a plain CJS function export.
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default as (buf: Buffer) => Promise<{ text: string }>;
      const result = await pdfParse(buffer);
      text = result.text;
    } else if (name.endsWith(".docx") || file.type.includes("wordprocessingml")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (name.endsWith(".doc")) {
      return NextResponse.json(
        { error: "Old .doc format isn't supported — please save your resume as .docx or .pdf and re-upload." },
        { status: 415 }
      );
    } else if (name.endsWith(".txt")) {
      text = buffer.toString("utf8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a .pdf or .docx resume." },
        { status: 415 }
      );
    }
  } catch (err) {
    console.error("Resume parse failed:", err);
    return NextResponse.json(
      { error: "Couldn't read that file. Make sure it isn't scanned/image-only or password-protected." },
      { status: 422 }
    );
  }

  text = text.trim();
  if (!text) {
    return NextResponse.json(
      { error: "No readable text found in that file (it may be a scanned image)." },
      { status: 422 }
    );
  }

  const parsed = parseResumeText(text);
  return NextResponse.json(parsed);
}
