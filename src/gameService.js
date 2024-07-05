// src/gameService.js
import { doc, setDoc } from 'firebase/firestore';
import { firestore } from './firebase';

const initializeGame = async (gameId) => {
  try {
    console.log('Initializing game with ID:', gameId);
    const gameRef = doc(firestore, 'games', gameId);
    const initialData = {
      players: {},
      discardPile: [],
      deck: [], // You would populate this with your shuffled deck
      currentTurn: '',
      gameEnded: false,
      winner: '',
      turnActions: {}
    };
    await setDoc(gameRef, initialData);
    console.log('Game initialized successfully.');
  } catch (error) {
    console.error('Error initializing game:', error);
  }
};

export { initializeGame };
