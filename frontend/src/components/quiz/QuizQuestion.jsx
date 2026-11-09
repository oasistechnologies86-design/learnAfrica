import { cn } from '@/lib/utils';

export function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  showResult = false,
  correctAnswer,
}) {
  const qType = question.question_type || 'mcq';
  const options = question.options || [];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Question {questionNumber} of {totalQuestions}</span>
          <span className="font-medium">{Math.round((questionNumber / totalQuestions) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }} />
        </div>
      </div>

      {/* Question text */}
      <div className="space-y-1">
        <span className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider',
          qType === 'mcq'        ? 'bg-primary/10 text-primary'  :
          qType === 'true_false' ? 'bg-blue-500/10 text-blue-600' :
                                   'bg-orange-500/10 text-orange-600'
        )}>
          {qType === 'mcq_multi'  ? 'Multiple Answer' :
           qType === 'mcq'        ? 'Single Answer' :
           qType === 'true_false' ? 'True or False' :
                                    'Fill in the Blank'}
        </span>
        <h2 className="mt-2 text-lg font-bold leading-relaxed tracking-tight text-foreground sm:text-xl">{question.question}</h2>
      </div>

      {/* ── MCQ ── */}
      {qType === 'mcq' && (
        <div className="space-y-2">
          {options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect  = correctAnswer === index;
            return (
              <button key={index}
                onClick={() => !showResult && onSelectAnswer(index)}
                disabled={showResult}
                className={cn(
                  'group w-full rounded-xl border p-3 text-left transition-colors duration-200 sm:p-3.5',
                  showResult
                    ? isCorrect   ? 'border-success bg-success/10'
                    : isSelected  ? 'border-destructive bg-destructive/10'
                    :               'border-border opacity-40'
                    : isSelected  ? 'border-primary bg-primary/5'
                    :               'border-border hover:border-primary/50 hover:bg-muted/30'
                )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold',
                    showResult
                      ? isCorrect   ? 'border-success bg-success text-white'
                      : isSelected  ? 'border-destructive bg-destructive text-white'
                      :               'border-muted-foreground/30 text-muted-foreground'
                      : isSelected  ? 'border-primary bg-primary text-primary-foreground'
                      :               'border-muted-foreground/30 text-muted-foreground'
                  )}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1 text-sm">{option}</span>
                  {showResult && isCorrect  && <span className="text-success text-xs font-bold">✓ Correct</span>}
                  {showResult && isSelected && !isCorrect && <span className="text-destructive text-xs font-bold">✗ Wrong</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Multiple-answer MCQ ── */}
      {qType === 'mcq_multi' && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-primary">
            Select exactly {question.required_answers || 'all'} answer{question.required_answers === 1 ? '' : 's'}.
          </p>
          {options.map((option, index) => {
            const selected = Array.isArray(selectedAnswer) && selectedAnswer.includes(index);
            const correct = Array.isArray(correctAnswer) && correctAnswer.includes(index);
            return (
              <button key={index} type="button"
                onClick={() => !showResult && onSelectAnswer(index)}
                disabled={showResult}
                className={cn(
                  'w-full rounded-xl border p-3 text-left transition-colors duration-200 sm:p-3.5',
                  showResult
                    ? correct ? 'border-success bg-success/10'
                    : selected ? 'border-destructive bg-destructive/10'
                    : 'border-border opacity-50'
                    : selected ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                )}>
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold',
                    selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 text-muted-foreground')}>
                    {selected ? '✓' : String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1 text-sm">{option}</span>
                  {showResult && correct && <span className="text-success text-xs font-bold">✓ Correct</span>}
                  {showResult && selected && !correct && <span className="text-destructive text-xs font-bold">✗ Wrong</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── True / False ── */}
      {qType === 'true_false' && (
        <div className="grid grid-cols-2 gap-4">
          {['True', 'False'].map((label, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect  = correctAnswer === index;
            return (
              <button key={index}
                onClick={() => !showResult && onSelectAnswer(index)}
                disabled={showResult}
                className={cn(
                  'rounded-xl border bg-card p-4 text-center text-base font-bold transition-colors duration-200',
                  showResult
                    ? isCorrect   ? 'border-success bg-success/10 text-success'
                    : isSelected  ? 'border-destructive bg-destructive/10 text-destructive'
                    :               'border-border opacity-40 text-muted-foreground'
                    : isSelected  ? 'border-primary bg-primary/10 text-primary'
                    :               'border-border hover:border-primary/50 hover:bg-muted/30 text-foreground'
                )}>
                {index === 0 ? '✓ True' : '✗ False'}
                {showResult && isCorrect && <div className="text-xs font-normal mt-1 text-success">Correct answer</div>}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Fill in the Blank ── */}
      {qType === 'fill_blank' && (
        <div className="space-y-3">
          <input
            type="text"
            value={typeof selectedAnswer === 'string' ? selectedAnswer : ''}
            onChange={e => !showResult && onSelectAnswer(e.target.value)}
            disabled={showResult}
            placeholder="Type your answer here…"
            className={cn(
              'w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition-all focus:ring-4 focus:ring-primary/10',
              showResult
                ? typeof selectedAnswer === 'string' &&
                  selectedAnswer.trim().toLowerCase() === (options[correctAnswer] || '').toString().trim().toLowerCase()
                  ? 'border-success bg-success/10 text-success'
                  : 'border-destructive bg-destructive/10'
                : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
            )}
          />
          {showResult && (
            <div className={cn(
              'p-3 rounded-xl text-sm font-medium',
              typeof selectedAnswer === 'string' &&
              selectedAnswer.trim().toLowerCase() === (options[correctAnswer] || '').toString().trim().toLowerCase()
                ? 'bg-success/10 text-success border border-success/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            )}>
              {typeof selectedAnswer === 'string' &&
               selectedAnswer.trim().toLowerCase() === (options[correctAnswer] || '').toString().trim().toLowerCase()
                ? '✓ Correct!'
                : `✗ Correct answer: ${options[correctAnswer] || ''}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
