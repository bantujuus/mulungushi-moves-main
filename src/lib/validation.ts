export type ValidationErrors = Record<string, string>;

export function validate(values: Record<string, any>, rules: Record<string, {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  label?: string;
}>): ValidationErrors {
  const errors: ValidationErrors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const value = values[field];
    const label = rule.label ?? field;
    if (rule.required && (value === undefined || value === null || value === "" || value === 0)) {
      errors[field] = `${label} is required`;
      continue;
    }
    if (rule.minLength && typeof value === "string" && value.trim().length < rule.minLength) {
      errors[field] = `${label} must be at least ${rule.minLength} characters`;
    }
    if (rule.min !== undefined && Number(value) < rule.min) {
      errors[field] = `${label} must be at least ${rule.min}`;
    }
    if (rule.max !== undefined && Number(value) > rule.max) {
      errors[field] = `${label} must be no more than ${rule.max}`;
    }
  }
  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}