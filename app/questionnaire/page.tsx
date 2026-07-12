'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts';
import { useQuestionnaire } from '@/lib/contexts';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { questionnaireSections } from '@/lib/questionnaire-data';
import { getDemoAnswer } from '@/lib/demo-data';
import { DemoFillButton } from '@/components/demo-fill-button';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Save, CheckCircle2 } from 'lucide-react';

export default function QuestionnairePage() {
  const { user, isLoading } = useAuth();
  const { answers, saveAnswer, getCompletionBySection, getTotalCompletion } = useQuestionnaire();
  const router = useRouter();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return null;
  }

  const currentSection = questionnaireSections[currentSectionIndex];
  const totalCompletion = getTotalCompletion(questionnaireSections.reduce((sum, s) => sum + s.questions.length, 0));

  const handleQuestionChange = (questionId: string, value: any) => {
    const question = currentSection.questions.find((q) => q.id === questionId);
    if (question) {
      saveAnswer({
        questionId,
        sectionId: currentSection.id,
        answer: value,
        completed: !!value && (typeof value === 'string' ? value.trim() !== '' : true),
      });
    }
  };

  const handleSaveSection = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const fillSections = (sections: typeof questionnaireSections) => {
    sections.forEach((section) => section.questions.forEach((question) => {
      const value = getDemoAnswer(question);
      saveAnswer({ questionId: question.id, sectionId: section.id, answer: value, completed: true });
    }));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const canGoNext = currentSectionIndex < questionnaireSections.length - 1;
  const canGoPrev = currentSectionIndex > 0;
  const sectionCompletion = getCompletionBySection(currentSection.id, currentSection.questions.length);

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">SEBI Compliance Questionnaire</h1>
            <p className="text-muted-foreground">Answer detailed questions across 5 sections</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Overall Progress</p>
            <p className="text-3xl font-bold text-primary">{totalCompletion}%</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-primary/15 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-foreground">Questionnaire demo mode</p>
            <p className="text-sm text-muted-foreground">Use realistic fictional responses to keep the walkthrough moving.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DemoFillButton onClick={() => fillSections([currentSection])} label="Fill this section" />
            <Button type="button" onClick={() => fillSections(questionnaireSections)} className="gap-2">Fill all 5 sections</Button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {questionnaireSections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => setCurrentSectionIndex(index)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                index === currentSectionIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {index + 1}. {section.title}
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-foreground font-medium">Section Progress</span>
            <span className="text-muted-foreground">{sectionCompletion}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-accent h-3 rounded-full transition-all"
              style={{ width: `${sectionCompletion}%` }}
            />
          </div>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">Section saved successfully!</span>
          </div>
        )}

        {/* Questions */}
        <div className="bg-card border border-border rounded-lg p-8 space-y-8 mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">{currentSection.title}</h2>
            {currentSection.description && (
              <p className="text-muted-foreground">{currentSection.description}</p>
            )}
          </div>

          <div className="space-y-8 border-t border-border pt-8">
            {currentSection.questions.map((question) => {
              const answer = answers.find((a) => a.questionId === question.id);
              const currentValue = answer?.answer || '';
              const inputValue = typeof currentValue === 'boolean' ? String(currentValue) : currentValue;

              return (
                <div key={question.id}>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    {question.question}
                    {question.required && <span className="text-destructive ml-1">*</span>}
                  </label>

                  {question.type === 'text' && (
                    <Input
                      type="text"
                      placeholder={question.placeholder}
                      value={inputValue}
                      onChange={(e) => handleQuestionChange(question.id, e.target.value)}
                    />
                  )}

                  {question.type === 'textarea' && (
                    <textarea
                      placeholder={question.placeholder}
                      value={inputValue}
                      onChange={(e) => handleQuestionChange(question.id, e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground placeholder-muted-foreground"
                    />
                  )}

                  {question.type === 'number' && (
                    <Input
                      type="number"
                      placeholder={question.placeholder}
                      value={inputValue}
                      onChange={(e) => handleQuestionChange(question.id, e.target.value)}
                    />
                  )}

                  {question.type === 'radio' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <label key={option} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={currentValue === option}
                            onChange={() => handleQuestionChange(question.id, option)}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="text-foreground">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'checkbox' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <label key={option} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            value={option}
                            checked={Array.isArray(currentValue) && currentValue.includes(option)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleQuestionChange(question.id, [...(Array.isArray(currentValue) ? currentValue : []), option]);
                              } else {
                                handleQuestionChange(question.id, Array.isArray(currentValue) ? currentValue.filter((v) => v !== option) : []);
                              }
                            }}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="text-foreground">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <div className="flex gap-2">
            {canGoPrev && (
              <Button variant="outline" onClick={() => setCurrentSectionIndex(currentSectionIndex - 1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-4">
            <Button onClick={handleSaveSection} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Section'}
            </Button>

            {canGoNext && (
              <Button onClick={() => setCurrentSectionIndex(currentSectionIndex + 1)} className="gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            {!canGoNext && (
              <Link href="/documents">
                <Button className="gap-2">
                  Continue to Documents
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
