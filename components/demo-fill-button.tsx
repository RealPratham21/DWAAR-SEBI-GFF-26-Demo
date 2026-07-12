import { Sparkles } from 'lucide-react';
import { Button } from './ui/button';

export function DemoFillButton({ onClick, label = 'Fill demo data' }: { onClick: () => void; label?: string }) {
  return (
    <Button type="button" variant="outline" onClick={onClick} className="gap-2 border-primary/25 bg-primary/5 text-primary hover:bg-primary/10">
      <Sparkles className="w-4 h-4" />
      {label}
    </Button>
  );
}
