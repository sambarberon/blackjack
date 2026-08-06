const newGameBtn = document.getElementById('new-game-btn')
const drawBtn = document.getElementById('draw-btn')
const standBtn = document.getElementById('stand-btn')
const cardTable = document.getElementById('card-table')
const resultEl = document.getElementById('result')

const playerScoreEl = document.getElementById('player-score')
const dealerScoreEl = document.getElementById('dealer-score')

// Event listener

newGameBtn.addEventListener('click', newGame)
drawBtn.addEventListener('click', drawPlayerCard)
standBtn.addEventListener('click', stand)

// Game

let gameState = {
    deckId: '',
    playerCards: [],
    dealerCards: [],
    playerScore: 0,
    dealerScore: 0,
    gameOver: false,
}

async function newGame() {
    gameState = {
        deckId: '',
        playerCards: [],
        dealerCards: [],
        playerScore: gameState.playerScore,
        dealerScore: gameState.dealerScore,
        gameOver: false,
    }

    resultEl.textContent = ''
    newGameBtn.disabled = true

    try {
        const response = await fetch('https://www.deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
        const data = await response.json()
        
        gameState.deckId = data.deck_id
        
        // Player cards
        const playerCardsResponse = await fetch(`https://www.deckofcardsapi.com/api/deck/${gameState.deckId}/draw/?count=2`)
        const playerCardsData = await playerCardsResponse.json()
        gameState.playerCards = playerCardsData.cards

        // Dealer cards
        const dealerCardsResponse = await fetch(`https://www.deckofcardsapi.com/api/deck/${gameState.deckId}/draw/?count=2`)
        const dealerCardsData = await dealerCardsResponse.json()
        gameState.dealerCards = dealerCardsData.cards

        renderCards()

        drawBtn.disabled = false
        standBtn.disabled = false

        return gameState

    } catch(err) {
        console.log('Error: ', err)
        throw err
    }
}

async function drawPlayerCard(){
    try {
        const newCardResponse = await fetch(`https://www.deckofcardsapi.com/api/deck/${gameState.deckId}/draw/?count=1`)
        const newCardData = await newCardResponse.json()

        gameState.playerCards.push(newCardData.cards[0])

        renderCards()

        if (getCardsValue(gameState.playerCards) > 21) {
            endRound()
        }
        
    } catch(err) {
        console.log('Error: ', err)
        throw err
    }
}

async function drawDealerCard(){
    try {
        const newCardResponse = await fetch(`https://www.deckofcardsapi.com/api/deck/${gameState.deckId}/draw/?count=1`)
        const newCardData = await newCardResponse.json()

        gameState.dealerCards.push(newCardData.cards[0])

        renderCards()

        if (getCardsValue(gameState.dealerCards) > 21) {
            endRound()
        }
    } catch(err) {
        console.log('Error: ', err)
        throw err
    }
}

// Deck

function renderCards() {
    cardTable.innerHTML = 
        getDeck(gameState.dealerCards, 'dealer')
        + getDeck(gameState.playerCards, 'player')
}

function getCardsValue(deck) {
    return deck.reduce((total, card) => {
        if (['KING', 'QUEEN', 'JACK'].includes(card.value)) {
            return total + 10
        }
        if (card.value === 'ACE') {
            return total + 11
        }

        return total + parseInt(card.value)
    }, 0)
}

function getCardsImg(deck) {
    return deck.map((card) => `<img class="card-img" src="${card.image}" />`).join('')
}

function getDeck(deck, name) {
    const cardsValue = getCardsValue(deck)
    const cardsImg = getCardsImg(deck)

    return `
        <div class="deck" id="${name}-deck">
            <div class="deck-top">
                <h2>${name}'s deck</h2>
                <p class="deck-value" id="${name}-deck-value">${cardsValue}</p>
            </div>
            <div id="${name}-deck-cards">${cardsImg}</div>
        </div>
    `
}

// End

async function stand() {
    drawBtn.disabled = true
    standBtn.disabled = true

    await dealerTurn()
    endRound()
}

async function dealerTurn() {
    while (getCardsValue(gameState.dealerCards) < 17) {
        await drawDealerCard()
    }
}

function endRound(){
    if (gameState.gameOver) return
    
    gameState.gameOver = true
    newGameBtn.disabled = false
    drawBtn.disabled = true
    standBtn.disabled = true 

    const playerValue = getCardsValue(gameState.playerCards)
    const dealerValue = getCardsValue(gameState.dealerCards)
    const playerBust = playerValue > 21
    const dealerBust = dealerValue > 21

    let result = ''

    if (playerBust) {
        gameState.dealerScore++
        result = 'Dealer wins (Player bust)'
    } else if (dealerBust) {
        gameState.playerScore++
        result = 'Player wins (Dealer bust)'
    } else if (playerValue > dealerValue) {
        gameState.playerScore++
        result = 'Player wins'
    } else if (dealerValue > playerValue) {
        gameState.dealerScore++
        result = 'Dealer wins'
    } else {
        result = 'Push (tie)'
    }

    resultEl.textContent = result
    playerScoreEl.textContent = gameState.playerScore
    dealerScoreEl.textContent = gameState.dealerScore
}