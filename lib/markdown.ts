import { Text, View } from "react-native";
import COLORS from "@/constants/colors";

/**
 * Parse markdown and convert to structured data
 */
export interface MDBlock {
  type: "heading1" | "heading2" | "heading3" | "paragraph" | "list" | "code" | "bold" | "italic" | "link";
  content?: string;
  level?: number;
  items?: string[];
}

/**
 * Simple markdown parser for study content
 */
export function parseMarkdown(content: string): MDBlock[] {
  const blocks: MDBlock[] = [];
  const lines = content.split("\n");
  let currentList: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Heading 1
    if (trimmed.startsWith("# ")) {
      if (currentList.length > 0) {
        blocks.push({ type: "list", items: currentList });
        currentList = [];
      }
      blocks.push({ type: "heading1", content: trimmed.substring(2), level: 1 });
      i++;
    }
    // Heading 2
    else if (trimmed.startsWith("## ")) {
      if (currentList.length > 0) {
        blocks.push({ type: "list", items: currentList });
        currentList = [];
      }
      blocks.push({ type: "heading2", content: trimmed.substring(3), level: 2 });
      i++;
    }
    // Heading 3
    else if (trimmed.startsWith("### ")) {
      if (currentList.length > 0) {
        blocks.push({ type: "list", items: currentList });
        currentList = [];
      }
      blocks.push({ type: "heading3", content: trimmed.substring(4), level: 3 });
      i++;
    }
    // List items
    else if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      currentList.push(trimmed.substring(2));
      i++;
    }
    // Numbered list items
    else if (/^\d+\.\s/.test(trimmed)) {
      currentList.push(trimmed.replace(/^\d+\.\s/, ""));
      i++;
    }
    // Code block
    else if (trimmed.startsWith("```")) {
      if (currentList.length > 0) {
        blocks.push({ type: "list", items: currentList });
        currentList = [];
      }
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", content: codeLines.join("\n") });
      i++; // Skip closing ```
    }
    // Empty lines
    else if (trimmed === "") {
      if (currentList.length > 0) {
        blocks.push({ type: "list", items: currentList });
        currentList = [];
      }
      i++;
    }
    // Regular paragraph
    else {
      if (currentList.length > 0) {
        blocks.push({ type: "list", items: currentList });
        currentList = [];
      }
      blocks.push({ type: "paragraph", content: trimmed });
      i++;
    }
  }

  if (currentList.length > 0) {
    blocks.push({ type: "list", items: currentList });
  }

  return blocks;
}

/**
 * Inline markdown formatting (bold, italic, links)
 */
export function formatInlineMarkdown(text: string): (string | { type: string; content: string })[] {
  const parts: (string | { type: string; content: string })[] = [];
  let remaining = text;
  let lastIndex = 0;

  // Find bold text **text**
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let match;
  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push({ type: "bold", content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Calculate reading time
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Extract keywords from content
 */
export function extractKeywords(content: string, maxKeywords = 10): string[] {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "are", "was", "were",
  ]);

  const words = content
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 4 && !stopWords.has(word))
    .map((word) => word.replace(/[^a-z0-9]/g, ""));

  const frequency: Record<string, number> = {};
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Summarize content
 */
export function summarizeContent(content: string, maxLength = 150): string {
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  let summary = "";

  for (const sentence of sentences) {
    if ((summary + sentence).length > maxLength) break;
    summary += sentence;
  }

  return summary.trim();
}
