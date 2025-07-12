import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react'; // Using lucide-react for modern icons

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

type QuizSectionProps = {
  docText: string;
};

const QUIZ_PROMPT = `Generate a quiz of 10 multiple-choice questions (with 4 options each, and the correct answer marked) based on the following text. Format the output as a valid JSON array of objects, where each object has "question", "options", and "answer" keys. Do not include explanations or any text outside of the JSON array itself.\n\nText:\n`;

const QuizSection: React.FC<QuizSectionProps> = ({ docText }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docText) return;

    const fetchQuiz = async () => {
      setLoading(true);
      setError(null);
      setQuestions([]); // Reset previous questions

      try {
        const response = await fetch('http://localhost:5000/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: docText,
            question: QUIZ_PROMPT + docText.slice(0, 4000), // limit for prompt size
          }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok.');
        }

        const data = await response.json();
        
        let quizData: QuizQuestion[] = [];
        try {
          // Robust parsing: find the JSON array within the response string
          const jsonMatch = data.answer.match(/\[\s*\{[\s\S]*?\}\s*\]/);
          if (jsonMatch) {
            quizData = JSON.parse(jsonMatch[0]);
          } else {
             // Fallback for cases where the response is just the JSON
            quizData = JSON.parse(data.answer);
          }
          
          if (Array.isArray(quizData) && quizData.length > 0) {
            setQuestions(quizData);
          } else {
            throw new Error('Parsed data is not a valid quiz array.');
          }

        } catch (e) {
          console.error("Parsing error:", e);
          setError('Failed to parse the quiz. The format might be incorrect. Please try generating it again.');
        }
      } catch (err) {
        setError('An error occurred while fetching the quiz. Please check the connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [docText]);

  const handleOptionSelect = (option: string) => {
    if (showAnswer) return;
    setSelected(option);
    setShowAnswer(true);
    if (option === questions[current].answer) {
      setScore(prevScore => prevScore + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelected(null);
    setShowAnswer(false);
    setCurrent(prevCurrent => prevCurrent + 1);
  };
  
  const restartQuiz = () => {
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setShowAnswer(false);
  }

  // --- Render States ---

  if (!docText) return null;

  if (loading) {
    return (
      <div className="text-center py-16 px-6">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-white/80">Generating Quiz...</h2>
        <p className="text-white/50">Please wait while we prepare your questions.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
        <h2 className="text-xl font-bold text-red-400 mb-2">Oops! Something went wrong.</h2>
        <p className="text-white/70">{error}</p>
      </div>
    );
  }

  if (questions.length === 0) return null;
  
  // --- Quiz Complete View ---
  if (current >= questions.length) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-10 text-center bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl">
        <h2 className="text-4xl font-bold text-white mb-3">Quiz Complete!</h2>
        <p className="text-lg text-white/70 mb-6">You've reached the end of the quiz.</p>
        <p className="text-2xl text-white/90 mb-8">
          Your final score is: <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">{score} / {questions.length}</span>
        </p>
        <button 
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg"
          onClick={restartQuiz}
        >
          Retry Quiz
        </button>
      </div>
    );
  }

  const q = questions[current];
  const progressPercentage = ((current + 1) / questions.length) * 100;

  // --- Main Quiz View ---
  return (
    <div className="max-w-3xl mx-auto my-12 p-6 sm:p-10 bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
      {/* Header and Progress Bar */}
      <div className="mb-8">
        <p className="text-sm font-medium text-purple-300 mb-1">
          Question {current + 1} of {questions.length}
        </p>
        <div className="w-full bg-black/30 rounded-full h-2.5">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Question */}
      <h2 className="text-2xl md:text-3xl font-bold text-white/95 mb-10 leading-snug">{q.question}</h2>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {q.options.map((option) => {
          const isSelected = selected === option;
          const isCorrect = option === q.answer;
          
          // Determine button styles based on state
          let buttonClass = 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30'; // Default
          if (showAnswer) {
            if (isCorrect) {
              buttonClass = 'bg-green-500/20 border-green-500 text-white'; // Correct answer
            } else if (isSelected && !isCorrect) {
              buttonClass = 'bg-red-500/20 border-red-500 text-white'; // Incorrectly selected
            } else {
              buttonClass = 'bg-white/5 border-white/10 opacity-60'; // Not selected, answer revealed
            }
          }

          return (
            <button
              key={option}
              className={`p-5 rounded-lg border text-left w-full transition-all duration-300 flex items-center justify-between ${buttonClass}`}
              disabled={showAnswer}
              onClick={() => handleOptionSelect(option)}
            >
              <span className="font-medium text-white/80">{option}</span>
              {showAnswer && isSelected && (
                isCorrect ? <CheckCircle className="text-green-400" /> : <XCircle className="text-red-400" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Footer: Feedback and Next Button */}
      {showAnswer && (
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-4 sm:mb-0">
            {selected === q.answer ? (
              <p className="text-lg font-semibold text-green-400">Correct!</p>
            ) : (
              <p className="text-lg font-semibold text-red-400">
                Incorrect. The right answer is: <span className="font-bold">{q.answer}</span>
              </p>
            )}
          </div>
          <button 
             className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
             onClick={handleNextQuestion}
           >
             Next Question <ArrowRight size={20} />
           </button>
        </div>
      )}
    </div>
  );
};

export default QuizSection;