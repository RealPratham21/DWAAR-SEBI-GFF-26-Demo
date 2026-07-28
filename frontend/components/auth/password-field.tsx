'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { fieldClassName } from '@/components/company-incorporation/form-primitives';
import { cn } from '@/lib/utils';

interface PasswordFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  autoComplete?: string;
  'aria-invalid'?: boolean;
  className?: string;
}

export function PasswordField({
  id,
  value,
  onChange,
  onBlur,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  'aria-invalid': ariaInvalid,
  className,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={ariaInvalid}
        className={cn(fieldClassName, 'pr-11', className)}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
