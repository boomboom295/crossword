import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, CheckCircle2 } from "lucide-react";

const palette = {
  sage: "#729EA1",
  black: "#000000",
  coral: "#CF5C36",
  blush: "#EEE5E9",
  plum: "#7B4B94",
};

const words = [
  { number: 1, direction: "down", clue: "My fav dish you make", answer: "CAULIFLOWERPURPLE", row: 0, col: 1 },
  { number: 2, direction: "across", clue: "Terrible vday restaurant", answer: "YUZU", row: 1, col: 0 },
  { number: 3, direction: "across", clue: "Our restaurant", answer: "THECOMMONER", row: 5, col: 4 },
  { number: 3, direction: "down", clue: "My fav flower", answer: "TULIP", row: 5, col: 4 },
  { number: 4, direction: "down", clue: "Location of our first date", answer: "BRIDGEWATER", row: 6, col: 18 },
  { number: 5, direction: "down", clue: "Dish we had at commoner the first time", answer: "CHICKEN", row: 6, col: 21 },
  { number: 6, direction: "down", clue: "The game I asked you out over", answer: "MINECRAFT", row: 7, col: 8 },
  { number: 7, direction: "across", clue: "The surprise", answer: "PROMISERING", row: 8, col: 0 },
  { number: 7, direction: "down", clue: "My fav color", answer: "PURPLE", row: 8, col: 0 },
  { number: 8, direction: "across", clue: "Name of our first child", answer: "ILLIA", row: 8, col: 18 },
  { number: 9, direction: "down", clue: "Your fav flower", answer: "LILYOFTHEVALLEY", row: 10, col: 2 },
  { number: 10, direction: "across", clue: "Your fav color", answer: "BLUE", row: 11, col: 13 },
  { number: 10, direction: "down", clue: "One of your fav minecraft mob (Trans/Pan____)", answer: "BEE", row: 11, col: 13 },
  { number: 11, direction: "across", clue: "Day we met", answer: "TWELVE", row: 11, col: 17 },
  { number: 12, direction: "down", clue: "The body part you love", answer: "BICEP", row: 12, col: 10 },
  { number: 13, direction: "across", clue: "The name of our biological kid", answer: "SERAPHINA", row: 13, col: 12 },
  { number: 14, direction: "down", clue: "My fav minecraft mob", answer: "PHANTOM", row: 13, col: 16 },
  { number: 15, direction: "down", clue: "Your fav new egg food", answer: "MUNCHKINS", row: 14, col: 6 },
  { number: 16, direction: "across", clue: "First gift I ever gave you", answer: "TURTLE", row: 15, col: 4 },
  { number: 17, direction: "across", clue: "A fruit that I call you", answer: "PUMPKIN", row: 16, col: 10 },
  { number: 18, direction: "across", clue: "Name of our second child", answer: "LYRA", row: 16, col: 18 },
  { number: 19, direction: "across", clue: "First gift you ever gave me", answer: "FLOWERS", row: 18, col: 14 },
  { number: 19, direction: "down", clue: "First date dish", answer: "FRIES", row: 18, col: 14 },
  { number: 20, direction: "across", clue: "The gemstone you want", answer: "ALEXANDRITE", row: 21, col: 0 },
];

const rows = 24;
const cols = 24;

function keyForCell(r, c) {
  return `${r}-${c}`;
}

function buildGrid() {
  const map = new Map();

  words.forEach((word) => {
    const len = word.answer.length;
    for (let i = 0; i < len; i++) {
      const r = word.row + (word.direction === "down" ? i : 0);
      const c = word.col + (word.direction === "across" ? i : 0);
      const key = keyForCell(r, c);
      const existing = map.get(key);
      const cell = existing || {
        row: r,
        col: c,
        solution: word.answer[i],
        guess: "",
        numbers: [],
        across: null,
        down: null,
      };

      cell.solution = word.answer[i];
      if (i === 0) cell.numbers.push(word.number);
      if (word.direction === "across") cell.across = `${word.number}-across`;
      if (word.direction === "down") cell.down = `${word.number}-down`;

      map.set(key, cell);
    }
  });

  return map;
}

function getCellsForWord(word, gridMap) {
  return Array.from({ length: word.answer.length }, (_, i) => {
    const r = word.row + (word.direction === "down" ? i : 0);
    const c = word.col + (word.direction === "across" ? i : 0);
    return gridMap.get(keyForCell(r, c));
  });
}

function playDing() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = "sine";
  osc2.type = "triangle";
  osc1.frequency.setValueAtTime(880, now);
  osc2.frequency.setValueAtTime(1320, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.45);
  osc2.stop(now + 0.45);
}

function launchConfetti(setBursts) {
  const burst = Array.from({ length: 40 }, (_, i) => ({
    id: `${Date.now()}-${i}`,
    left: Math.random() * 100,
    delay: Math.random() * 0.2,
    duration: 1.8 + Math.random() * 1.1,
    rotate: -180 + Math.random() * 360,
    drift: -120 + Math.random() * 240,
    size: 8 + Math.random() * 10,
    shape: Math.random() > 0.5 ? "50%" : "6px",
    opacity: 0.8 + Math.random() * 0.2,
  }));

  setBursts((prev) => [...prev, ...burst]);
  window.setTimeout(() => {
    setBursts((prev) => prev.filter((p) => !burst.some((b) => b.id === p.id)));
  }, 3200);
}

export default function SahanaCrosswordWebsite() {
  const gridMap = useMemo(() => buildGrid(), []);
  const [guesses, setGuesses] = useState(() => {
    const initial = {};
    gridMap.forEach((cell, key) => {
      initial[key] = "";
    });
    return initial;
  });
  const [selectedWordId, setSelectedWordId] = useState("2-across");
  const [selectedCellKey, setSelectedCellKey] = useState(keyForCell(1, 0));
  const [solvedWords, setSolvedWords] = useState({});
  const [bursts, setBursts] = useState([]);
  const [showSolvedBanner, setShowSolvedBanner] = useState(false);
  const refs = useRef({});

  const selectedWord = words.find((w) => `${w.number}-${w.direction}` === selectedWordId) || words[0];

  const completedCount = words.filter((word) => {
    const cells = getCellsForWord(word, gridMap);
    return cells.every((cell, i) => guesses[keyForCell(cell.row, cell.col)] === word.answer[i]);
  }).length;

  useEffect(() => {
    words.forEach((word) => {
      const id = `${word.number}-${word.direction}`;
      const cells = getCellsForWord(word, gridMap);
      const isSolved = cells.every((cell, i) => guesses[keyForCell(cell.row, cell.col)] === word.answer[i]);

      if (isSolved && !solvedWords[id]) {
        setSolvedWords((prev) => ({ ...prev, [id]: true }));
        playDing();
        launchConfetti(setBursts);
      }
    });
  }, [guesses, gridMap, solvedWords]);

  useEffect(() => {
    if (completedCount === words.length) {
      setShowSolvedBanner(true);
    }
  }, [completedCount]);

  function selectWord(word) {
    const id = `${word.number}-${word.direction}`;
    setSelectedWordId(id);
    setSelectedCellKey(keyForCell(word.row, word.col));
    refs.current[keyForCell(word.row, word.col)]?.focus();
  }

  function moveWithinWord(currentKey, directionStep = 1) {
    const current = gridMap.get(currentKey);
    if (!current || !selectedWord) return;

    const cells = getCellsForWord(selectedWord, gridMap);
    const index = cells.findIndex((cell) => keyForCell(cell.row, cell.col) === currentKey);
    const nextIndex = Math.max(0, Math.min(cells.length - 1, index + directionStep));
    const nextCell = cells[nextIndex];
    if (nextCell) {
      const nextKey = keyForCell(nextCell.row, nextCell.col);
      setSelectedCellKey(nextKey);
      refs.current[nextKey]?.focus();
    }
  }

  function handleCellClick(cell) {
    const key = keyForCell(cell.row, cell.col);
    if (selectedCellKey === key) {
      const toggled = selectedWord?.direction === "across" ? cell.down || cell.across : cell.across || cell.down;
      if (toggled) setSelectedWordId(toggled);
    } else {
      setSelectedCellKey(key);
      setSelectedWordId(cell.across || cell.down);
    }
  }

  function handleInput(cell, value) {
    const key = keyForCell(cell.row, cell.col);
    const letter = value.slice(-1).toUpperCase().replace(/[^A-Z]/g, "");
    setGuesses((prev) => ({ ...prev, [key]: letter }));
    if (letter) moveWithinWord(key, 1);
  }

  function handleKeyDown(e, cell) {
    const key = keyForCell(cell.row, cell.col);
    if (e.key === "Backspace") {
      if (guesses[key]) {
        setGuesses((prev) => ({ ...prev, [key]: "" }));
      } else {
        moveWithinWord(key, -1);
      }
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      setSelectedWordId(cell.across || selectedWordId);
      moveWithinWord(key, 1);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSelectedWordId(cell.across || selectedWordId);
      moveWithinWord(key, -1);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedWordId(cell.down || selectedWordId);
      const downWord = words.find((w) => `${w.number}-${w.direction}` === (cell.down || selectedWordId));
      if (downWord) {
        const cells = getCellsForWord(downWord, gridMap);
        const currentIndex = cells.findIndex((c) => keyForCell(c.row, c.col) === key);
        const next = cells[Math.min(cells.length - 1, currentIndex + 1)];
        if (next) {
          const nextKey = keyForCell(next.row, next.col);
          setSelectedCellKey(nextKey);
          refs.current[nextKey]?.focus();
        }
      }
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedWordId(cell.down || selectedWordId);
      const downWord = words.find((w) => `${w.number}-${w.direction}` === (cell.down || selectedWordId));
      if (downWord) {
        const cells = getCellsForWord(downWord, gridMap);
        const currentIndex = cells.findIndex((c) => keyForCell(c.row, c.col) === key);
        const next = cells[Math.max(0, currentIndex - 1)];
        if (next) {
          const nextKey = keyForCell(next.row, next.col);
          setSelectedCellKey(nextKey);
          refs.current[nextKey]?.focus();
        }
      }
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const currentIndex = words.findIndex((w) => `${w.number}-${w.direction}` === selectedWordId);
      const nextWord = words[(currentIndex + 1) % words.length];
      selectWord(nextWord);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const currentIndex = words.findIndex((w) => `${w.number}-${w.direction}` === selectedWordId);
      const nextWord = words[(currentIndex + 1) % words.length];
      selectWord(nextWord);
    }
  }

  function revealCurrentWord() {
    const cells = getCellsForWord(selectedWord, gridMap);
    const next = { ...guesses };
    cells.forEach((cell, i) => {
      next[keyForCell(cell.row, cell.col)] = selectedWord.answer[i];
    });
    setGuesses(next);
  }

  function resetPuzzle() {
    const emptied = {};
    gridMap.forEach((_, key) => {
      emptied[key] = "";
    });
    setGuesses(emptied);
    setSolvedWords({});
    setShowSolvedBanner(false);
    setSelectedWordId("2-across");
    setSelectedCellKey(keyForCell(1, 0));
  }

  const selectedWordCells = new Set(
    selectedWord ? getCellsForWord(selectedWord, gridMap).map((cell) => keyForCell(cell.row, cell.col)) : []
  );

  return (
    <div
      className="min-h-screen w-full overflow-hidden"
      style={{
        background: `radial-gradient(circle at top, ${palette.blush}, white 38%, ${palette.blush} 100%)`,
        color: palette.black,
      }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(114,158,161,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(114,158,161,0.10) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <AnimatePresence>
          {bursts.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{ y: -30, x: 0, opacity: 0 }}
              animate={{ y: 520, x: piece.drift, rotate: piece.rotate, opacity: [0, piece.opacity, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: piece.duration, delay: piece.delay, ease: "easeOut" }}
              className="absolute top-0"
              style={{
                left: `${piece.left}%`,
                width: piece.size,
                height: piece.size * 1.4,
                borderRadius: piece.shape,
                background: [palette.sage, palette.coral, palette.plum, palette.blush][
                  Math.floor(Math.random() * 4)
                ],
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 overflow-hidden rounded-[2rem] border shadow-2xl"
          style={{ borderColor: `${palette.sage}55`, background: "rgba(255,255,255,0.82)", backdropFilter: "blur(18px)" }}
        >
          <div className="grid gap-8 p-6 md:grid-cols-[1.3fr_0.9fr] md:p-8">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                style={{ background: `${palette.plum}14`, color: palette.plum }}>
                <Heart className="h-4 w-4" /> Sahana crossword
              </div>

              <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                A soft, romantic
                <span style={{ color: palette.coral }}> crossword moment</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 md:text-base" style={{ color: "rgba(0,0,0,0.72)" }}>
                Fill in the clues, get a tiny celebratory ding, and watch confetti drift across the page whenever a word is completed.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={revealCurrentWord}
                  className="rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5"
                  style={{ background: palette.coral, color: "white" }}
                >
                  Reveal current word
                </button>
                <button
                  onClick={resetPuzzle}
                  className="rounded-full border px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                  style={{ borderColor: `${palette.sage}70`, color: palette.black, background: "white" }}
                >
                  Reset puzzle
                </button>
              </div>
            </div>

            <div className="rounded-[1.75rem] border p-5 shadow-lg" style={{ borderColor: `${palette.plum}25`, background: `${palette.blush}99` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em]" style={{ color: palette.plum }}>Progress</p>
                  <p className="mt-2 text-3xl font-semibold">{completedCount} / {words.length}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: `${palette.sage}18`, color: palette.sage }}>
                  <Sparkles className="h-8 w-8" />
                </div>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full" style={{ background: `${palette.sage}20` }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / words.length) * 100}%` }}
                  style={{ background: `linear-gradient(90deg, ${palette.sage}, ${palette.plum})` }}
                />
              </div>
              <p className="mt-4 text-sm leading-6" style={{ color: "rgba(0,0,0,0.7)" }}>
                Tip: click a square to switch direction, use arrow keys to move, and press Tab or Enter to jump to the next clue.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="rounded-[2rem] border p-4 shadow-2xl md:p-6"
            style={{ borderColor: `${palette.sage}50`, background: "rgba(255,255,255,0.9)" }}
          >
            <div className="overflow-auto rounded-[1.5rem] border p-3 md:p-4" style={{ borderColor: `${palette.sage}30`, background: `${palette.blush}66` }}>
              <div
                className="grid min-w-[840px] gap-1"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: rows * cols }, (_, index) => {
                  const r = Math.floor(index / cols);
                  const c = index % cols;
                  const key = keyForCell(r, c);
                  const cell = gridMap.get(key);

                  if (!cell) {
                    return <div key={key} className="aspect-square rounded-md opacity-0" />;
                  }

                  const guess = guesses[key] || "";
                  const isSelected = selectedCellKey === key;
                  const inSelectedWord = selectedWordCells.has(key);
                  const isCorrect = guess && guess === cell.solution;

                  return (
                    <button
                      key={key}
                      onClick={() => handleCellClick(cell)}
                      className="relative aspect-square rounded-lg border transition focus:outline-none"
                      style={{
                        borderColor: isSelected ? palette.coral : `${palette.black}45`,
                        background: isSelected
                          ? `${palette.coral}18`
                          : inSelectedWord
                            ? `${palette.sage}18`
                            : "white",
                        boxShadow: isSelected ? `0 0 0 2px ${palette.coral}30` : "none",
                      }}
                    >
                      {cell.numbers.length > 0 && (
                        <span className="absolute left-1 top-0.5 text-[10px] font-semibold" style={{ color: palette.plum }}>
                          {cell.numbers[0]}
                        </span>
                      )}
                      <input
                        ref={(el) => (refs.current[key] = el)}
                        value={guess}
                        onChange={(e) => handleInput(cell, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, cell)}
                        onFocus={() => {
                          setSelectedCellKey(key);
                          setSelectedWordId(cell.across || cell.down);
                        }}
                        maxLength={1}
                        className="h-full w-full bg-transparent text-center text-lg font-semibold uppercase outline-none md:text-xl"
                        style={{ color: isCorrect ? palette.plum : palette.black, caretColor: palette.coral }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="rounded-[2rem] border p-5 shadow-xl" style={{ borderColor: `${palette.plum}35`, background: "rgba(255,255,255,0.92)" }}>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl p-2" style={{ background: `${palette.coral}14`, color: palette.coral }}>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em]" style={{ color: palette.plum }}>Selected clue</p>
                  <h2 className="mt-1 text-xl font-semibold">
                    {selectedWord.number} {selectedWord.direction}
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-base leading-7">{selectedWord.clue}</p>
              <p className="mt-3 text-sm" style={{ color: "rgba(0,0,0,0.62)" }}>
                {selectedWord.answer.length} letters
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-[2rem] border p-5 shadow-xl" style={{ borderColor: `${palette.sage}38`, background: "rgba(255,255,255,0.92)" }}>
                <h3 className="mb-4 text-lg font-semibold">Across</h3>
                <div className="space-y-3">
                  {words.filter((w) => w.direction === "across").map((word) => {
                    const id = `${word.number}-${word.direction}`;
                    const active = selectedWordId === id;
                    return (
                      <button
                        key={id}
                        onClick={() => selectWord(word)}
                        className="w-full rounded-2xl border p-3 text-left transition hover:-translate-y-0.5"
                        style={{
                          borderColor: active ? palette.coral : `${palette.black}12`,
                          background: active ? `${palette.coral}10` : `${palette.blush}55`,
                        }}
                      >
                        <p className="text-sm font-semibold" style={{ color: active ? palette.coral : palette.plum }}>
                          {word.number}
                        </p>
                        <p className="mt-1 text-sm leading-6">{word.clue}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[2rem] border p-5 shadow-xl" style={{ borderColor: `${palette.sage}38`, background: "rgba(255,255,255,0.92)" }}>
                <h3 className="mb-4 text-lg font-semibold">Down</h3>
                <div className="space-y-3">
                  {words.filter((w) => w.direction === "down").map((word) => {
                    const id = `${word.number}-${word.direction}`;
                    const active = selectedWordId === id;
                    return (
                      <button
                        key={id}
                        onClick={() => selectWord(word)}
                        className="w-full rounded-2xl border p-3 text-left transition hover:-translate-y-0.5"
                        style={{
                          borderColor: active ? palette.plum : `${palette.black}12`,
                          background: active ? `${palette.plum}10` : `${palette.blush}55`,
                        }}
                      >
                        <p className="text-sm font-semibold" style={{ color: active ? palette.plum : palette.coral }}>
                          {word.number}
                        </p>
                        <p className="mt-1 text-sm leading-6">{word.clue}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showSolvedBanner && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-[1.75rem] border px-6 py-4 shadow-2xl"
            style={{ background: "rgba(255,255,255,0.95)", borderColor: `${palette.coral}40` }}
          >
            <div className="flex items-center gap-4">
              <div className="rounded-2xl p-3" style={{ background: `${palette.coral}14`, color: palette.coral }}>
                <Heart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-semibold">Puzzle complete ✨</p>
                <p className="text-sm" style={{ color: "rgba(0,0,0,0.68)" }}>
                  Every clue is filled in. Tiny celebration officially unlocked.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
