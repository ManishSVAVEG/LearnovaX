/**
 * Data validation utilities
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username
 */
export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!username || username.trim().length === 0) {
    errors.push("Username is required");
  } else if (username.length < 3) {
    errors.push("Username must be at least 3 characters");
  } else if (username.length > 30) {
    errors.push("Username must be less than 30 characters");
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push("Username can only contain letters, numbers, underscores, and hyphens");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate password
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!password) {
    errors.push("Password is required");
  } else {
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      warnings.push("Password should contain uppercase letters");
    }
    if (!/[a-z]/.test(password)) {
      warnings.push("Password should contain lowercase letters");
    }
    if (!/\d/.test(password)) {
      warnings.push("Password should contain numbers");
    }
    if (!/[!@#$%^&*]/.test(password)) {
      warnings.push("Password should contain special characters");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate study input
 */
export function validateStudyInput(
  topic: string,
  subject: string,
  length: number = 1
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!topic || topic.trim().length === 0) {
    errors.push("Topic is required");
  } else if (topic.length > 200) {
    errors.push("Topic must be less than 200 characters");
  }

  if (!subject || subject.trim().length === 0) {
    errors.push("Subject is required");
  }

  if (length < 1 || length > 1000) {
    errors.push("Content length must be between 1 and 1000");
  }

  if (topic.match(/[<>\/\\:?*|"|]/)) {
    errors.push("Topic contains invalid characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate exam setup
 */
export function validateExamSetup(
  subject: string,
  topic: string,
  totalMarks: number,
  numQuestions: number,
  timerMinutes: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!subject || subject.trim().length === 0) {
    errors.push("Subject is required");
  }

  if (!topic || topic.trim().length === 0) {
    errors.push("Topic is required");
  }

  if (totalMarks < 1 || totalMarks > 500) {
    errors.push("Total marks must be between 1 and 500");
  }

  if (numQuestions < 1 || numQuestions > 50) {
    errors.push("Number of questions must be between 1 and 50");
  }

  if (timerMinutes < 1 || timerMinutes > 300) {
    errors.push("Timer must be between 1 and 300 minutes");
  }

  const avgMarksPerQuestion = totalMarks / numQuestions;
  if (avgMarksPerQuestion > 100) {
    warnings.push("Average marks per question is very high");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate file size
 */
export function validateFileSize(sizeInBytes: number, maxSizeInMB = 10): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const maxBytes = maxSizeInMB * 1024 * 1024;

  if (sizeInBytes > maxBytes) {
    errors.push(`File size exceeds ${maxSizeInMB}MB limit. Actual: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB`);
  }

  if (sizeInBytes > maxBytes * 0.8) {
    warnings.push("File is close to size limit");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate JSON structure
 */
export function validateJSON<T>(json: unknown, expectedKeys: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof json !== "object" || json === null) {
    errors.push("Invalid JSON format");
    return { isValid: false, errors, warnings };
  }

  const obj = json as Record<string, unknown>;
  const missingKeys = expectedKeys.filter((key) => !(key in obj));

  if (missingKeys.length > 0) {
    errors.push(`Missing required fields: ${missingKeys.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>]/g, "") // Remove angle brackets
    .substring(0, 5000); // Limit length
}

/**
 * Validate markdown content
 */
export function validateMarkdownContent(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content || content.trim().length === 0) {
    errors.push("Content is empty");
  } else if (content.length > 50000) {
    errors.push("Content exceeds maximum size (50KB)");
  }

  // Check for common markdown issues
  const unclosedCodeBlocks = (content.match(/```/g) || []).length % 2;
  if (unclosedCodeBlocks !== 0) {
    warnings.push("Code blocks may not be properly closed");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Deep validate object against schema
 */
export function validateObject(
  obj: unknown,
  schema: Record<string, string>
): ValidationResult {
  const errors: string[] = [];

  if (typeof obj !== "object" || obj === null) {
    errors.push("Expected object");
    return { isValid: false, errors, warnings: [] };
  }

  const objTyped = obj as Record<string, unknown>;

  for (const [key, expectedType] of Object.entries(schema)) {
    if (!(key in objTyped)) {
      errors.push(`Missing required field: ${key}`);
      continue;
    }

    const actualType = typeof objTyped[key];
    if (actualType !== expectedType) {
      errors.push(
        `Field "${key}" should be ${expectedType}, got ${actualType}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
}
