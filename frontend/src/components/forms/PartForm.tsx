import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LIFE_CYCLE_PHASES, type PartRequest, type PartResponse } from '../../api/types';
import { enumLabel } from '../../lib/format';
import { Field, Select, TextArea, TextInput } from './FormField';
import { FormActions } from './FormActions';
import { applyServerError, blankToNull } from './serverErrors';
import type { EntityFormProps } from './types';

// Mirrors PartRequest validation in the backend.
const schema = z.object({
  partNumber: z.string().trim().min(1, 'Part number is required').max(50, 'At most 50 characters'),
  partName: z.string().trim().min(1, 'Part name is required').max(255, 'At most 255 characters'),
  description: z.string().optional(),
  manufactureName: z.string().max(255, 'At most 255 characters').optional(),
  lifeCyclePhase: z.enum(['DESIGN', 'PRODUCTION']),
});

type Values = z.infer<typeof schema>;

export function PartForm({ initial, onSubmit, onCancel }: EntityFormProps<PartResponse, PartRequest>) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      partNumber: initial?.partNumber ?? '',
      partName: initial?.partName ?? '',
      description: initial?.description ?? '',
      manufactureName: initial?.manufactureName ?? '',
      lifeCyclePhase: initial?.lifeCyclePhase ?? 'DESIGN',
    },
  });

  const submit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      await onSubmit({
        partNumber: v.partNumber.trim(),
        partName: v.partName.trim(),
        description: blankToNull(v.description),
        manufactureName: blankToNull(v.manufactureName),
        lifeCyclePhase: v.lifeCyclePhase,
      });
    } catch (e) {
      setFormError(applyServerError(e, setError, 'partNumber'));
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid grid-cols-2 gap-x-4">
        <Field label="Part Number" required error={errors.partNumber?.message}>
          <TextInput autoFocus {...register('partNumber')} error={errors.partNumber?.message} />
        </Field>
        <Field label="Part Name" required error={errors.partName?.message}>
          <TextInput {...register('partName')} error={errors.partName?.message} />
        </Field>
        <Field label="Manufacturer" error={errors.manufactureName?.message}>
          <TextInput {...register('manufactureName')} error={errors.manufactureName?.message} />
        </Field>
        <Field label="Lifecycle Phase" required error={errors.lifeCyclePhase?.message}>
          <Select
            {...register('lifeCyclePhase')}
            options={LIFE_CYCLE_PHASES.map((p) => ({ value: p, label: enumLabel(p) }))}
          />
        </Field>
      </div>
      <Field label="Description" error={errors.description?.message}>
        <TextArea {...register('description')} />
      </Field>
      <FormActions
        submitting={isSubmitting}
        submitLabel={initial ? 'Save changes' : 'Add Part'}
        error={formError}
        onCancel={onCancel}
      />
    </form>
  );
}
