// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-analytics.js";
import { getDatabase, ref, set, onValue, push, get, update, child } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js";

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA2IqpBUPdNrz05QOWrOQ_6iHTIijGZSu0",
    authDomain: "gameta-fun.firebaseapp.com",
    databaseURL: "https://gameta-fun-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gameta-fun",
    storageBucket: "gameta-fun.appspot.com",
    messagingSenderId: "539136049383",
    appId: "1:539136049383:web:bf1cf9b023f48e3655e242",
    measurementId: "G-T8ENH6W0R6"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Realtime Database
const database = getDatabase(app);

const canvas = document.getElementById('puzzleCanvas');
const replayButton = document.getElementById('replayButton');
const ctx = canvas.getContext('2d');
const gridSize = 4;
const pieceSize = canvas.width / gridSize;

const referenceCanvas = document.getElementById('referenceCanvas');
const referenceCtx = referenceCanvas.getContext('2d');
const referencePieceSize = referenceCanvas.width / gridSize;

let timerInterval;
let startTime;
let currentShuffledPieces = [];
let isTimerStarted = false;
let imageSrc = '';
let puzzleSolved = false;
let isShuffling = false;
let currentEventHandler = null;
let elapsedMilliseconds = 0;
let maxTime = 3 * 60 * 1000;


function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const resizedImg = resizeImageToFitPuzzleArea(img);
      resolve(resizedImg);
    };
    img.src = src;
  });
}

(async () => {
  const response = await fetch("https://gameta.fun/images.json");
  const data = await response.json();

  console.log(data); // Add this line

  const imageLinks = data.images.map(filename => `/Jigsaw/${filename}`);
  const randomImage = imageLinks[Math.floor(Math.random() * imageLinks.length)];

  imageSrc = randomImage;
  
  const resizedImg = await loadImage(randomImage);
  initPuzzle(resizedImg);
  drawReferencePuzzle(resizedImg);
  
  window.imageSrc = randomImage;
})();

function drawPieces(pieces, resizedImg) {
  drawPiecesOnCanvas(ctx, pieces, resizedImg, pieceSize);
}

function drawReferencePuzzle(resizedImg) {
  const refCtx = referenceCanvas.getContext('2d');

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (row === gridSize - 1 && col === gridSize - 1) {
        continue; // Skip the bottom-right piece
      }

      const sx = col * pieceSize;
      const sy = row * pieceSize;
      const dx = col * referencePieceSize;
      const dy = row * referencePieceSize;
      const gap = 1; // Adjust the size of the gap between pieces for the reference puzzle

      refCtx.drawImage(
        resizedImg,
        sx,
        sy,
        pieceSize - gap,
        pieceSize - gap,
        dx,
        dy,
        referencePieceSize - gap,
        referencePieceSize - gap
      );
    }
  }
}

function startTimer() {
  startTime = new Date();
  timerInterval = setInterval(updateTimer, 10); // Update to 10 for centiseconds
}

function updateTimer() {
  const currentTime = new Date();
  const elapsedTime = currentTime - startTime;

  if (elapsedTime >= maxTime) {
    stopTimer();
    alert("Time's up! Use a power-up for 15 more seconds or start a new game.");
    // Call usePowerUp() function here if you want to automatically use a power-up when the time runs out
    return;
  }

  const elapsedSeconds = Math.floor(elapsedTime / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const centiseconds = Math.floor(elapsedTime / 10) % 100;
  document.getElementById("timer").textContent = `${minutes
    .toString()
    .padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}


function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  clearInterval(timerInterval);
  startTime = new Date();
  document.getElementById('timer').textContent = '00:00';
}

function createShuffledPieces() {
  isShuffling = true;
  const pieceCount = gridSize * gridSize;
  const pieces = Array.from({ length: pieceCount }, (_, i) => i);

  const numberOfMoves = 200; // Adjust this value to change the difficulty level

  let emptyPieceIndex = pieceCount - 1;

  do {
    for (let i = 0; i < numberOfMoves; i++) {
      const possibleMoves = [
        emptyPieceIndex - 1, // left
        emptyPieceIndex + 1, // right
        emptyPieceIndex - gridSize, // up
        emptyPieceIndex + gridSize, // down
      ].filter((move) => isValidMove(move, emptyPieceIndex, gridSize));

      const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

      swapPieces(pieces, randomMove, emptyPieceIndex);
      emptyPieceIndex = randomMove;
    }
  } while (isSolved(pieces));

  isShuffling = false;
  return pieces;
}


function areSimilar(pieces1, pieces2) {
  if (pieces1.length !== pieces2.length) return false;
  let differences = 0;
  for (let i = 0; i < pieces1.length; i++) {
    if (pieces1[i] !== pieces2[i]) differences++;
    if (differences > 2) return false;
  }
  return true;
}

function isValidMove(move, emptyPieceIndex, gridSize) {
  const row = Math.floor(emptyPieceIndex / gridSize);
  const col = emptyPieceIndex % gridSize;
  const moveRow = Math.floor(move / gridSize);
  const moveCol = move % gridSize;

  return (
    move >= 0 &&
    move < gridSize * gridSize &&
    (Math.abs(row - moveRow) === 1 && col === moveCol) ||
    (Math.abs(col - moveCol) === 1 && row === moveRow)
  );
}


function drawPiecesOnCanvas(ctx, pieces, resizedImg, pieceSize) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  pieces.forEach((piece, index) => {
    if (piece === gridSize * gridSize - 1) return;
    const sx = piece % gridSize * pieceSize;
    const sy = Math.floor(piece / gridSize) * pieceSize;
    const dx = index % gridSize * pieceSize;
    const dy = Math.floor(index / gridSize) * pieceSize;
    const gap = 2; // Change this value to adjust the size of the gap between pieces
    ctx.drawImage(resizedImg, sx, sy, pieceSize - gap, pieceSize - gap, dx, dy, pieceSize - gap, pieceSize - gap);
  });
}

function getClickedPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return [x, y];
}

function findPieceAtPosition(pieces, x, y) {
  const row = Math.floor(y / pieceSize);
  const col = Math.floor(x / pieceSize);
  const index = row * gridSize + col;
  return pieces[index] === gridSize * gridSize - 1 ? -1 : index;
}

function findEmptyPiece(pieces) {
  return pieces.findIndex(piece => piece === gridSize * gridSize - 1);
}

function areNeighbors(index1, index2, gridSize) {
  const row1 = Math.floor(index1 / gridSize);
  const col1 = index1 % gridSize;
  const row2 = Math.floor(index2 / gridSize);
  const col2 = index2 % gridSize;
  return (Math.abs(row1 - row2) === 1 && col1 === col2) || (Math.abs(col1 - col2) === 1 && row1 === row2);
}

function swapPieces(pieces, index1, index2) {
  [pieces[index1], pieces[index2]] = [pieces[index2], pieces[index1]];
}

function isSolvable(pieces, gridSize) {
  let inversions = 0;
  for (let i = 0; i < pieces.length - 1; i++) {
    if (pieces[i] === gridSize * gridSize - 1) continue;
    for (let j = i + 1; j < pieces.length; j++) {
      if (pieces[j] === gridSize * gridSize - 1) continue;
      if (pieces[i] > pieces[j]) inversions++;
    }
  }
  return gridSize % 2 === 1 ? inversions % 2 === 0 : Math.floor(pieces.indexOf(gridSize * gridSize - 1) / gridSize) % 2 === inversions % 2;
}

function resizeImageToFitPuzzleArea(image) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.height = 400; // Puzzle area size

  const scaleFactor = Math.min(canvas.width / image.width, canvas.height / image.height);
  const width = image.width * scaleFactor;
  const height = image.height * scaleFactor;
  const offsetX = (canvas.width - width) / 2;
  const offsetY = (canvas.height - height) / 2;

  ctx.drawImage(image, offsetX, offsetY, width, height);
  const resizedImg = new Image();
  resizedImg.src = canvas.toDataURL();
  return resizedImg;
}

function isSolved(pieces) {
  return pieces.every((piece, index) => piece === index);
}

function isValidNickname(nickname) {
  const regex = /^[a-zA-Z0-9\s|]+#[0-9]{4}$/;
  return regex.test(nickname);
}

async function submitNickname() {
  const nicknameInput = document.getElementById('nickname');
  const nickname = nicknameInput.value;

  if (nickname && isValidNickname(nickname)) {
    const lowercaseNickname = nickname.toLowerCase().replace('#', '_');
    const nicknamesRef = ref(database, 'nicknames');
    const nicknameRef = child(nicknamesRef, lowercaseNickname);
    const snapshot = await get(nicknameRef);

    if (!snapshot.exists()) {
      set(nicknameRef, { completionCount: 0, completionCount: 0 });
    }

    // Call initPuzzle() after submitting the nickname
    if (window.imageSrc) {
      const resizedImg = await loadImage(window.imageSrc);
      initPuzzle(resizedImg);
    } else {
      alert('Image source is not available.');
    }

    const nicknameInputContainer = document.querySelector('.nickname-input');
    const puzzleWrapper = document.getElementById('puzzleWrapper');

    nicknameInputContainer.classList.add('hidden');
    puzzleWrapper.classList.remove('hidden');

  } else {
    alert('Please enter a valid Discord Username.');
  }
}

async function updateCompletionCount(nickname, powerUpCount = 0) {
  const lowercaseNickname = nickname.toLowerCase().replace('#', '_');
  const nicknamesRef = ref(database, 'nicknames');
  const nicknameRef = child(nicknamesRef, lowercaseNickname);
  const snapshot = await get(nicknameRef);

  if (snapshot.exists()) {
    const data = snapshot.val();
    const updatedCompletionCount = data.completionCount + 1;
    const updatedPowerUpCount = (data.powerUpCount || 0) + powerUpCount;
    set(nicknameRef, { completionCount: updatedCompletionCount, powerUpCount: updatedPowerUpCount });
  } else {
    set(nicknameRef, { completionCount: 1, powerUpCount });
  }
}

function getFormattedTime() {
  const elapsedTime = Math.floor(elapsedMilliseconds / 1000);
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  const centiseconds = Math.floor(elapsedMilliseconds / 10) % 100;
  return `${minutes.toString().padStart  (2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

function initializeTimer() {
  if (!isTimerStarted) {
    startTimer();
    isTimerStarted = true;
  }
}

async function initPuzzle(resizedImg) {
  puzzleSolved = false;
  const ctx = canvas.getContext('2d');
  currentShuffledPieces = createShuffledPieces(); // Remove the argument here
  drawPiecesOnCanvas(ctx, currentShuffledPieces, resizedImg, pieceSize);
  initClickEventListener(currentShuffledPieces, resizedImg, ctx);
}

function initClickEventListener(shuffledPieces, resizedImg, ctx, delay = 0) {
  if (currentEventHandler !== null) {
    canvas.removeEventListener('click', currentEventHandler);
  }
  currentEventHandler = onCanvasClick.bind(null, shuffledPieces, resizedImg, ctx);
  setTimeout(() => {
    canvas.addEventListener('click', currentEventHandler);
  }, delay);
}

async function onCanvasClick(shuffledPieces, resizedImg, ctx, event) {
  if (puzzleSolved || isShuffling) {
    return;
  }

  if (!isTimerStarted) {
    startTimer();
    isTimerStarted = true;
  }

  const [x, y] = getClickedPosition(event);
  const clickedPieceIndex = findPieceAtPosition(shuffledPieces, x, y);
  const emptyPieceIndex = findEmptyPiece(shuffledPieces);

  if (clickedPieceIndex !== -1 && areNeighbors(clickedPieceIndex, emptyPieceIndex, gridSize)) {
    swapPieces(shuffledPieces, clickedPieceIndex, emptyPieceIndex);
    drawPiecesOnCanvas(ctx, shuffledPieces, resizedImg, pieceSize);
    if (isSolved(shuffledPieces)) {
      puzzleSolved = true;
      const completionTime = getFormattedTime();
      const nickname = document.getElementById('nickname').value;
      const powerUpCount = elapsedMilliseconds > maxTime ? 1 : 0;
      await updateCompletionCount(nickname, 0);
      alert(`Congratulations! You solved the puzzle in ${completionTime}!`);
      stopTimer();
      isTimerStarted = false;
      replayButton.classList.remove('hidden');
      replayButton.disabled = true; // Disable the button

      let countdown = 5;
      const countdownInterval = setInterval(() => {
        replayButton.textContent = `Replay (${countdown})`;
        countdown--;
      }, 1000);

      setTimeout(() => {
        clearInterval(countdownInterval);
        replayButton.textContent = 'Replay';
        replayButton.disabled = false; // Enable the button after 5 seconds
      }, 5000);
    }
  }
}

document.getElementById('submitNickname').addEventListener('click', submitNickname);

replayButton.addEventListener('click', async () => {
  replayButton.classList.add('hidden');
  resetTimer();
  const resizedImg = await loadImage(window.imageSrc);
  initPuzzle(resizedImg);
});

function navigateToLeaderboard() {
  window.location.href = 'jigsaw-stats.html';
}

async function usePowerUp() {
  const nickname = document.getElementById("nickname").value;
  const powerUpCount = await getPowerUpCount(nickname);

  if (powerUpCount > 0) {
    maxTime += 15000; // Add 15 seconds to the max time
    await updateCompletionCount(nickname, -1); // Decrease the user's power-up count by 1
  } else {
    alert("You have no power-ups left!");
  }
}

async function getPowerUpCount(nickname) {
  const lowercaseNickname = nickname.toLowerCase().replace("#", "_");
  const nicknamesRef = ref(database, "nicknames");
  const nicknameRef = child(nicknamesRef, lowercaseNickname);
  const snapshot = await get(nicknameRef);

  if (snapshot.exists()) {
    const data = snapshot.val();
    return data.powerUpCount || 0;
  }

  return 0;
}
