// src/components/Home.js
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { ref, push, set, onValue } from 'firebase/database';

function Home() {
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const history = useHistory();

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

  const createGame = () => {
    const gameRef = push(ref(db, 'games'));
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
    set(gameRef, newGame);
    history.push(`/game/${gameRef.key}`);
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
        set(gameRef, { ...game, players: updatedPlayers });
        history.push(`/game/${gameId}`);
      }
    }, { onlyOnce: true });
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
                Game {game.id.slice(0, 6)} - Players: {Object.keys(game.players).length}
                <button onClick={() => joinGame(game.id)}>Join Game</button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <button onClick={signIn}>Sign In with Google</button>
      )}
    </div>
  );
}

export default Home;
