'use client';

import { useState, useCallback, useMemo } from 'react';

/**
 * Validation rule types
 */
export interface ValidationRule {
  validate: (value: any, formData?: Record<string, any>) => boolean;
  message: string;
}

export interface FieldConfig {
  rules: ValidationRule[];
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
}

export interface ValidationSchema {
  [field: string]: FieldConfig;
}

export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
}

/**
 * Common validation rules
 */
export const validators = {
  required: (message = 'Обязательное поле'): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    },
    message,
  }),

  email: (message = 'Некорректный email'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true; // Let required handle empty
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      return String(value).length >= min;
    },
    message: message || `Минимум ${min} символов`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      return String(value).length <= max;
    },
    message: message || `Максимум ${max} символов`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      return regex.test(value);
    },
    message,
  }),

  matches: (fieldName: string, message = 'Поля не совпадают'): ValidationRule => ({
    validate: (value, formData) => {
      if (!formData) return true;
      return value === formData[fieldName];
    },
    message,
  }),

  phone: (message = 'Некорректный номер телефона'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      // Allow various phone formats
      return /^[\d\s\-+()]{10,}$/.test(value);
    },
    message,
  }),

  url: (message = 'Некорректный URL'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  numeric: (message = 'Должно быть числом'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      return !isNaN(Number(value));
    },
    message,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      return Number(value) >= min;
    },
    message: message || `Минимальное значение: ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      return Number(value) <= max;
    },
    message: message || `Максимальное значение: ${max}`,
  }),

  custom: (fn: (value: any, formData?: Record<string, any>) => boolean, message: string): ValidationRule => ({
    validate: fn,
    message,
  }),
};

/**
 * Form validation hook
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  schema: ValidationSchema,
  onSubmit?: (values: T) => Promise<void> | void
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = useCallback(
    (field: keyof T, value: any): string | undefined => {
      const fieldConfig = schema[field as string];
      if (!fieldConfig) return undefined;

      for (const rule of fieldConfig.rules) {
        if (!rule.validate(value, values)) {
          return rule.message;
        }
      }
      return undefined;
    },
    [schema, values]
  );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const field in schema) {
      const error = validateField(field as keyof T, values[field]);
      if (error) {
        newErrors[field as keyof T] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [schema, values, validateField]);

  // Handle value change
  const handleChange = useCallback(
    (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
      setValues((prev) => ({ ...prev, [field]: value }));

      // Validate on change if configured
      const fieldConfig = schema[field as string];
      if (fieldConfig?.validateOnChange || touched[field]) {
        const error = validateField(field, value);
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [schema, touched, validateField]
  );

  // Set a specific value
  const setValue = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [field]: value }));

      if (touched[field]) {
        const error = validateField(field, value);
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [touched, validateField]
  );

  // Handle blur
  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      const fieldConfig = schema[field as string];
      if (fieldConfig?.validateOnBlur !== false) {
        const error = validateField(field, values[field]);
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [schema, values, validateField]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      // Mark all fields as touched
      const allTouched = Object.keys(schema).reduce(
        (acc, field) => ({ ...acc, [field]: true }),
        {} as Partial<Record<keyof T, boolean>>
      );
      setTouched(allTouched);

      // Validate all fields
      if (!validateForm()) {
        return;
      }

      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [schema, validateForm, values, onSubmit]
  );

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Check if form is valid (memoized)
  const isValid = useMemo(() => {
    for (const field in schema) {
      const error = validateField(field as keyof T, values[field]);
      if (error) return false;
    }
    return true;
  }, [schema, values, validateField]);

  // Get field props helper
  const getFieldProps = useCallback(
    (field: keyof T) => ({
      name: field as string,
      value: values[field] ?? '',
      onChange: handleChange(field),
      onBlur: handleBlur(field),
      error: touched[field] ? errors[field] : undefined,
    }),
    [values, errors, touched, handleChange, handleBlur]
  );

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    setValues,
    setErrors,
    reset,
    validateField,
    validateForm,
    getFieldProps,
  };
}

export default useFormValidation;
