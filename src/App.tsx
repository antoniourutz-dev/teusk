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
  const [customCount, setCustomCount] = useState(20);

  useEffect(() => {
    // We no longer fetch everything at once to avoid the 1000-row limit
    setLoading(false);
  }, []);

  const startNewGame = useCallback(async (level: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Calculate ID range (Level 0 = All levels)
      let minId = 0;
      let maxId = 999999;
      if (level > 0) {
        minId = (level - 1) * 1000;
        maxId = level === 4 ? 999999 : level * 1000;
      }
      
      const gameLimit = level === 0 ? customCount : 5;

      // 2. Get total count of questions in this range
      const { count, error: countError } = await supabase
        .from('atarikoa_questions')
        .select('*', { count: 'exact', head: true })
        .gt('id', minId)
        .lte('id', maxId);

      if (countError) throw countError;
      const totalQuestions = count || 0;

      // 3. Calculate random offset
      const maxOffset = Math.max(0, totalQuestions - gameLimit);
      const randomOffset = Math.floor(Math.random() * (maxOffset + 1));

      // 4. Fetch the questions
      const { data, error: fetchError } = await supabase
        .from('atarikoa_questions')
        .select('*')
        .gt('id', minId)
        .lte('id', maxId)
        .range(randomOffset, randomOffset + gameLimit + 5); // Fetch a few extra for extra shuffling

      if (fetchError) throw fetchError;
      
      if (!data || data.length === 0) {
        throw new Error(`Ez da galderarik aurkitu. Hautatu beste sorta bat.`);
      }

      const mappedQuestions = data.map(q => ({ ...q, level }));
      const shuffled = [...mappedQuestions].sort(() => 0.5 - Math.random());
      
      setGameQuestions(shuffled.slice(0, gameLimit));
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 w-full max-w-4xl mb-8">
            {[
                { level: 1, title: '1. SORTA', icon: '💎' },
                { level: 2, title: '2. SORTA', icon: '🌟' },
                { level: 3, title: '3. SORTA', icon: '🔥' },
                { level: 4, title: '4. SORTA', icon: '🚀' }
            ].map((item) => (
                <button
                    key={item.level}
                    onClick={() => startNewGame(item.level)}
                    className={`${buttonBaseStyle} py-6`}
                >
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border-4 border-neutral-900 flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6 bg-neutral-50">
                        {item.icon}
                    </div>
                    <span className="text-lg md:text-xl font-extrabold mb-1 tracking-tight">{item.title}</span>
                </button>
            ))}
            
            <div className="col-span-1 sm:col-span-2 bg-indigo-50 border-4 border-neutral-900 p-6 md:p-8 shadow-[8px_8px_0_0_rgba(23,23,23,1)]">
              <div className="flex flex-col items-stretch justify-between gap-6 md:gap-8">
                <div className="w-full">
                  <div className="flex justify-between items-center mb-6">
                    <label className="font-extrabold text-xl md:text-2xl tracking-tighter uppercase">Galdera kopurua</label>
                    <span className="text-3xl md:text-5xl font-black text-indigo-600 bg-white border-4 border-neutral-900 px-4 py-1 shadow-[4px_4px_0_0_rgba(23,23,23,1)]">{customCount}</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="50" 
                    step="5"
                    value={customCount}
                    onChange={(e) => setCustomCount(parseInt(e.target.value))}
                    className="w-full h-8 bg-white border-4 border-neutral-900 appearance-none cursor-pointer accent-neutral-900 
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-10 [&::-webkit-slider-thumb]:h-10 
                      [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-neutral-900
                      [&::-moz-range-thumb]:w-10 [&::-moz-range-thumb]:h-10 [&::-moz-range-thumb]:bg-indigo-500 [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-neutral-900"
                  />
                </div>
                <button
                  onClick={() => startNewGame(0)}
                  className={`${buttonBaseStyle} bg-indigo-500 text-white border-indigo-900 hover:bg-indigo-600 w-full py-6 md:py-8`}
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-white flex items-center justify-center text-2xl md:text-3xl mb-3 md:mb-4 bg-indigo-400">
                      ⚙️
                  </div>
                  <span className="text-xl md:text-3xl font-black tracking-tighter leading-none">MODO PERTSONALIZATUA</span>
                </button>
              </div>
            </div>
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
          <p className="text-2xl text-neutral-700 mb-10 font-bold">ZURE EMAITZA: <span className="font-extrabold text-indigo-600">{score} / {gameQuestions.length}</span></p>
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
            {score} / {gameQuestions.length}
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
              <div className="h-full bg-neutral-900 transition-all duration-300" style={{ width: `${((currentIndex + 1) / gameQuestions.length) * 100}%` }}></div>
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
