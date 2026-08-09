import Image from 'next/image';
import { cn } from '@/lib/utils';

const LOGO_SRC = '/favicon.png';

const SIZE_MAP = {
  sm: 32,
  md: 40,
  lg: 48,
} as const;

type DwaarLogoProps = {
  size?: keyof typeof SIZE_MAP;
  showWordmark?: boolean;
  className?: string;
  imageClassName?: string;
  wordmarkClassName?: string;
};

export function DwaarLogo({
  size = 'sm',
  showWordmark = true,
  className,
  imageClassName,
  wordmarkClassName,
}: DwaarLogoProps) {
  const dimension = SIZE_MAP[size];

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
      <Image
        src={LOGO_SRC}
        alt="Dwaar logo"
        width={dimension}
        height={dimension}
        className={cn('shrink-0 rounded-md object-contain', imageClassName)}
        priority={size !== 'sm'}
      />
      {showWordmark ? (
        <span className={cn('truncate font-semibold text-foreground', wordmarkClassName)}>
          Dwaar
        </span>
      ) : null}
    </span>
  );
}

export function DwaarLogoMark({
  size = 'sm',
  className,
}: {
  size?: keyof typeof SIZE_MAP;
  className?: string;
}) {
  const dimension = SIZE_MAP[size];

  return (
    <Image
      src={LOGO_SRC}
      alt="Dwaar logo"
      width={dimension}
      height={dimension}
      className={cn('shrink-0 rounded-md object-contain', className)}
    />
  );
}
