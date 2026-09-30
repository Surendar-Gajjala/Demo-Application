import clsx from 'clsx';
import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

const CONTROL =
  'mt-1 block w-full rounded-md border bg-white px-3 text-sm text-ink focus:outline-none focus:ring-1 disabled:bg-toolbar';

function controlClass(error?: string) {
  return clsx(CONTROL, error ? 'border-red-500 focus:ring-red-500' : 'border-line focus:border-primary focus:ring-primary');
}

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ label, error, required, children }: FieldProps) {
  return (
    <label className="mb-4 block text-sm font-medium text-ink">
      {label}
      {required && <span className="text-red-600"> *</span>}
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-xs font-normal text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { error?: string };

export const TextInput = forwardRef<HTMLInputElement, InputProps>(({ error, className, ...rest }, ref) => (
  <input ref={ref} aria-invalid={!!error} className={clsx(controlClass(error), 'h-9', className)} {...rest} />
));
TextInput.displayName = 'TextInput';

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string };

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ error, className, ...rest }, ref) => (
  <textarea ref={ref} rows={3} aria-invalid={!!error} className={clsx(controlClass(error), 'py-2', className)} {...rest} />
));
TextArea.displayName = 'TextArea';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { error?: string; options: { value: string; label: string }[] };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ error, options, className, ...rest }, ref) => (
  <select ref={ref} aria-invalid={!!error} className={clsx(controlClass(error), 'h-9', className)} {...rest}>
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
));
Select.displayName = 'Select';
