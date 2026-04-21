/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from './services/supabase';
import { Question } from './types';
import { RefreshCw, Play, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [gameState, setGameState] = useState<'home' | 'playing' | 'gameOver'>('home');
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // We no longer fetch everything at once to avoid the 1000-row limit
    setLoading(false);
  }, []);

  const startNewGame = useCallback(async (level: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate ID range for the selected Sorta
      const minId = (level - 1) * 1000;
      const maxId = level === 4 ? 999999 : level * 1000;

      const { data, error: fetchError } = await supabase
        .from('atarikoa_questions')
        .select('*')
        .gt('id', minId)
        .lte('id', maxId)
        .limit(20);

      if (fetchError) throw fetchError;
      
      if (!data || data.length === 0) {
        throw new Error(`Ez da galderarik aurkitu ${level}. sortan ids (${minId}-${maxId})`);
      }

      const mappedQuestions = data.map(q => ({ ...q, level }));
      const shuffled = [...mappedQuestions].sort(() => 0.5 - Math.random());
      
      setGameQuestions(shuffled.slice(0, 5));
      setCurrentIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setGameState('playing');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore bat gertatu da galderak kargatzerakoan.");
      setGameState('home');
    } finally {
      setLoading(false);
    }
  }, []);

  const exitGame = () => {
    setGameState('home');
    setShowResult(false);
  };

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === gameQuestions[currentIndex].answer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < gameQuestions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setGameState('gameOver');
    }
  };

  // Standard Button style for all screens
  const buttonBaseStyle = "bg-white border-4 border-neutral-900 p-4 flex flex-col items-center text-center transition-all hover:shadow-[8px_8px_0_0_rgba(23,23,23,1)] shadow-[4px_4px_0_0_rgba(23,23,23,1)]";
  
  if (gameState === 'home') {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-neutral-900">
        <p className="text-blue-500 font-bold text-xs tracking-widest uppercase mb-2">Euskaraz Ikasten Lab</p>
        <h1 className="text-7xl font-extrabold text-neutral-900 mb-2 tracking-tighter">TEUSK</h1>
        <div className="w-40 h-3 bg-neutral-900 mb-16"></div>

        {error && (
            <div className="bg-red-100 border-4 border-red-900 p-4 mb-6 font-bold w-full max-w-4xl text-center">
              {error}
            </div>
        )}

        <div className="grid grid-cols-2 gap-8 w-full max-w-4xl mb-8">
            {[
                { level: 1, title: '1. SORTA', icon: '💎' },
                { level: 2, title: '2. SORTA', icon: '🌟' },
                { level: 3, title: '3. SORTA', icon: '🔥' },
                { level: 4, title: '4. SORTA', icon: '🚀' }
            ].map((item) => (
                <button
                    key={item.level}
                    onClick={() => startNewGame(item.level)}
                    className={buttonBaseStyle}
                >
                    <div className="w-16 h-16 rounded-full border-4 border-neutral-900 flex items-center justify-center text-3xl mb-6 bg-neutral-50">
                        {item.icon}
                    </div>
                    <span className="text-xl font-extrabold mb-1 tracking-tight">{item.title}</span>
                </button>
            ))}
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="bg-white border-4 border-neutral-900 p-12 w-full max-w-lg text-center shadow-[12px_12px_0_0_rgba(23,23,23,1)]">
          <Trophy size={64} className="mx-auto text-yellow-500 mb-6" />
          <h2 className="text-5xl font-extrabold text-neutral-900 mb-4 tracking-tighter">JOKOA AMAITU DA!</h2>
          <p className="text-2xl text-neutral-700 mb-10 font-bold">ZURE EMAITZA: <span className="font-extrabold text-indigo-600">{score} / 5</span></p>
          <button
            onClick={() => setGameState('home')}
            className="bg-white border-4 border-neutral-900 p-4 flex flex-col items-center text-center transition-all hover:shadow-[8px_8px_0_0_rgba(23,23,23,1)] shadow-[4px_4px_0_0_rgba(23,23,23,1)] w-full"
          >
            <RefreshCw size={24} className="mb-2"/>
            HASIERARA ITZULI
          </button>
        </div>
      </div>
    );
  }

  const question = gameQuestions[currentIndex];

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <button onClick={exitGame} className="bg-white border-4 border-neutral-900 p-2 shadow-[2px_2px_0_0_rgba(23,23,23,1)] hover:shadow-[4px_4px_0_0_rgba(23,23,23,1)] transition-all">
            <RefreshCw size={24} className="text-neutral-900" />
          </button>
          <div className="font-extrabold text-neutral-900 bg-white border-4 border-neutral-900 px-6 py-2 shadow-[4px_4px_0_0_rgba(23,23,23,1)] text-lg">
            {score} / 5
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white border-4 border-neutral-900 p-8 shadow-[8px_8px_0_0_rgba(23,23,23,1)]"
          >
            <div className="h-4 bg-neutral-200 border-2 border-neutral-900 mb-8 p-1">
              <div className="h-full bg-neutral-900 transition-all duration-300" style={{ width: `${((currentIndex + 1) / 5) * 100}%` }}></div>
            </div>
            
            <p className="text-sm text-neutral-500 font-bold mb-2 tracking-wider uppercase">Galdera {currentIndex + 1}</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 mb-8 tracking-tight">{question.question}</h2>

            <div className="space-y-4">
              {question.candidates.map((candidate, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === question.answer;
                
                let buttonStateClasses = "border-4 border-neutral-900 bg-white hover:bg-neutral-100";
                if (showResult) {
                  if (isCorrect) buttonStateClasses = "bg-green-400 border-4 border-neutral-900 text-neutral-900";
                  else if (isSelected) buttonStateClasses = "bg-red-400 border-4 border-neutral-900 text-neutral-900";
                  else buttonStateClasses = "bg-neutral-200 border-4 border-neutral-200 text-neutral-500";
                }

                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: showResult ? 1 : 1.01 }}
                    whileTap={{ scale: showResult ? 1 : 0.99 }}
                    onClick={() => handleAnswer(index)}
                    disabled={showResult}
                    transition={{ duration: 0.2 }}
                    className={`w-full text-left p-4 font-bold text-lg flex items-center shadow-[4px_4px_0_0_rgba(23,23,23,1)] ${buttonStateClasses}`}
                  >
                    <span className="w-10 h-10 flex items-center justify-center rounded-full bg-white border-4 border-neutral-900 text-neutral-900 font-extrabold mr-4">{String.fromCharCode(65 + index)}</span>
                    {candidate}
                  </motion.button>
                );
              })}
            </div>

            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <button
                  onClick={nextQuestion}
                  className="w-full bg-neutral-900 text-white py-4 font-extrabold text-lg shadow-[4px_4px_0_0_rgba(23,23,23,1)] hover:shadow-[8px_8px_0_0_rgba(23,23,23,1)] transition-all"
                >
                  HURRENGO GALDERA
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
