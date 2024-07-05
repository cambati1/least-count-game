// src/utils.js
export const SUITS = ['♠', '♥', '♦', '♣'];
export const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck() {
  return SUITS.flatMap(suit => VALUES.map(value => ({ suit, value })));
}
