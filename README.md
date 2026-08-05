# Blackjack
A simple Blackjack game built with vanilla JavaScript, using the Deck of Cards API for card management.

## Overview
Play a game of Blackjack against a dealer directly in the browser, no framework or external dependency required (aside from the card API).
 
## Rules
- The player and the dealer are each dealt 2 cards at the start.
- The player can **draw a card** or **stand**.
- The dealer automatically draws while their score is below 17.
- Number cards count at face value, face cards (Jack, Queen, King) count as 10, and the Ace counts as 11.
- The player or dealer immediately loses if their score exceeds 21 (bust).
- The hand closest to 21 without going over wins.
