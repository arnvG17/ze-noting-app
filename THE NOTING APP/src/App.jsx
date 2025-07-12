import * as React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { NotesPage } from "./components/notes/NotesPage";
import { QuizzPage } from "./components/quizz/QuizzPage";
import { BackgroundPaths } from "./components/ui/background-paths";
import { Button } from "./components/ui/button";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-neutral-950">
              <BackgroundPaths title="Welcome" />
              <div className="relative z-20 flex flex-col items-center justify-center mt-12 gap-8">
                <h2 className="text-4xl font-bold mb-4 text-center text-neutral-900 dark:text-white drop-shadow-lg">
                  Choose a Section
                </h2>
                <div className="flex flex-col md:flex-row gap-8">
                  <Button
                    size="lg"
                    className="text-2xl px-12 py-8 shadow-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white dark:from-blue-700 dark:to-blue-900 dark:text-white hover:scale-105 transition-transform duration-200"
                    onClick={() => (window.location.href = "/notes")}
                  >
                    NOTES
                  </Button>
                  <Button
                    size="lg"
                    className="text-2xl px-12 py-8 shadow-xl bg-gradient-to-br from-green-500 to-green-700 text-white dark:from-green-700 dark:to-green-900 dark:text-white hover:scale-105 transition-transform duration-200"
                    onClick={() => (window.location.href = "/quizz")}
                  >
                    QUIZZES
                  </Button>
                </div>
              </div>
            </div>
          }
        />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/quizz" element={<QuizzPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
} 