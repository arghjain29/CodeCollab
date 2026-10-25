import { ContextMenu as M } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/** Right-click menu. Looks the same as `DropdownMenu`. */
export const ContextMenu = M.Root;
export const ContextMenuTrigger = M.Trigger;

export function ContextMenuContent({ className, ...props }: ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        className={cn(
          'z-50 min-w-44 rounded-xl border border-line bg-surface p-1 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          className,
        )}
        {...props}
      />
    </M.Portal>
  );
}

export function ContextMenuItem({
  className,
  destructive,
  shortcut,
  children,
  ...props
}: ComponentProps<typeof M.Item> & { destructive?: boolean; shortcut?: string }) {
  return (
    <M.Item
      className={cn(
        'flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-surface-2 [&_svg]:size-4',
        destructive && 'text-danger',
        className,
      )}
      {...props}
    >
      {children}
      {shortcut && <span className="ml-auto pl-4 text-xs text-ink-muted">{shortcut}</span>}
    </M.Item>
  );
}

export function ContextMenuSeparator({ className, ...props }: ComponentProps<typeof M.Separator>) {
  return <M.Separator className={cn('my-1 h-px bg-line', className)} {...props} />;
}
