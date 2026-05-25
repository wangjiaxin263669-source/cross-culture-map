/**
 * 从项目框架文档提取文本（PDF / Word / PPT）
 */
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import officeParser from 'officeparser';

const MAX_FILE_BYTES = 6 * 1024 * 1024;
const MAX_TEXT_CHARS = 5000;

function extOf(fileName) {
  const m = String(fileName || '').match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : '';
}

export async function extractProjectDocumentText(buffer, fileName) {
  if (!buffer?.length) throw new Error('文件为空');
  if (buffer.length > MAX_FILE_BYTES) {
    throw new Error('文件过大，请控制在 6MB 以内');
  }

  const ext = extOf(fileName);
  let text = '';

  if (ext === 'pdf') {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      text = result?.text || '';
    } finally {
      await parser.destroy?.();
    }
  } else if (ext === 'docx' || ext === 'doc') {
    const result = await mammoth.extractRawText({ buffer });
    text = result?.value || '';
  } else if (ext === 'ppt' || ext === 'pptx') {
    const ast = await officeParser.parseOffice(buffer);
    text = typeof ast?.toText === 'function' ? ast.toText() : '';
  } else {
    throw new Error('仅支持 PDF、Word（doc/docx）、PPT（ppt/pptx）');
  }

  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) throw new Error('未能从文档中提取到文字，请换 PDF/Word 或检查是否扫描件');

  const truncated = trimmed.length > MAX_TEXT_CHARS;
  return {
    text: trimmed.slice(0, MAX_TEXT_CHARS),
    charCount: trimmed.length,
    truncated,
  };
}
