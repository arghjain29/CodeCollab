import { FileNameSchema } from '@codecollab/shared';
import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';

const messageOf = (err: unknown) =>
  err instanceof ApiError ? err.message : 'Something went wrong. Try again.';

/**
 * The name box used to create or rename an entry in place, like VS Code.
 * Enter saves, Escape cancels, clicking away saves if the name is valid.
 */
export function InlineNameInput({
  initial = '',
  label,
  onSubmit,
  onCancel,
}: {
  initial?: string;
  label: string;
  /** Rejects with an error to keep the box open and show why. */
  onSubmit: (name: string) => Promise<unknown>;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string>();
  const busy = useRef(false);
  const done = useRef(false);

  const submit = async (raw: string, fromBlur: boolean) => {
    if (busy.current || done.current) return;
    const value = raw.trim();
    if (!value || value === initial) {
      done.current = true;
      onCancel();
      return;
    }
    const parsed = FileNameSchema.safeParse(value);
    if (!parsed.success) {
      if (fromBlur) {
        done.current = true;
        onCancel();
      } else setError(parsed.error.issues[0]?.message);
      return;
    }
    busy.current = true;
    try {
      await onSubmit(parsed.data);
      done.current = true;
    } catch (err) {
      setError(messageOf(err));
    } finally {
      busy.current = false;
    }
  };

  return (
    <div className="relative min-w-0 flex-1 py-0.5">
      <Input
        autoFocus
        aria-label={label}
        aria-invalid={!!error}
        aria-describedby={error ? 'tree-name-error' : undefined}
        defaultValue={initial}
        autoComplete="off"
        spellCheck={false}
        className="h-6 rounded-md px-1.5 font-mono text-[13px]"
        onFocus={(e) => {
          // Select just the name part, like desktop editors do.
          const v = e.currentTarget.value;
          const dot = v.lastIndexOf('.');
          e.currentTarget.setSelectionRange(0, dot > 0 ? dot : v.length);
        }}
        onChange={() => error && setError(undefined)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            void submit(e.currentTarget.value, false);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            done.current = true;
            onCancel();
          }
        }}
        onBlur={(e) => void submit(e.currentTarget.value, true)}
        // Keep dragging and clicks inside the box from reaching the row.
        onClick={(e) => e.stopPropagation()}
        onDragStart={(e) => e.preventDefault()}
      />
      {error && (
        <p
          id="tree-name-error"
          role="alert"
          className="absolute inset-x-0 top-full z-10 mt-0.5 rounded-md border border-danger bg-surface px-2 py-1 text-xs text-danger shadow-lg"
        >
          {error}
        </p>
      )}
    </div>
  );
}
