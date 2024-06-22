import React, { useState, useEffect } from 'react';
import './Connect4.css';

const Connect4 = () => {
  const rows = 6;
  const cols = 7;
  const [board, setBoard] = useState(Array(rows).fill(null).map(() => Array(cols).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState('Red');
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (currentPlayer === 'Yellow' && !gameOver) {
      const bestMove = getBestMove(board);
      if (bestMove !== null) {
        handleClick(bestMove, true);
      }
    }
  }, [currentPlayer, gameOver]);

  const handleClick = (col, isAi = false) => {
    if (gameOver || (currentPlayer === 'Yellow' && !isAi)) return; // Prevent player from playing during AI's turn

    for (let row = rows - 1; row >= 0; row--) {
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
          setCurrentPlayer(currentPlayer === 'Red' ? 'Yellow' : 'Red');
        }
        return;
      }
    }
  };

  const renderCell = (row, col) => (
    <div className="cell" onClick={() => handleClick(col)} style={{ backgroundColor: board[row][col] || 'white' }}></div>
  );

  const getBestMove = (board) => {
    const depth = 5; // Limit the depth of the minimax algorithm
    const [bestMove] = minimax(board, depth, true, -Infinity, Infinity);
    return bestMove;
  };

  const minimax = (board, depth, isMaximizing, alpha, beta) => {
    const winner = checkWinner(board);
    if (winner === 'Red') return [null, -1000000];
    if (winner === 'Yellow') return [null, 1000000];
    if (depth === 0 || isBoardFull(board)) return [null, evaluateBoard(board)];

    let bestMove = null;
    let bestScore = isMaximizing ? -Infinity : Infinity;

    for (let col = 0; col < cols; col++) {
      const row = getAvailableRow(board, col);
      if (row !== null) {
        const newBoard = board.map(row => row.slice());
        newBoard[row][col] = isMaximizing ? 'Yellow' : 'Red';
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
    const centerArray = board.map(row => row[Math.floor(cols / 2)]);
    score += countOccurrences(centerArray, 'Yellow') * 3;

    // Evaluate all rows, columns, and diagonals
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (col + 3 < cols) {
          // Horizontal
          score += evaluateSegment([board[row][col], board[row][col + 1], board[row][col + 2], board[row][col + 3]]);
        }
        if (row + 3 < rows) {
          // Vertical
          score += evaluateSegment([board[row][col], board[row + 1][col], board[row + 2][col], board[row + 3][col]]);
        }
        if (row + 3 < rows && col + 3 < cols) {
          // Positive diagonal
          score += evaluateSegment([board[row][col], board[row + 1][col + 1], board[row + 2][col + 2], board[row + 3][col + 3]]);
        }
        if (row + 3 < rows && col - 3 >= 0) {
          // Negative diagonal
          score += evaluateSegment([board[row][col], board[row + 1][col - 1], board[row + 2][col - 2], board[row + 3][col - 3]]);
        }
      }
    }

    return score;
  };

  const evaluateSegment = (segment) => {
    let score = 0;
    const yellowCount = countOccurrences(segment, 'Yellow');
    const redCount = countOccurrences(segment, 'Red');

    if (yellowCount === 4) {
      score += 100;
    } else if (yellowCount === 3 && redCount === 0) {
      score += 5;
    } else if (yellowCount === 2 && redCount === 0) {
      score += 2;
    }

    if (redCount === 4) {
      score -= 100;
    } else if (redCount === 3 && yellowCount === 0) {
      score -= 5;
    } else if (redCount === 2 && yellowCount === 0) {
      score -= 2;
    }

    return score;
  };

  const countOccurrences = (array, value) => {
    return array.reduce((count, element) => (element === value ? count + 1 : count), 0);
  };

  const getAvailableRow = (board, col) => {
    for (let row = rows - 1; row >= 0; row--) {
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
        if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== player) return null;
      }
      return player;
    };

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
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
