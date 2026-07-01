import React, { useState, useEffect } from 'react';
import './Connect4.css';

const ROWS = 6;
const COLS = 7;
const STARTING_PLAYER = 'Red';
const DIFFICULTY_LEVELS = {
  easy: { label: 'Easy', depth: 2 },
  medium: { label: 'Normal', depth: 4 },
  hard: { label: 'Hard', depth: 6 },
};

const Connect4 = () => {
  const createEmptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  const [board, setBoard] = useState(createEmptyBoard());
  const [playerColor, setPlayerColor] = useState('Yellow');
  const [currentPlayer, setCurrentPlayer] = useState(STARTING_PLAYER);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');

  const aiColor = playerColor === 'Yellow' ? 'Red' : 'Yellow';

  useEffect(() => {
    if (currentPlayer === aiColor && !gameOver) {
      const bestMove = getBestMove(board, DIFFICULTY_LEVELS[difficulty].depth);
      if (bestMove !== null) {
        handleClick(bestMove, true);
      }
    }
  }, [board, currentPlayer, gameOver, difficulty, aiColor]);

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer(STARTING_PLAYER);
    setGameOver(false);
  };

  const handleClick = (col, isAi = false) => {
    if (gameOver || (currentPlayer === aiColor && !isAi)) return; // Prevent player from playing during AI's turn

    for (let row = ROWS - 1; row >= 0; row--) {
      if (!board[row][col]) {
        const newBoard = board.map(row => row.slice());
        newBoard[row][col] = currentPlayer;
        setBoard(newBoard);

        const winner = checkWinner(newBoard);
        if (winner) {
          setGameOver(true);
          alert(`${winner} wins!`);
        } else if (isBoardFull(newBoard)) {
          setGameOver(true);
          alert('It\'s a tie!');
        } else {
          setCurrentPlayer(currentPlayer === playerColor ? aiColor : playerColor);
        }
        return;
      }
    }
  };

  const renderCell = (row, col) => (
    <div className="cell" onClick={() => handleClick(col)} style={{ backgroundColor: board[row][col] || 'white' }}></div>
  );

  const getBestMove = (board, depth) => {
    const [bestMove] = minimax(board, depth, true, -Infinity, Infinity);
    return bestMove;
  };

  const minimax = (board, depth, isMaximizing, alpha, beta) => {
    const winner = checkWinner(board);
    if (winner === aiColor) return [null, 1000000];
    if (winner === playerColor) return [null, -1000000];
    if (depth === 0 || isBoardFull(board)) return [null, evaluateBoard(board)];

    let bestMove = null;
    let bestScore = isMaximizing ? -Infinity : Infinity;

    for (let col = 0; col < COLS; col++) {
      const row = getAvailableRow(board, col);
      if (row !== null) {
        const newBoard = board.map(row => row.slice());
        newBoard[row][col] = isMaximizing ? aiColor : playerColor;
        const [, score] = minimax(newBoard, depth - 1, !isMaximizing, alpha, beta);
        if (isMaximizing) {
          if (score > bestScore) {
            bestScore = score;
            bestMove = col;
          }
          alpha = Math.max(alpha, score);
        } else {
          if (score < bestScore) {
            bestScore = score;
            bestMove = col;
          }
          beta = Math.min(beta, score);
        }
        if (beta <= alpha) break;
      }
    }
    return [bestMove, bestScore];
  };

  const evaluateBoard = (board) => {
    let score = 0;

    // Evaluate center column
    const centerArray = board.map(row => row[Math.floor(COLS / 2)]);
    score += countOccurrences(centerArray, aiColor) * 3;

    // Evaluate all rows, columns, and diagonals
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (col + 3 < COLS) {
          // Horizontal
          score += evaluateSegment([board[row][col], board[row][col + 1], board[row][col + 2], board[row][col + 3]]);
        }
        if (row + 3 < ROWS) {
          // Vertical
          score += evaluateSegment([board[row][col], board[row + 1][col], board[row + 2][col], board[row + 3][col]]);
        }
        if (row + 3 < ROWS && col + 3 < COLS) {
          // Positive diagonal
          score += evaluateSegment([board[row][col], board[row + 1][col + 1], board[row + 2][col + 2], board[row + 3][col + 3]]);
        }
        if (row + 3 < ROWS && col - 3 >= 0) {
          // Negative diagonal
          score += evaluateSegment([board[row][col], board[row + 1][col - 1], board[row + 2][col - 2], board[row + 3][col - 3]]);
        }
      }
    }

    return score;
  };

  const evaluateSegment = (segment) => {
    let score = 0;
    const playerCount = countOccurrences(segment, playerColor);
    const aiCountInSegment = countOccurrences(segment, aiColor);

    if (playerCount === 4) {
      score += 100;
    } else if (playerCount === 3 && aiCountInSegment === 0) {
      score += 5;
    } else if (playerCount === 2 && aiCountInSegment === 0) {
      score += 2;
    }

    if (aiCountInSegment === 4) {
      score -= 100;
    } else if (aiCountInSegment === 3 && playerCount === 0) {
      score -= 5;
    } else if (aiCountInSegment === 2 && playerCount === 0) {
      score -= 2;
    }

    return score;
  };

  const countOccurrences = (array, value) => {
    return array.reduce((count, element) => (element === value ? count + 1 : count), 0);
  };

  const getAvailableRow = (board, col) => {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!board[row][col]) return row;
    }
    return null;
  };

  const checkWinner = (board) => {
    // Check horizontal, vertical, and diagonal for winner
    const checkDirection = (row, col, rowStep, colStep) => {
      const player = board[row][col];
      if (!player) return null;
      for (let i = 1; i < 4; i++) {
        const r = row + i * rowStep;
        const c = col + i * colStep;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) return null;
      }
      return player;
    };

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (checkDirection(row, col, 0, 1) || checkDirection(row, col, 1, 0) || checkDirection(row, col, 1, 1) || checkDirection(row, col, 1, -1)) {
          return board[row][col];
        }
      }
    }
    return null;
  };

  const isBoardFull = (board) => {
    return board.every(row => row.every(cell => cell));
  };

  return (
    <div className="connect4">
      <div className="controls">
        <label className="difficultyLabel" htmlFor="color-select">
          Your Color
        </label>
        <select
          id="color-select"
          className="difficultySelect"
          value={playerColor}
          onChange={(event) => {
            setPlayerColor(event.target.value);
            resetGame();
          }}
        >
          <option value="Yellow">Yellow</option>
          <option value="Red">Red</option>
        </select>
        <label className="difficultyLabel" htmlFor="difficulty-select">
          Difficulty
        </label>
        <select
          id="difficulty-select"
          className="difficultySelect"
          value={difficulty}
          onChange={(event) => {
            setDifficulty(event.target.value);
            resetGame();
          }}
        >
          {Object.entries(DIFFICULTY_LEVELS).map(([value, config]) => (
            <option key={value} value={value}>
              {config.label}
            </option>
          ))}
        </select>
        <button type="button" className="resetButton" onClick={resetGame}>
          New Game
        </button>
      </div>
      {board.map((row, rowIndex) => (
        <div className="row" key={rowIndex}>
          {row.map((_, colIndex) => (
            <React.Fragment key={colIndex}>
              {renderCell(rowIndex, colIndex)}
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Connect4;
