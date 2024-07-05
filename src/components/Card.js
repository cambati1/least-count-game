
import React from 'react';
import PropTypes from 'prop-types';
import './Card.css';

function Card({ suit, value, onClick }) {
  const isRed = suit === '♥' || suit === '♦';
  const cardClass = `card ${isRed ? 'red' : 'black'}`;

  return (
    <div className={cardClass} onClick={onClick}>
      <div className="card-value">{value}</div>
      <div className="card-suit">{suit}</div>
      <div className="card-value">{value}</div>
    </div>
  );
}

Card.propTypes = {
  suit: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

Card.defaultProps = {
  onClick: () => {},
};

export default Card;
