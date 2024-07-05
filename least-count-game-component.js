// src/components/Game.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ref, onValue, set } from 'firebase/database';
import Card from './Card';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
  return SUITS.flatMap(suit => VALUES.map(value => ({ suit, value })));
}

function shuffleDeck(deck) {
  return deck.sort(() => Math.random() - 0.5);
}

function calculateHandValue(hand) {
  return hand.reduce((sum, card) => {
    const value = card.value;
    if (['J', 'Q', 'K'].includes(value)) return sum + 10;
    if (value === 'A') return sum + 1;
    return sum + parseInt(value);
  }, 0);
}

function Game() {
  const { gameId } = useParams();
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
    const gameRef = ref(db, `games/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameState(data);
        if (!playerId) {
          setPlayerId(Object.keys(data.players).find(id => data.players[id].name === auth.currentUser.displayName));
        }
      }
    });

    return () => unsubscribe();
  }, [gameId, playerId]);

  function updateGameState(updates) {
    const gameRef = ref(db, `games/${gameId}`);
    set(gameRef, { ...gameState, ...updates });
  }

  function drawCard(fromDeck = true) {
    if (gameState.currentPlayer !== playerId) return;

    const { players, deck, discardPile } = gameState;
    const newCard = fromDeck ? deck.pop() : discardPile.pop();
    const updatedPlayers = { ...players };
    updatedPlayers[playerId].hand.push(newCard);

    updateGameState({
      players: updatedPlayers,
      deck: fromDeck ? deck : [...deck, discardPile[discardPile.length - 1]],
      discardPile: fromDeck ? discardPile : discardPile.slice(0, -1),
    });
  }

  function discardCard(cardIndex) {
    if (gameState.currentPlayer !== playerId) return;

    const { players, discardPile } = gameState;
    const updatedPlayers = { ...players };
    const [discardedCard] = updatedPlayers[playerId].hand.splice(cardIndex, 1);

    const nextPlayerId = Object.keys(players)[(Object.keys(players).indexOf(playerId) + 1) % Object.keys(players).length];

    updateGameState({
      players: updatedPlayers,
      discardPile: [...discardPile, discardedCard],
      currentPlayer: nextPlayerId,
    });
  }

  function callLeastCount() {
    if (gameState.currentPlayer !== playerId) return;

    const { players } = gameState;
    const scores = Object.entries(players).map(([id, player]) => ({
      id,
      name: player.name,
      score: calculateHandValue(player.hand),
    }));

    const winner = scores.reduce((min, player) => player.score < min.score ? player : min);

    updateGameState({
      winner: winner,
      gameEnded: true,
      scores: scores,
    });
  }

  if (!gameState) return <div>Loading...</div>;

  const currentPlayer = gameState.players[gameState.currentPlayer];
  const isCurrentPlayer = gameState.currentPlayer === playerId;

  return (
    <div className="Game">
      <h2>Least Count Game</h2>
      {gameState.gameEnded ? (
        <div className="game-over">
          <h3>Game Over!</h3>
          <p>Winner: {gameState.winner.name} with a score of {gameState.winner.score}</p>
          <h4>Final Scores:</h4>
          <ul>
            {gameState.scores.map(player => (
              <li key={player.id}>{player.name}: {player.score}</li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="player-hand">
            <h3>Your Hand:</h3>
            <div className="cards">
              {gameState.players[playerId].hand.map((card, index) => (
                <Card
                  key={`${card.suit}-${card.value}-${index}`}
                  suit={card.suit}
                  value={card.value}
                  onClick={() => isCurrentPlayer && discardCard(index)}
                />
              ))}
            </div>
          </div>
          <div className="game-info">
            <p>Current Player: {currentPlayer.name}</p>
            <p>Cards in Deck: {gameState.deck.length}</p>
          </div>
          <div className="game-actions">
            <button onClick={() => drawCard(true)} disabled={!isCurrentPlayer}>Draw from Deck</button>
            <button onClick={() => drawCard(false)} disabled={!isCurrentPlayer}>Draw from Discard</button>
            <button onClick={callLeastCount} disabled={!isCurrentPlayer}>Call Least Count</button>
          </div>
          <div className="discard-pile">
            <h3>Discard Pile:</h3>
            {gameState.discardPile.length > 0 && (
              <Card
                suit={gameState.discardPile[gameState.discardPile.length - 1].suit}
                value={gameState.discardPile[gameState.discardPile.length - 1].value}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Game;
