// src/components/Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { ref, push, set, onValue, update } from 'firebase/database';
import { createDeck } from '../utils';
import { initializeGame } from '../gameService'; // Import initializeGame

function Home() {
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [gameIdToJoin, setGameIdToJoin] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const gamesRef = ref(db, 'games');
      const unsubscribe = onValue(gamesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const gameList = Object.entries(data)
            .map(([id, game]) => ({ id, ...game }))
            .filter(game => !game.gameEnded);
          setGames(gameList);
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  const signIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  const signOut = () => {
    auth.signOut();
  };

  const createGame = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      console.log('Creating new game...');
      const gameRef = push(ref(db, 'games'));
      const newGameId = gameRef.key;
      console.log('New Game ID:', newGameId);
      await initializeGame(newGameId); // Initialize game in Firestore

      const newGame = {
        players: {
          [user.uid]: {
            name: user.displayName,
            hand: [],
          },
        },
        deck: createDeck(),
        discardPile: [],
        currentPlayer: user.uid,
        gameStarted: false,
      };
      await set(gameRef, newGame);
      console.log('Game created successfully:', newGame);
      navigate(`/game/${newGameId}`);
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const joinGame = (gameId) => {
    const gameRef = ref(db, `games/${gameId}`);
    onValue(gameRef, (snapshot) => {
      const game = snapshot.val();
      if (game && !game.gameStarted) {
        const updatedPlayers = {
          ...game.players,
          [user.uid]: {
            name: user.displayName,
            hand: [],
          },
        };
        update(gameRef, { players: updatedPlayers });
        navigate(`/game/${gameId}`);
      }
    }, { onlyOnce: true });
  };

  const handleJoinGame = () => {
    if (gameIdToJoin) {
      joinGame(gameIdToJoin);
    }
  };

  return (
    <div className="Home">
      <h1>Welcome to Least Count</h1>
      {user ? (
        <>
          <p>Welcome, {user.displayName}!</p>
          <button onClick={createGame}>Create New Game</button>
          <button onClick={signOut}>Sign Out</button>
          <h2>Open Games</h2>
          <ul className="game-list">
            {games.map((game) => (
              <li key={game.id}>
                <p>Game ID: {game.id}</p>
                <p>Players: {Object.keys(game.players).length}</p>
                <button onClick={() => joinGame(game.id)}>Join Game</button>
              </li>
            ))}
          </ul>
          <h2>Join a Game</h2>
          <input
            type="text"
            value={gameIdToJoin}
            onChange={(e) => setGameIdToJoin(e.target.value)}
            placeholder="Enter Game ID"
          />
          <button onClick={handleJoinGame}>Join Game</button>
        </>
      ) : (
        <button onClick={signIn}>Sign In with Google</button>
      )}
    </div>
  );
}

export default Home;
