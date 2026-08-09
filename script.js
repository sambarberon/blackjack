const newGameBtn = document.getElementById('new-game-btn')
const drawBtn = document.getElementById('draw-btn')
const standBtn = document.getElementById('stand-btn')
const cardTable = document.getElementById('card-table')
const resultEl = document.getElementById('result')

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

    resultEl.textContent = 'Hit or Stand'
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

        if (getCardsValue(gameState.playerCards) === 21 || getCardsValue(gameState.dealerCards) === 21) {
            endRound()
        } else {
            drawBtn.disabled = false
            standBtn.disabled = false
        }

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

// Hand

function renderCards() {
    cardTable.innerHTML = 
        getHand(gameState.dealerCards, gameState.dealerScore,'dealer')
        + getHand(gameState.playerCards, gameState.playerScore,'player')
}

function getCardsValue(hand) {
    let total = hand.reduce((total, card) => {
        if (['KING', 'QUEEN', 'JACK'].includes(card.value)) {
            return total + 10
        }
        if (card.value === 'ACE') {
            return total + 11
        }
        
        return total + parseInt(card.value)
    }, 0)
    
    let aceCount = hand.filter((card) => card.value === 'ACE').length

    while (total > 21 && aceCount > 0) {
        total = total - 10
        aceCount--
    }

    return total
}

function getCardsImg(hand) {
    return hand.map((card) => `<img class="card-img" src="${card.image}" />`).join('')
}

function getHand(hand, score, name) {
    const cardsValue = getCardsValue(hand)
    const cardsImg = getCardsImg(hand)


    return `
        <div class="hand" id="${name}-hand">
            <div class="hand-top">
                <h2>${name}'s hand</h2>
                <p class="score" id="${name}-score">${score}</p>
            </div>
            <div class="hand-bottom">
                <div class="hand-cards" id="${name}-hand-cards">
                    ${cardsImg}
                </div>
                <p class="hand-value" id="${name}-hand-value">${cardsValue}</p>
            </div>
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
    } else if (playerValue === 21 && playerValue > dealerValue && gameState.playerCards.length === 2) {
        gameState.playerScore++
        result = 'Blackjack! (Player wins)'
    } else if (playerValue === 21 && playerValue > dealerValue) {
        gameState.playerScore++
        result = '21! (Player wins)'
    } else if (playerValue > dealerValue) {
        gameState.playerScore++
        result = 'Player wins'
    } else if (dealerValue === 21 && dealerValue > playerValue && gameState.dealerCards.length === 2) {
        gameState.dealerScore++
        result = 'Blackjack! (Dealer wins)'
    } else if (dealerValue === 21 && dealerValue > playerValue) {
        gameState.dealerScore++
        result = '21! (Dealer wins)'
    } else if (dealerValue > playerValue) {
        gameState.dealerScore++
        result = 'Dealer wins'
    } else {
        result = 'Push (tie)'
    }

    resultEl.textContent = result
}