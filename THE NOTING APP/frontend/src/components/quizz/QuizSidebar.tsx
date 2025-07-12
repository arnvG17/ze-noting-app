import React, { useEffect, useState } from 'react';
import { jsonrepair } from 'jsonrepair';

// Types
 type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

type QuizSidebarProps = {
  docText: string;
};

const QuizSidebar: React.FC<QuizSidebarProps> = ({ docText }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docText) return;
    setLoading(true);
    setError(null);
    fetch('http://localhost:5000/api/ask/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: docText.slice(0, 4000) })
    })
      .then(res => res.json())
      .then(data => {
        let quiz: QuizQuestion[] = [];
        try {
          const jsonMatch = data.answer.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            try {
              quiz = JSON.parse(jsonMatch[0]);
            } catch (e) {
              quiz = JSON.parse(jsonrepair(jsonMatch[0]));
            }
          } else {
            try {
              quiz = JSON.parse(data.answer);
            } catch (e) {
              quiz = JSON.parse(jsonrepair(data.answer));
            }
          }
          quiz = quiz.filter(
            q =>
              q &&
              typeof q.question === 'string' &&
              Array.isArray(q.options) &&
              typeof q.answer === 'string'
          );
          if (!Array.isArray(quiz) || quiz.length === 0) {
            throw new Error('Invalid quiz format');
          }
          quiz.forEach((q, index) => {
            if (!q.question || !Array.isArray(q.options) || !q.answer) {
              throw new Error(`Invalid question format at index ${index}`);
            }
          });
        } catch (e) {
          setError('Failed to parse quiz. Please try again.');
          setLoading(false);
          return;
        }
        setQuestions(quiz);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch quiz. Please try again.');
        setLoading(false);
      });
  }, [docText]);

  const handleOption = (option: string) => {
    if (showAnswer) return;
    setSelected(option);
    setShowAnswer(true);
    if (option === questions[current].answer) {
      setScore(s => s + 1);
    }
  };

  const next = () => {
    setSelected(null);
    setShowAnswer(false);
    setCurrent(c => c + 1);
  };

  const resetQuiz = () => {
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setShowAnswer(false);
  };

  if (!docText) return null;

  // Sidebar container styles
  const sidebarClass =
    'fixed top-0 right-0 h-full w-[420px] bg-black border-l border-gray-800 shadow-xl z-50 flex flex-col overflow-y-auto';
  const contentClass = 'p-8 flex-1 flex flex-col';

  if (loading) {
    return (
      <aside className={sidebarClass}>
        <div className={contentClass + ' items-center justify-center flex'}>
          <div className="animate-spin w-10 h-10 border-4 border-gray-400 border-t-transparent rounded-full mb-6"></div>
          <h3 className="text-lg font-semibold text-white mb-2">Generating Quiz</h3>
          <p className="text-gray-400">Creating questions from your document...</p>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className={sidebarClass}>
        <div className={contentClass + ' items-center justify-center flex'}>
          <h3 className="text-lg font-semibold text-white mb-2">Quiz Generation Failed</h3>
          <p className="text-gray-400">{error}</p>
        </div>
      </aside>
    );
  }

  if (!questions.length) return null;

  if (current >= questions.length) {
    const percentage = Math.round((score / questions.length) * 100);
    let scoreColor = 'text-white';
    return (
      <aside className={sidebarClass}>
        <div className={contentClass + ' items-center justify-center flex'}>
          <h2 className="text-2xl font-bold text-white mb-4">Quiz Complete!</h2>
          <p className="text-gray-400 mb-8">Your performance:</p>
          <div className="bg-gray-900 rounded-xl p-6 mb-8 w-full flex flex-col items-center">
            <div className="flex items-center justify-center space-x-4 mb-2">
              <div className="text-center">
                <div className={`text-3xl font-bold ${scoreColor}`}>{score}</div>
                <div className="text-gray-400 text-xs">Correct</div>
              </div>
              <div className="text-xl text-gray-600">/</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-300">{questions.length}</div>
                <div className="text-gray-400 text-xs">Total</div>
              </div>
            </div>
            <div className={`text-xl font-semibold mt-2 ${scoreColor}`}>{percentage}% Score</div>
          </div>
          <button 
            className="bg-gray-900 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 border border-gray-700"
            onClick={resetQuiz}
          >
            Retry Quiz
          </button>
        </div>
      </aside>
    );
  }

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <aside className={sidebarClass}>
      <div className={contentClass}>
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Question {current + 1} of {questions.length}</h2>
          <div className="text-white font-medium mb-2">Score: {score}/{questions.length}</div>
          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gray-400" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        {/* Question */}
        <div className="mb-8">
          <p className="text-lg font-semibold text-white mb-6">{q.question}</p>
          {/* User's Selected Answer Bubble (if any) */}
          {selected && (
            <div className="flex justify-end mb-4">
              <div className={`px-5 py-3 rounded-2xl rounded-br-sm max-w-xl shadow-md ${selected === q.answer ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white border border-gray-700'}`}> 
                <span className="text-base font-bold text-white">{selected}</span>
              </div>
            </div>
          )}
          {/* Options as Buttons */}
          <div className="flex flex-col gap-4">
            {q.options.map(opt => {
              const isSelected = selected === opt;
              const isCorrect = opt === q.answer;
              let buttonClass =
                "w-full flex items-center justify-start py-4 px-6 rounded-2xl border-2 text-base font-semibold transition-all duration-200 shadow-sm focus:outline-none bg-black border-gray-700 text-white";
              if (showAnswer) {
                if (isSelected && isCorrect) {
                  buttonClass += " bg-gray-700 border-white text-white";
                } else if (isSelected && !isCorrect) {
                  buttonClass += " bg-gray-900 border-white text-white";
                } else if (isCorrect) {
                  buttonClass += " bg-gray-700 border-white text-white";
                } else {
                  buttonClass += " bg-black border-gray-800 text-gray-500";
                }
              } else {
                buttonClass += " hover:bg-gray-800 hover:border-white";
              }
              return (
                <button
                  key={opt}
                  className={buttonClass}
                  disabled={showAnswer}
                  onClick={() => handleOption(opt)}
                  style={{ minHeight: 56, marginBottom: 0 }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
        {/* Answer Feedback */}
        {showAnswer && (
          <div className="mt-4 p-4 bg-gray-900 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selected === q.answer ? (
                  <>
                    <div>
                      <div className="text-white font-bold text-base">Correct! <span className='font-normal'>Well done!</span></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-white font-bold text-base">Incorrect</div>
                      <div className="text-gray-400 text-xs">The correct answer is: <span className="text-white font-medium">{q.answer}</span></div>
                    </div>
                  </>
                )}
              </div>
              <button 
                className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded-xl text-base transition-all duration-200 border border-gray-700"
                onClick={next}
              >
                {current + 1 < questions.length ? 'Next' : 'Finish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default QuizSidebar; 