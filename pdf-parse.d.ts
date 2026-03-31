declare module 'pdf-parse' {
  interface PdfResult {
    text: string;
  }
  function pdfParse(data: Buffer): Promise<PdfResult>;
  export default pdfParse;
}
