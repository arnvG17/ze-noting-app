import * as React from "react";
import { BackgroundPaths } from "../ui/background-paths";

export function NotesPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-neutral-950">
      <BackgroundPaths title="NOTES" />
      <div className="relative z-20 container mx-auto mt-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Your Notes</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">Start adding and managing your notes here.</p>
      </div>
    </div>
  );
} 