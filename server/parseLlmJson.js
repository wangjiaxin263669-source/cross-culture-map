/**
 * 解析 DeepSeek 返回的 JSON（修复未转义引号、截断字符串等常见问题）
 */
import { jsonrepair } from 'jsonrepair';

function extractJsonCandidate(text) {
  const raw = String(text).trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const startObj = raw.indexOf('{');
  const startArr = raw.indexOf('[');
  if (startObj === -1 && startArr === -1) return raw;
  const start =
    startObj === -1 ? startArr : startArr === -1 ? startObj : Math.min(startObj, startArr);
  return raw.slice(start);
}

function tryParse(str) {
  return JSON.parse(str);
}

/**
 * @param {string} text
 * @returns {unknown}
 */
export function parseJsonFromLlm(text) {
  const candidate = extractJsonCandidate(text);

  try {
    return tryParse(candidate);
  } catch {
    /* continue */
  }

  try {
    return tryParse(jsonrepair(candidate));
  } catch {
    /* continue */
  }

  // 截断的 JSON：尝试补全闭合括号
  let repaired = candidate;
  const openBraces = (repaired.match(/\{/g) || []).length;
  const closeBraces = (repaired.match(/\}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;
  if (openBraces > closeBraces) {
    repaired += '}'.repeat(openBraces - closeBraces);
  }
  if (openBrackets > closeBrackets) {
    repaired += ']'.repeat(openBrackets - closeBrackets);
  }

  try {
    return tryParse(jsonrepair(repaired));
  } catch (err) {
    throw new Error(
      `AI 返回的 JSON 无法解析（${err.message?.slice(0, 80) || '格式错误'}），请点击重试`,
    );
  }
}
