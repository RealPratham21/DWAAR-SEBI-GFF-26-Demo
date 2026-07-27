import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { WorkstreamQA } from '@/lib/workstream-content';

interface QuestionsTabProps {
  questions: WorkstreamQA[];
}

export function QuestionsTab({ questions }: QuestionsTabProps) {
  return (
    <div className="space-y-4">
      {questions.map((qa) => (
        <div key={qa.id} className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-start gap-3 mb-3">
            {qa.status === 'resolved' ? (
              <CheckCircle2 size={20} className="text-success flex-shrink-0 mt-0.5" />
            ) : (
              <Clock size={20} className="text-warning flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">{qa.question}</h4>
              <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-md ${
                qa.status === 'resolved' 
                  ? 'bg-success/10 text-success' 
                  : 'bg-warning/10 text-warning'
              }`}>
                {qa.status === 'resolved' ? 'Resolved' : 'Pending'}
              </span>
            </div>
          </div>
          <p className="text-foreground bg-background rounded p-3 text-sm leading-relaxed">
            {qa.answer}
          </p>
          {qa.relatedGaps && qa.relatedGaps.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Related Gaps:</p>
              <div className="flex flex-wrap gap-2">
                {qa.relatedGaps.map((gap) => (
                  <span key={gap} className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
