export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const { extractText } = await import("unpdf");
  const result = await extractText(new Uint8Array(buffer));
  return Array.isArray(result.text)
    ? result.text.join("\n\n")
    : String(result.text);
}
