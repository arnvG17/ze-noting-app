import React, { useEffect, useState } from 'react';
import { jsonrepair } from 'jsonrepair';
import './QuizzPage.css';

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

type QuizSectionProps = {
  docText: string;
};

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
    setLoading(true);
    setError(null);
    fetch('https://the-noting-app.onrender.com/api/ask/quiz', {
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
            } catch {
              quiz = JSON.parse(jsonrepair(jsonMatch[0]));
            }
          } else {
            try {
              quiz = JSON.parse(data.answer);
            } catch {
              quiz = JSON.parse(jsonrepair(data.answer));
            }
          }
          quiz = quiz.filter(q =>
            q &&
            typeof q.question === 'string' &&
            Array.isArray(q.options) &&
            typeof q.answer === 'string'
          );
          if (!Array.isArray(quiz) || quiz.length === 0) throw new Error('Invalid quiz format');
          quiz.forEach((q, index) => {
            if (!q.question || !Array.isArray(q.options) || !q.answer) {
              throw new Error(`Invalid question format at index ${index}`);
            }
          });
        } catch (e) {
          console.error('Quiz parsing error:', e, data.answer);
          setError('Failed to parse quiz. Please try again.');
          setLoading(false);
          return;
        }
        setQuestions(quiz);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Quiz fetch error:', err);
        setError('Failed to fetch quiz. Please try again.');
        setLoading(false);
      });
  }, [docText]);

  const handleOption = (option: string) => {
    if (showAnswer) return;
    setSelected(option);
    setShowAnswer(true);
    if (option === questions[current].answer) {
      setScore(prev => prev + 1);
    }
  };

  const next = () => {
    setSelected(null);
    setShowAnswer(false);
    setCurrent(prev => prev + 1);
  };

  const resetQuiz = () => {
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setShowAnswer(false);
  };

  if (!docText) return null;

  if (loading) return <div className="quiz-container"><div className="loader">Generating Quiz...</div></div>;

  if (error) return <div className="quiz-container"><div className="error">{error}</div></div>;

  if (!questions.length) return null;

  if (current >= questions.length) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="quiz-container">
        <div className="quiz-box">
          <h2 className="quiz-title">Quiz Complete!</h2>
          <p className="quiz-subtitle">You scored:</p>
          <div className="quiz-score">
            <span>{score}</span>/<span>{questions.length}</span>
            <p className="percentage">{percentage}%</p>
          </div>
          <button className="quiz-button" onClick={resetQuiz}>Retry Quiz</button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="quiz-container">
      <div className="quiz-box">
        <div className="quiz-header">
          <h3>Question {current + 1} of {questions.length}</h3>
          <div className="score">Score: {score}</div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <h2 className="quiz-question">{q.question}</h2>
        <div className="options">
          {q.options.map(opt => {
            let className = "option";
            if (showAnswer) {
              if (opt === q.answer) className += " correct";
              else if (opt === selected) className += " wrong";
              else className += " disabled";
            }
            return (
              <button
                key={opt}
                className={className}
                disabled={showAnswer}
                onClick={() => handleOption(opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {showAnswer && (
          <div className="feedback">
            {selected === q.answer ? (
              <p className="correct-text">Correct!</p>
            ) : (
              <p className="wrong-text">Wrong! Correct Answer: <span>{q.answer}</span></p>
            )}
            <button className="quiz-button" onClick={next}>
              {current + 1 < questions.length ? 'Next' : 'Finish'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizSection;
