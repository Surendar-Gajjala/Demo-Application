import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { SiteRequest, SiteResponse } from '../../api/types';
import { Field, TextArea, TextInput } from './FormField';
import { FormActions } from './FormActions';
import { applyServerError, blankToNull } from './serverErrors';
import type { EntityFormProps } from './types';

// Mirrors SiteRequest validation in the backend.
const schema = z.object({
  siteName: z.string().trim().min(1, 'Site name is required').max(255, 'At most 255 characters'),
  siteType: z.string().max(100, 'At most 100 characters').optional(),
  workcenter: z.string().max(100, 'At most 100 characters').optional(),
  address: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function SiteForm({ initial, onSubmit, onCancel }: EntityFormProps<SiteResponse, SiteRequest>) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      siteName: initial?.siteName ?? '',
      siteType: initial?.siteType ?? '',
      workcenter: initial?.workcenter ?? '',
      address: initial?.address ?? '',
    },
  });

  const submit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      await onSubmit({
        siteName: v.siteName.trim(),
        siteType: blankToNull(v.siteType),
        workcenter: blankToNull(v.workcenter),
        address: blankToNull(v.address),
      });
    } catch (e) {
      setFormError(applyServerError(e, setError));
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <Field label="Site Name" required error={errors.siteName?.message}>
        <TextInput autoFocus {...register('siteName')} error={errors.siteName?.message} />
      </Field>
      <div className="grid grid-cols-2 gap-x-4">
        <Field label="Site Type" error={errors.siteType?.message}>
          <TextInput {...register('siteType')} placeholder="e.g. Plant" error={errors.siteType?.message} />
        </Field>
        <Field label="Workcenter" error={errors.workcenter?.message}>
          <TextInput {...register('workcenter')} placeholder="e.g. WC-001" error={errors.workcenter?.message} />
        </Field>
      </div>
      <Field label="Address" error={errors.address?.message}>
        <TextArea {...register('address')} />
      </Field>
      <FormActions
        submitting={isSubmitting}
        submitLabel={initial ? 'Save changes' : 'Add Site'}
        error={formError}
        onCancel={onCancel}
      />
    </form>
  );
}
