import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { auth, firestore } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';

const Game = () => {
  const { gameId } = useParams(); // Use useParams to get gameId from URL
  const [players, setPlayers] = useState({});
  const [discardPile, setDiscardPile] = useState([]);
  const [deck, setDeck] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('');
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState('');
  const [hand, setHand] = useState([]);
  const [drawnCard, setDrawnCard] = useState(null);
  const [newDiscardedCards, setNewDiscardedCards] = useState([]);
  const [action, setAction] = useState(''); // 'drawFromDeck' or 'drawFromDiscard'
  const [showHand, setShowHand] = useState(false);
  const [playerId, setPlayerId] = useState('');

  useEffect(() => {
    if (!gameId) {
      console.error('No gameId provided');
      return;
    }

    console.log('Subscribing to game with ID:', gameId);
    const gameRef = doc(firestore, 'games', gameId);

    const unsubscribe = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        const gameData = doc.data();
        setPlayers(gameData.players || {});
        setDiscardPile(gameData.discardPile || []);
        setDeck(gameData.deck || []);
        setCurrentTurn(gameData.currentTurn || '');
        setGameEnded(gameData.gameEnded || false);
        setWinner(gameData.winner || '');
      } else {
        console.error('Game document does not exist');
      }
    });

    return () => {
      console.log('Unsubscribing from game with ID:', gameId);
      unsubscribe();
    };
  }, [gameId]);

  useEffect(() => {
    const fetchPlayerData = async () => {
      const userId = auth.currentUser?.uid;
      setPlayerId(userId);
      if (userId) {
        const playerHand = players[userId]?.hand || [];
        setHand(playerHand);
      }
    };

    fetchPlayerData();
  }, [players, currentTurn]);

  const drawCard = async () => {
    console.log('Draw card function invoked');
    if (!currentTurn || !players) return;
    if (auth.currentUser?.uid !== currentTurn || gameEnded) return;

    let card;
    if (action === 'drawFromDiscard') {
      card = discardPile[discardPile.length - 1];
      setDiscardPile(discardPile.slice(0, -1));
    } else {
      card = deck[Math.floor(Math.random() * deck.length)];
      setDeck(deck.filter((c) => c !== card));
    }

    const updatedHand = [...hand, card];
    setHand(updatedHand);
    setDrawnCard(card);

    // Temporary to ensure state update before Firestore
    setCurrentTurn(getNextPlayer());
  };

  const discardCards = async () => {
    console.log('Discard cards function invoked');
    if (!currentTurn || !players) return;
    if (auth.currentUser?.uid !== currentTurn || gameEnded) return;

    const updatedHand = hand.filter((card) => !newDiscardedCards.includes(card));
    setHand(updatedHand);
    setDiscardPile([...discardPile, ...newDiscardedCards]);
    setNewDiscardedCards([]);

    // Temporary to ensure state update before Firestore
    setCurrentTurn(getNextPlayer());
  };

  const declare = async () => {
    console.log('Declare function invoked');
    if (!currentTurn || !players) return;
    if (auth.currentUser?.uid !== currentTurn || gameEnded) return;

    const playerScores = {};
    const currentPlayerHand = players[auth.currentUser.uid]?.hand || [];

    // Calculate scores
    const calculateScore = (hand) =>
      hand.reduce((total, card) => {
        const value = card.slice(0, -1);
        if (value === 'A') return total + 1;
        if (['J', 'Q', 'K'].includes(value)) return total + 10;
        return total + parseInt(value);
      }, 0);

    const currentPlayerScore = calculateScore(currentPlayerHand);
    playerScores[auth.currentUser.uid] = currentPlayerScore;

    let lowestScore = currentPlayerScore;
    for (const [id, player] of Object.entries(players)) {
      if (id === auth.currentUser.uid) continue;
      const hand = player.hand || [];
      playerScores[id] = calculateScore(hand);
      lowestScore = Math.min(lowestScore, playerScores[id]);
    }

    const isDeclaredValid = currentPlayerScore === lowestScore;
    const updatedScores = { ...playerScores };

    if (isDeclaredValid) {
      setGameEnded(true);
      setWinner(auth.currentUser.uid);
    } else {
      setGameEnded(true);
      setWinner(null);
    }
  };

  const getNextPlayer = () => {
    if (!players || !currentTurn) return null;
    const playerIds = Object.keys(players);
    const currentIndex = playerIds.indexOf(currentTurn);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    return playerIds[nextIndex];
  };

  const handleDrawFromDiscard = () => {
    console.log('Draw from discard pile button clicked');
    setAction('drawFromDiscard');
    drawCard();
  };

  const handleDrawFromDeck = () => {
    console.log('Draw from deck button clicked');
    setAction('drawFromDeck');
    drawCard();
  };

  const handleDiscard = () => {
    console.log('Discard button clicked');
    discardCards();
  };

  const handleDeclare = () => {
    console.log('Declare button clicked');
    declare();
  };

  return (
    <div>
      <h1>Least Count</h1>
      <p>Current Turn: {currentTurn}</p>
      {gameEnded && winner ? <p>Winner: {winner}</p> : gameEnded && <p>Game Ended!</p>}
      <button onClick={handleDrawFromDeck}>Draw from Deck</button>
      <button onClick={handleDrawFromDiscard}>Draw from Discard Pile</button>
      <button onClick={handleDiscard}>Discard</button>
      <button onClick={handleDeclare}>Declare</button>
      <button onClick={() => setShowHand(!showHand)}>
        {showHand ? 'Hide' : 'Show'} Hand
      </button>
      {showHand && (
        <div>
          <h2>Your Hand</h2>
          <div className="hand">
            {hand.map((card, index) => (
              <div key={index} className="card">
                <span>{card}</span>
                <button onClick={() => setNewDiscardedCards([...newDiscardedCards, card])}>
                  Discard
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <h2>Players</h2>
      <div className="players">
        {Object.entries(players).map(([id, player]) => (
          <div key={id} className="player">
            <h3>{player.name}</h3>
            <p>Score: {player.score}</p>
            {id !== playerId && (
              <div className="hand">
                {player.hand.map((card, index) => (
                  <div key={index} className="card">
                    <span>Hidden</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <h2>Discard Pile</h2>
      <div className="discard-pile">
        {discardPile.map((card, index) => (
          <div key={index} className="card">
            <span>{card}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Game;
