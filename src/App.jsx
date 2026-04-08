import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Sparkles } from "lucide-react";

const palette = {
  sage: "#729EA1",
  black: "#000000",
  coral: "#CF5C36",
  blush: "#EEE5E9",
  plum: "#7B4B94",
};

const words = [
  { number: 1, direction: "down", clue: "My fav dish you make", answer: "CAULIFLOWER", row: 0, col: 1 },
  { number: 2, direction: "across", clue: "Terrible vday restaurant", answer: "YUZU", row: 2, col: 0 },
  { number: 3, direction: "across", clue: "Our restaurant", answer: "THECOMMONER", row: 7, col: 4 },
  { number: 3, direction: "down", clue: "My fav flower", answer: "TULIP", row: 7, col: 4 },
  { number: 4, direction: "down", clue: "Location of our first date", answer: "BRIDGEWATER", row: 8, col: 20 },
  { number: 5, direction: "down", clue: "Dish we had at commoner the first time", answer: "CHICKEN", row: 8, col: 23 },
  { number: 6, direction: "down", clue: "The game I asked you out over", answer: "MINECRAFT", row: 9, col: 8 },
  { number: 7, direction: "across", clue: "The surprise", answer: "PROMISERING", row: 10, col: 0 },
  { number: 7, direction: "down", clue: "My fav color", answer: "PURPLE", row: 10, col: 0 },
  { number: 8, direction: "across", clue: "Name of our first child", answer: "ILLIA", row: 10, col: 20 },
  { number: 9, direction: "down", clue: "Your fav flower", answer: "LILYOFTHEVALLEY", row: 12, col: 2 },
  { number: 10, direction: "across", clue: "Your fav color", answer: "BLUE", row: 13, col: 13 },
  { number: 10, direction: "down", clue: "One of your fav minecraft mob (Trans/Pan____)", answer: "BEE", row: 13, col: 13 },
  { number: 11, direction: "across", clue: "Day we met", answer: "TWELVE", row: 13, col: 18 },
  { number: 12, direction: "down", clue: "The body part you love", answer: "BICEP", row: 14, col: 10 },
  { number: 13, direction: "across", clue: "The name of our biological kid", answer: "SERAPHINA", row: 15, col: 12 },
  { number: 14, direction: "down", clue: "My fav minecraft mob", answer: "PHANTOM", row: 15, col: 16 },
  { number: 15, direction: "down", clue: "Your fav new egg food", answer: "MUNCHKINS", row: 16, col: 6 },
  { number: 16, direction: "across", clue: "First gift I ever gave you", answer: "TURTLE", row: 17, col: 5 },
  { number: 17, direction: "across", clue: "A fruit that I call you", answer: "PUMPKIN", row: 18, col: 10 },
  { number: 18, direction: "across", clue: "Name of our second child", answer: "LYRA", row: 18, col: 18 },
  { number: 19, direction: "across", clue: "First gift you ever gave me", answer: "FLOWERS", row: 20, col: 14 },
  { number: 19, direction: "down", clue: "First date dish", answer: "FRIES", row: 20, col: 14 },
  { number: 20, direction: "across", clue: "The gemstone you want", answer: "ALEXANDRITE", row: 23, col: 1 },
];

const ROWS = 27;
const COLS = 25;
const CELL = 36;

const cellKey = (row, col) => `${row}-${col}`;
const wordId = (word) => `${word.number}-${word.direction}`;

function buildGrid() {
  const map = new Map();

  for (const word of words) {
    for (let i = 0; i < word.answer.length; i += 1) {
      const row = word.row + (word.direction === "down" ? i : 0);
      const col = word.col + (word.direction === "across" ? i : 0);
      const key = cellKey(row, col);
      const existing = map.get(key) || {
        row,
        col,
        solution: word.answer[i],
        guess: "",
        number: null,
        across: null,
        down: null,
      };

      existing.solution = word.answer[i];
      if (i === 0) existing.number = word.number;
      if (word.direction === "across") existing.across = wordId(word);
      if (word.direction === "down") existing.down = wordId(word);

      map.set(key, existing);
    }
  }

  return map;
}

function getCellsForWord(word, grid) {
  return Array.from({ length: word.answer.length }, (_, i) => {
    const row = word.row + (word.direction === "down" ? i : 0);
    const col = word.col + (word.direction === "across" ? i : 0);
    return grid.get(cellKey(row, col));
  });
}

function playDing() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  const oscA = ctx.createOscillator();
  const oscB = ctx.createOscillator();

  oscA.type = "sine";
  oscB.type = "triangle";
  oscA.frequency.setValueAtTime(880, now);
  oscB.frequency.setValueAtTime(1320, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.13, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

  oscA.connect(gain);
  oscB.connect(gain);
  gain.connect(ctx.destination);

  oscA.start(now);
  oscB.start(now);
  oscA.stop(now + 0.42);
  oscB.stop(now + 0.42);
}

function createConfetti() {
  return Array.from({ length: 32 }, (_, index) => ({
    id: `${Date.now()}-${index}`,
    left: 6 + Math.random() * 88,
    drift: -90 + Math.random() * 180,
    rotate: -180 + Math.random() * 360,
    duration: 1.8 + Math.random() * 1.2,
    delay: Math.random() * 0.15,
    size: 7 + Math.random() * 8,
    borderRadius: Math.random() > 0.55 ? "999px" : "6px",
  }));
}

export default function App() {
  const grid = useMemo(() => buildGrid(), []);
  const [guesses, setGuesses] = useState(() => {
    const next = {};
    grid.forEach((_, key) => {
      next[key] = "";
    });
    return next;
  });
  const [selectedWordId, setSelectedWordId] = useState("2-across");
  const [selectedCell, setSelectedCell] = useState(cellKey(2, 0));
  const [solved, setSolved] = useState({});
  const [confetti, setConfetti] = useState([]);
  const [finished, setFinished] = useState(false);
  const refs = useRef({});

  const selectedWord = words.find((item) => wordId(item) === selectedWordId) || words[0];
  const selectedWordCells = new Set(getCellsForWord(selectedWord, grid).map((cell) => cellKey(cell.row, cell.col)));

  const solvedCount = words.filter((word) => {
    const cells = getCellsForWord(word, grid);
    return cells.every((cell, index) => guesses[cellKey(cell.row, cell.col)] === word.answer[index]);
  }).length;

  useEffect(() => {
    for (const word of words) {
      const id = wordId(word);
      const cells = getCellsForWord(word, grid);
      const isSolved = cells.every((cell, index) => guesses[cellKey(cell.row, cell.col)] === word.answer[index]);

      if (isSolved && !solved[id]) {
        setSolved((prev) => ({ ...prev, [id]: true }));
        playDing();
        const burst = createConfetti();
        setConfetti((prev) => [...prev, ...burst]);
        window.setTimeout(() => {
          setConfetti((prev) => prev.filter((piece) => !burst.some((item) => item.id === piece.id)));
        }, 3200);
      }
    }
  }, [guesses, grid, solved]);

  useEffect(() => {
    if (solvedCount === words.length) {
      setFinished(true);
    }
  }, [solvedCount]);

  function focusCell(key) {
    setSelectedCell(key);
    window.requestAnimationFrame(() => refs.current[key]?.focus());
  }

  function selectWord(word) {
    setSelectedWordId(wordId(word));
    focusCell(cellKey(word.row, word.col));
  }

  function moveInsideWord(currentKey, step) {
    const cells = getCellsForWord(selectedWord, grid);
    const index = cells.findIndex((cell) => cellKey(cell.row, cell.col) === currentKey);
    if (index === -1) return;
    const next = cells[Math.max(0, Math.min(cells.length - 1, index + step))];
    if (next) focusCell(cellKey(next.row, next.col));
  }

  function handleCellClick(cell) {
    const key = cellKey(cell.row, cell.col);
    if (selectedCell === key) {
      const toggled = selectedWord.direction === "across" ? cell.down || cell.across : cell.across || cell.down;
      if (toggled) setSelectedWordId(toggled);
    } else {
      setSelectedCell(key);
      setSelectedWordId(cell.across || cell.down);
    }
    refs.current[key]?.focus();
  }

  function handleInput(cell, raw) {
    const key = cellKey(cell.row, cell.col);
    const letter = raw.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    setGuesses((prev) => ({ ...prev, [key]: letter }));
    if (letter) moveInsideWord(key, 1);
  }

  function handleKeyDown(event, cell) {
    const key = cellKey(cell.row, cell.col);

    if (event.key === "Backspace") {
      if (guesses[key]) {
        setGuesses((prev) => ({ ...prev, [key]: "" }));
      } else {
        moveInsideWord(key, -1);
      }
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (cell.across) setSelectedWordId(cell.across);
      const word = words.find((item) => wordId(item) === (cell.across || selectedWordId));
      if (!word) return;
      const cells = getCellsForWord(word, grid);
      const index = cells.findIndex((item) => cellKey(item.row, item.col) === key);
      const next = cells[Math.min(cells.length - 1, index + 1)];
      if (next) focusCell(cellKey(next.row, next.col));
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (cell.across) setSelectedWordId(cell.across);
      const word = words.find((item) => wordId(item) === (cell.across || selectedWordId));
      if (!word) return;
      const cells = getCellsForWord(word, grid);
      const index = cells.findIndex((item) => cellKey(item.row, item.col) === key);
      const next = cells[Math.max(0, index - 1)];
      if (next) focusCell(cellKey(next.row, next.col));
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (cell.down) setSelectedWordId(cell.down);
      const word = words.find((item) => wordId(item) === (cell.down || selectedWordId));
      if (!word) return;
      const cells = getCellsForWord(word, grid);
      const index = cells.findIndex((item) => cellKey(item.row, item.col) === key);
      const next = cells[Math.min(cells.length - 1, index + 1)];
      if (next) focusCell(cellKey(next.row, next.col));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (cell.down) setSelectedWordId(cell.down);
      const word = words.find((item) => wordId(item) === (cell.down || selectedWordId));
      if (!word) return;
      const cells = getCellsForWord(word, grid);
      const index = cells.findIndex((item) => cellKey(item.row, item.col) === key);
      const next = cells[Math.max(0, index - 1)];
      if (next) focusCell(cellKey(next.row, next.col));
    }

    if (event.key === "Tab" || event.key === "Enter") {
      event.preventDefault();
      const currentIndex = words.findIndex((item) => wordId(item) === selectedWordId);
      selectWord(words[(currentIndex + 1) % words.length]);
    }
  }

  function revealSelected() {
    const next = { ...guesses };
    getCellsForWord(selectedWord, grid).forEach((cell, index) => {
      next[cellKey(cell.row, cell.col)] = selectedWord.answer[index];
    });
    setGuesses(next);
  }

  function resetPuzzle() {
    const next = {};
    grid.forEach((_, key) => {
      next[key] = "";
    });
    setGuesses(next);
    setSolved({});
    setFinished(false);
    setSelectedWordId("2-across");
    focusCell(cellKey(2, 0));
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at top, ${palette.blush} 0%, #fff 42%, ${palette.blush} 100%)`,
        color: palette.black,
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        button, input { font: inherit; }
        .shell {
          max-width: 1420px;
          margin: 0 auto;
          padding: 28px;
          position: relative;
        }
        .hero, .panel {
          background: rgba(255,255,255,0.86);
          backdrop-filter: blur(18px);
          border: 1px solid rgba(114,158,161,0.35);
          box-shadow: 0 24px 80px rgba(0,0,0,0.08);
          border-radius: 32px;
        }
        .hero {
          padding: 28px;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        .layout {
          display: grid;
          grid-template-columns: minmax(760px, 1.15fr) minmax(320px, 0.85fr);
          gap: 24px;
          align-items: start;
        }
        .boardWrap {
          overflow: auto;
          border-radius: 28px;
          padding: 20px;
          border: 1px solid rgba(114,158,161,0.28);
          background: linear-gradient(180deg, rgba(238,229,233,0.72), rgba(255,255,255,0.9));
        }
        .board {
          display: grid;
          grid-template-columns: repeat(${COLS}, ${CELL}px);
          grid-template-rows: repeat(${ROWS}, ${CELL}px);
          gap: 0;
          width: max-content;
          margin: 0 auto;
          position: relative;
        }
        .empty {
          width: ${CELL}px;
          height: ${CELL}px;
        }
        .cell {
          width: ${CELL}px;
          height: ${CELL}px;
          border: 1.5px solid rgba(0,0,0,0.72);
          background: white;
          position: relative;
          padding: 0;
          border-radius: 0;
        }
        .cell:hover {
          background: rgba(238,229,233,0.75);
        }
        .cell.selected {
          background: rgba(207,92,54,0.14);
          box-shadow: inset 0 0 0 2px rgba(207,92,54,0.5);
          z-index: 2;
        }
        .cell.inWord {
          background: rgba(114,158,161,0.14);
        }
        .cell.correct input {
          color: ${palette.plum};
        }
        .number {
          position: absolute;
          top: 2px;
          left: 4px;
          font-size: 10px;
          line-height: 1;
          font-weight: 700;
          color: ${palette.plum};
          pointer-events: none;
        }
        .letter {
          width: 100%;
          height: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          text-align: center;
          padding-top: 8px;
          font-size: 21px;
          font-weight: 700;
          text-transform: uppercase;
          color: ${palette.black};
          caret-color: ${palette.coral};
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(123,75,148,0.12);
          color: ${palette.plum};
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
        }
        .title {
          font-size: clamp(36px, 5vw, 62px);
          line-height: 0.96;
          margin: 14px 0 12px;
          letter-spacing: -0.04em;
        }
        .muted {
          color: rgba(0,0,0,0.68);
          line-height: 1.7;
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 18px;
        }
        .primary, .secondary, .clueButton {
          border: 0;
          cursor: pointer;
          transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
        }
        .primary:hover, .secondary:hover, .clueButton:hover {
          transform: translateY(-1px);
        }
        .primary {
          background: ${palette.coral};
          color: white;
          padding: 12px 18px;
          border-radius: 999px;
          font-weight: 700;
          box-shadow: 0 14px 30px rgba(207,92,54,0.25);
        }
        .secondary {
          background: white;
          color: ${palette.black};
          padding: 12px 18px;
          border-radius: 999px;
          border: 1px solid rgba(114,158,161,0.55);
          font-weight: 700;
        }
        .progressBox {
          border-radius: 28px;
          padding: 20px;
          background: rgba(238,229,233,0.86);
          border: 1px solid rgba(123,75,148,0.18);
        }
        .progressTrack {
          margin-top: 16px;
          width: 100%;
          height: 12px;
          background: rgba(114,158,161,0.18);
          border-radius: 999px;
          overflow: hidden;
        }
        .sideStack {
          display: grid;
          gap: 18px;
        }
        .selectedCard {
          padding: 22px;
          border-radius: 28px;
          border: 1px solid rgba(123,75,148,0.25);
          background: rgba(255,255,255,0.92);
        }
        .clueGrid {
          display: grid;
          gap: 18px;
          grid-template-columns: 1fr 1fr;
        }
        .cluePanel {
          padding: 20px;
          border-radius: 28px;
          border: 1px solid rgba(114,158,161,0.28);
          background: rgba(255,255,255,0.92);
        }
        .clueList {
          display: grid;
          gap: 10px;
        }
        .clueButton {
          width: 100%;
          text-align: left;
          padding: 12px 14px;
          border-radius: 18px;
          background: rgba(238,229,233,0.64);
          border: 1px solid rgba(0,0,0,0.07);
        }
        .clueButton.activeAcross {
          background: rgba(207,92,54,0.12);
          border-color: rgba(207,92,54,0.35);
        }
        .clueButton.activeDown {
          background: rgba(123,75,148,0.12);
          border-color: rgba(123,75,148,0.35);
        }
        .confettiLayer {
          pointer-events: none;
          position: fixed;
          inset: 0;
          overflow: hidden;
          z-index: 999;
        }
        .doneToast {
          position: fixed;
          left: 50%;
          bottom: 20px;
          transform: translateX(-50%);
          width: min(92vw, 520px);
          background: rgba(255,255,255,0.95);
          border: 1px solid rgba(207,92,54,0.28);
          border-radius: 24px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.12);
          padding: 18px 20px;
          z-index: 1000;
        }
        @media (max-width: 1180px) {
          .hero, .layout, .clueGrid {
            grid-template-columns: 1fr;
          }
          .boardWrap {
            padding: 14px;
          }
        }
        @media (max-width: 640px) {
          .shell { padding: 16px; }
          .hero { padding: 20px; }
          .panel, .selectedCard, .cluePanel, .progressBox { border-radius: 24px; }
        }
      `}</style>

      <div className="confettiLayer">
        <AnimatePresence>
          {confetti.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{ opacity: 0, y: -24, x: 0, rotate: 0 }}
              animate={{ opacity: [0, 1, 1, 0], y: 520, x: piece.drift, rotate: piece.rotate }}
              exit={{ opacity: 0 }}
              transition={{ duration: piece.duration, delay: piece.delay, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: 0,
                left: `${piece.left}%`,
                width: piece.size,
                height: piece.size * 1.3,
                borderRadius: piece.borderRadius,
                background: [palette.sage, palette.coral, palette.plum, palette.blush][Math.floor(Math.random() * 4)],
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="shell">
        <section className="hero">
          <div>
            <div className="badge"><Heart size={16} /> Sahana crossword</div>
            <h1 className="title">
              Crossword,
              <span style={{ color: palette.coral }}> by Shrey.</span>
            </h1>
            <p className="muted">
              Click a clue or a square, type letters directly into the grid, and every completed answer gets a ding and confetti.
            </p>
            <div className="actions">
              <button className="primary" onClick={revealSelected}>Reveal selected word</button>
              <button className="secondary" onClick={resetPuzzle}>Reset puzzle</button>
            </div>
          </div>

          <div className="progressBox">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: "0.24em", textTransform: "uppercase", color: palette.plum, fontWeight: 700 }}>Progress</div>
                <div style={{ fontSize: 42, marginTop: 6, fontWeight: 800 }}>{solvedCount} / {words.length}</div>
              </div>
              <div style={{ background: "rgba(114,158,161,0.16)", color: palette.sage, borderRadius: 20, padding: 14 }}>
              </div>
            </div>
            <div className="progressTrack">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(solvedCount / words.length) * 100}%` }}
                style={{ height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${palette.sage}, ${palette.plum})` }}
              />
            </div>
            <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>
              Tip: click the same square twice to toggle across/down, use arrow keys to move, and hit Enter to jump to the next clue.
            </p>
          </div>
        </section>

        <section className="layout">
          <div className="panel" style={{ padding: 18 }}>
            <div className="boardWrap">
              <div className="board">
                {Array.from({ length: ROWS * COLS }, (_, index) => {
                  const row = Math.floor(index / COLS);
                  const col = index % COLS;
                  const key = cellKey(row, col);
                  const cell = grid.get(key);

                  if (!cell) return <div key={key} className="empty" />;

                  const value = guesses[key] || "";
                  const isSelected = selectedCell === key;
                  const inSelectedWord = selectedWordCells.has(key);
                  const isCorrect = value && value === cell.solution;

                  return (
                    <button
                      key={key}
                      className={`cell ${isSelected ? "selected" : ""} ${inSelectedWord ? "inWord" : ""} ${isCorrect ? "correct" : ""}`}
                      onClick={() => handleCellClick(cell)}
                      type="button"
                    >
                      {cell.number ? <span className="number">{cell.number}</span> : null}
                      <input
                        ref={(node) => { refs.current[key] = node; }}
                        className="letter"
                        value={value}
                        maxLength={1}
                        onChange={(event) => handleInput(cell, event.target.value)}
                        onKeyDown={(event) => handleKeyDown(event, cell)}
                        onFocus={() => {
                          setSelectedCell(key);
                          setSelectedWordId(cell.across || cell.down);
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="sideStack">
            <div className="selectedCard">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: "rgba(207,92,54,0.12)", color: palette.coral, borderRadius: 16, padding: 10 }}>
                  <Check size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 12, letterSpacing: "0.24em", textTransform: "uppercase", color: palette.plum, fontWeight: 700 }}>Selected clue</div>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{selectedWord.number} {selectedWord.direction}</div>
                </div>
              </div>
              <div style={{ marginTop: 16, fontSize: 18, lineHeight: 1.6 }}>{selectedWord.clue}</div>
              <div style={{ marginTop: 10, color: "rgba(0,0,0,0.6)", fontSize: 14 }}>{selectedWord.answer.length} letters</div>
            </div>

            <div className="clueGrid">
              <div className="cluePanel">
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>Across</div>
                <div className="clueList">
                  {words.filter((word) => word.direction === "across").map((word) => {
                    const active = selectedWordId === wordId(word);
                    return (
                      <button
                        key={wordId(word)}
                        className={`clueButton ${active ? "activeAcross" : ""}`}
                        onClick={() => selectWord(word)}
                        type="button"
                      >
                        <div style={{ color: active ? palette.coral : palette.plum, fontWeight: 800, fontSize: 14 }}>{word.number}</div>
                        <div style={{ marginTop: 4, lineHeight: 1.5 }}>{word.clue}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="cluePanel">
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>Down</div>
                <div className="clueList">
                  {words.filter((word) => word.direction === "down").map((word) => {
                    const active = selectedWordId === wordId(word);
                    return (
                      <button
                        key={wordId(word)}
                        className={`clueButton ${active ? "activeDown" : ""}`}
                        onClick={() => selectWord(word)}
                        type="button"
                      >
                        <div style={{ color: active ? palette.plum : palette.coral, fontWeight: 800, fontSize: 14 }}>{word.number}</div>
                        <div style={{ marginTop: 4, lineHeight: 1.5 }}>{word.clue}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {finished ? (
          <motion.div
            className="doneToast"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ background: "rgba(207,92,54,0.12)", color: palette.coral, borderRadius: 18, padding: 12 }}>
                <Heart size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>Puzzle complete ✨</div>
                <div style={{ color: "rgba(0,0,0,0.65)", marginTop: 4 }}>Every clue is filled and the grid is actually aligned now.</div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
