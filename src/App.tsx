import { useEffect, useState, useCallback, useRef } from "react";

const COLS = 10;
const ROWS = 20;

type Cell = string | null;
type Board = Cell[][];

const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: "bg-cyan-400 shadow-cyan-400/50" },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: "bg-blue-500 shadow-blue-500/50" },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: "bg-orange-500 shadow-orange-500/50" },
  O: { shape: [[1, 1], [1, 1]], color: "bg-yellow-400 shadow-yellow-400/50" },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: "bg-green-500 shadow-green-500/50" },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: "bg-purple-500 shadow-purple-500/50" },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: "bg-red-500 shadow-red-500/50" },
};

function createBoard(): Board {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null)
  );
}

function rotate(matrix: number[][]) {
  return matrix[0].map((_, i) =>
    matrix.map((row) => row[i]).reverse()
  );
}

function App() {
  const [board, setBoard] = useState<Board>(createBoard());
  const [current, setCurrent] = useState<any>(null);
  const [next, setNext] = useState<any>(null);
  const [position, setPosition] = useState({ x: 3, y: 0 });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("tetris-high")) || 0
  );

  const placeSound = useRef(
    new Audio("https://assets.mixkit.co/sfx/preview/mixkit-game-ball-tap-2073.mp3")
  );

  const randomPiece = () => {
    const keys = Object.keys(TETROMINOS);
    return TETROMINOS[keys[Math.floor(Math.random() * keys.length)] as keyof typeof TETROMINOS];
  };

  const spawnPiece = useCallback(() => {
    setCurrent(next || randomPiece());
    setNext(randomPiece());
    setPosition({ x: 3, y: 0 });
  }, [next]);

  useEffect(() => {
    setNext(randomPiece());
  }, []);

  useEffect(() => {
    if (!current && next) spawnPiece();
  }, [current, next, spawnPiece]);

  const isValidMove = (piece: any, pos: any) => {
    return piece.shape.every((row: number[], y: number) =>
      row.every((value: number, x: number) => {
        if (!value) return true;
        const newX = x + pos.x;
        const newY = y + pos.y;
        return (
          newX >= 0 &&
          newX < COLS &&
          newY < ROWS &&
          (newY < 0 || board[newY][newX] === null)
        );
      })
    );
  };

  const merge = (board: Board, piece: any, pos: any) => {
    const newBoard = board.map((row) => [...row]);
    piece.shape.forEach((row: number[], y: number) => {
      row.forEach((value: number, x: number) => {
        if (value) newBoard[y + pos.y][x + pos.x] = piece.color;
      });
    });
    return newBoard;
  };

  const move = (dx: number, dy: number) => {
    const newPos = { x: position.x + dx, y: position.y + dy };
    if (isValidMove(current, newPos)) {
      setPosition(newPos);
    } else if (dy > 0) {
      placeSound.current.currentTime = 0;
      placeSound.current.play();
      const newBoard = merge(board, current, position);
      const cleared = newBoard.filter(row => row.some(cell => cell === null));
      const lines = ROWS - cleared.length;

      while (cleared.length < ROWS) {
        cleared.unshift(Array(COLS).fill(null));
      }

      const newScore = score + lines * 200;
      setBoard(cleared);
      setScore(newScore);

      if (newScore > highScore) {
        localStorage.setItem("tetris-high", newScore.toString());
        setHighScore(newScore);
      }

      setLevel(1 + Math.floor(newScore / 1000));
      spawnPiece();
    }
  };

  const rotatePiece = () => {
    const rotated = { ...current, shape: rotate(current.shape) };
    if (isValidMove(rotated, position)) setCurrent(rotated);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!current) return;
      if (e.key === "ArrowLeft") move(-1, 0);
      if (e.key === "ArrowRight") move(1, 0);
      if (e.key === "ArrowDown") move(0, 1);
      if (e.key === "ArrowUp") rotatePiece();
      if (e.key === " ") move(0, 20);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (current) move(0, 1);
    }, Math.max(150, 700 - level * 50));
    return () => clearInterval(interval);
  });

  const displayBoard = current ? merge(board, current, position) : board;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black flex items-center justify-center text-white">
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl flex gap-10">

        {/* GAME */}
        <div className="grid grid-cols-10 gap-[3px] bg-black/40 p-4 rounded-2xl">
          {displayBoard.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className={`w-7 h-7 rounded-md transition-all duration-100 ${cell ? `${cell} shadow-lg` : "bg-neutral-800/60"
                  }`}
              />
            ))
          )}
        </div>

        {/* SIDE PANEL */}
        <div className="flex flex-col justify-between">
          {/* header */}
          <div>
            <h1 className="text-3xl font-bold mb-6 tracking-widest">
              TETRIS
            </h1>

            <div className="mb-6">
              <p className="text-neutral-400 text-sm">Score</p>
              <p className="text-2xl font-semibold">{score}</p>
            </div>

            <div className="mb-6">
              <p className="text-neutral-400 text-sm">High Score</p>
              <p className="text-2xl font-semibold">{highScore}</p>
            </div>

            <div className="mb-6">
              <p className="text-neutral-400 text-sm">Level</p>
              <p className="text-2xl font-semibold">{level}</p>
            </div>

            <div>
              <p className="text-neutral-400 text-sm mb-2">Next</p>
              <div className="grid gap-[3px] bg-black/40 p-3 rounded-xl">
                {next?.shape.map((row: number[], y: number) =>
                  row.map((value: number, x: number) => (
                    <div
                      key={`${y}-${x}`}
                      className={`w-5 h-5 rounded-md ${value ? `${next.color} shadow-lg` : "bg-transparent"
                        }`}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
          {/* bottom */}

          <p className="text-xs text-neutral-500 mt-6">
            ← → Move | ↑ Rotate | ↓ Soft Drop | Space Hard Drop
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;