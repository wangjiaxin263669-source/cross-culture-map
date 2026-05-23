/**
 * 从《跨文化研究》PDF 提取文本并分块，供 RAG 检索使用。
 * 运行: node server/scripts/build-knowledge.mjs [PDF路径]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFParse } from 'pdf-parse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultPdf = 'C:/Users/ASUS/Desktop/跨文化研究.pdf';
const pdfPath = process.argv[2] || defaultPdf;
const outDir = path.join(__dirname, '../data');
const outFile = path.join(outDir, 'knowledge-chunks.json');

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;

function chunkText(text) {
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  if (!cleaned) return [];

  const chunks = [];
  let start = 0;
  let index = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + CHUNK_SIZE, cleaned.length);
    if (end < cleaned.length) {
      const slice = cleaned.slice(start, end);
      const lastBreak = Math.max(
        slice.lastIndexOf('。'),
        slice.lastIndexOf('！'),
        slice.lastIndexOf('？'),
        slice.lastIndexOf('\n'),
        slice.lastIndexOf('. ')
      );
      if (lastBreak > CHUNK_SIZE * 0.4) {
        end = start + lastBreak + 1;
      }
    }

    const piece = cleaned.slice(start, end).trim();
    if (piece.length > 80) {
      chunks.push({
        id: `chunk-${index++}`,
        text: piece,
        length: piece.length,
      });
    }
    start = end - CHUNK_OVERLAP;
    if (start < 0) start = 0;
    if (end >= cleaned.length) break;
  }

  return chunks;
}

async function main() {
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF 不存在:', pdfPath);
    process.exit(1);
  }

  console.log('正在解析 PDF:', pdfPath);
  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const fullText = result.text || '';
    console.log(`提取完成: ${result.total ?? '?'} 页, 字符数 ${fullText.length}`);

    const chunks = chunkText(fullText);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      outFile,
      JSON.stringify(
        {
          source: path.basename(pdfPath),
          builtAt: new Date().toISOString(),
          totalChars: fullText.length,
          chunkCount: chunks.length,
          chunks,
        },
        null,
        2
      ),
      'utf-8'
    );

    console.log(`已写入 ${chunks.length} 个知识块 -> ${outFile}`);
    if (chunks[0]) {
      console.log('\n预览首块:\n', chunks[0].text.slice(0, 300), '...');
    }
  } finally {
    await parser.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
