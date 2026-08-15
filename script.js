const newRoundBtn = document.getElementById('new-round-btn')
const drawBtn = document.getElementById('draw-btn')
const standBtn = document.getElementById('stand-btn')
const cardTable = document.getElementById('card-table')
const historyEl = document.getElementById('history-el')

// Event listener

newRoundBtn.addEventListener('click', newRound)
drawBtn.addEventListener('click', drawPlayerCard)
standBtn.addEventListener('click', stand)

// Game

let gameState = {
    deckId: '',
    playerCards: [],
    dealerCards: [],
    playerScore: 0,
    dealerScore: 0,
    dealerTurn: false,
    gameOver: false,
    remaining: 0,
    history: [],
}

async function newGame() {
    gameState = {
        deckId: '',
        playerCards: [],
        dealerCards: [],
        playerScore: gameState.playerScore,
        dealerScore: gameState.dealerScore,
        dealerTurn: false,
        gameOver: false,
        remaining: 0,
        history: [],
    }

    newRoundBtn.disabled = true

    try {
        const response = await fetch('https://www.deckofcardsapi.com/api/deck/new/shuffle')
        const data = await response.json()
        
        gameState.deckId = data.deck_id
        gameState.remaining = data.remaining
        
        await drawStartingCards(gameState.deckId)
        renderCards()
        naturalBlackjack()

        return gameState

    } catch(err) {
        console.log('Error: ', err)
        throw err
    }
}

async function newRound() {
    gameState.gameOver = false

    newRoundBtn.disabled = true

    try {
        await discardCards(gameState.deckId)
        await verifyRemaining()
        await drawStartingCards(gameState.deckId)
        renderCards()
        naturalBlackjack()

        return gameState

    } catch(err) {
        console.log('Error: ', err)
        throw err
    }
}

async function discardCards(deckId) {
    try {
        const playerCardsCode = gameState.playerCards.map(card => card.code).join(',')
        const dealerCardsCode = gameState.dealerCards.map(card => card.code).join(',')
        const allCardsCode = playerCardsCode + ',' + dealerCardsCode

        const discardResponse = await fetch(`https://www.deckofcardsapi.com/api/deck/${deckId}/pile/discard/add/?cards=${allCardsCode}`)
        const discardData = await discardResponse.json()
    } catch(err) {
        console.log('Error: ', err)
        throw err
    }
}

async function drawStartingCards(deckId) {
    gameState.playerCards = []
    gameState.dealerCards = []

    try {
        // Player cards
        const playerCardsResponse = await fetch(`https://www.deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`)
        const playerCardsData = await playerCardsResponse.json()
        gameState.playerCards = playerCardsData.cards

        // Dealer cards
        const dealerCardsResponse = await fetch(`https://www.deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`)
        const dealerCardsData = await dealerCardsResponse.json()
        gameState.dealerCards = dealerCardsData.cards
        gameState.remaining = dealerCardsData.remaining
        
        return gameState

    } catch(err) {
        console.log('Error: ', err)
        throw err
    }
}

async function drawPlayerCard(){
    try {
        drawBtn.disabled = true

        await verifyRemaining()
        
        const newCardResponse = await fetch(`https://www.deckofcardsapi.com/api/deck/${gameState.deckId}/draw/?count=1`)
        const newCardData = await newCardResponse.json()

        gameState.playerCards.push(newCardData.cards[0])
        gameState.remaining = newCardData.remaining

        renderCards()

        if (getCardsValue(gameState.playerCards) > 21) {
            endRound()
        } else {
            drawBtn.disabled = false
        }
        
    } catch(err) {
        console.log('Error: ', err)
        throw err
    }
}

async function drawDealerCard(){
    try {
        await verifyRemaining()

        const newCardResponse = await fetch(`https://www.deckofcardsapi.com/api/deck/${gameState.deckId}/draw/?count=1`)
        const newCardData = await newCardResponse.json()

        gameState.dealerCards.push(newCardData.cards[0])
        gameState.remaining = newCardData.remaining

        renderCards()

        if (getCardsValue(gameState.dealerCards) > 21) {
            endRound()
        }
    } catch(err) {
        console.log('Error: ', err)
        throw err
    }
}

async function verifyRemaining() {
    try {
        if (gameState.remaining < 10) {
            await fetch(`https://www.deckofcardsapi.com/api/deck/${gameState.deckId}/pile/discard/return/`)
            const shuffleResponse = await fetch(`https://www.deckofcardsapi.com/api/deck/${gameState.deckId}/shuffle/`)
            const shuffleData = await shuffleResponse.json()

            gameState.remaining = shuffleData.remaining
        }
    } catch(err) {
        console.log('Error: ', err)
        throw err
    }
}

function naturalBlackjack() {
    if (getCardsValue(gameState.playerCards) === 21 || getCardsValue(gameState.dealerCards) === 21) {
        endRound()
    } else {
        drawBtn.disabled = false
        standBtn.disabled = false
    }
}

// Hand

function renderCards() {
    if (!gameState.dealerTurn) {
        cardTable.innerHTML = 
            getHand(gameState.dealerCards, !gameState.gameOver, gameState.dealerScore,'dealer')
            + getHand(gameState.playerCards, false, gameState.playerScore,'player')
    } else {
        cardTable.innerHTML = 
            getHand(gameState.dealerCards, false, gameState.dealerScore,'dealer')
            + getHand(gameState.playerCards, false, gameState.playerScore,'player')
    }
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

function getDisplayValue(hand, hideLast) {
    if (hideLast) {
        return `${getCardsValue([hand[0]])} + ?`
    }

    return getCardsValue(hand)
}

function getCardsImg(hand, hideLast) {
    if (hideLast) {
        return `
            <img class="card-img" src="${hand[0].image}" />
            <img class="card-img" src="https://www.deckofcardsapi.com/static/img/back.png" />
        `
    } else {
        return hand.map((card) => `<img class="card-img" src="${card.image}" />`).join('')
    }
}

function getHand(hand, hideLast, score, name) {
    const cardsValue = getDisplayValue(hand, hideLast)
    const cardsImg = getCardsImg(hand, hideLast)

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
    gameState.dealerTurn = true

    drawBtn.disabled = true
    standBtn.disabled = true

    renderCards()

    await dealerTurn()
    endRound()
}

async function dealerTurn() {
    while (getCardsValue(gameState.dealerCards) < 17) {
        await wait(1000)
        await drawDealerCard()
    }
}

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

function endRound() {
    if (gameState.gameOver) return
    
    gameState.dealerTurn = false
    gameState.gameOver = true
    newRoundBtn.disabled = false
    drawBtn.disabled = true
    standBtn.disabled = true 

    const playerValue = getCardsValue(gameState.playerCards)
    const dealerValue = getCardsValue(gameState.dealerCards)
    const playerBust = playerValue > 21
    const dealerBust = dealerValue > 21

    let result = {}

    if (playerBust) {
        gameState.dealerScore++
        result = {
            text: 'Player bust! (Dealer wins)',
            winner: 'dealer'
        }
    } else if (dealerBust) {
        gameState.playerScore++
        result = {
            text: 'Dealer bust! (Player wins)',
            winner: 'player'
        }
    } else if (playerValue === 21 && playerValue > dealerValue && gameState.playerCards.length === 2) {
        gameState.playerScore++
        result = {
            text: 'Blackjack! (Player wins)',
            winner: 'player'
        }
    } else if (playerValue === 21 && playerValue > dealerValue) {
        gameState.playerScore++
        result = {
            text: '21! (Player wins)',
            winner: 'player'
        }
    } else if (playerValue > dealerValue) {
        gameState.playerScore++
        result = {
            text: 'Player wins',
            winner: 'player'
        }
    } else if (dealerValue === 21 && dealerValue > playerValue && gameState.dealerCards.length === 2) {
        gameState.dealerScore++
        result = {
            text: 'Blackjack! (Dealer wins)',
            winner: 'dealer'
        }
    } else if (dealerValue === 21 && dealerValue > playerValue) {
        gameState.dealerScore++
        result = {
            text: '21! (Dealer wins)',
            winner: 'dealer'
        }
    } else if (dealerValue > playerValue) {
        gameState.dealerScore++
        result = {
            text: 'Dealer wins',
            winner: 'dealer'
        }
    } else {
        result = {
            text: 'Push! (tie)',
            winner: 'tie'
        }
    }

    gameState.history.push(result)

    renderCards()
    renderHistory()
}

// History

function renderHistory() {
    historyEl.innerHTML = gameState.history.map((round) => {
        if (round.winner === 'player') {
            return `
                <div class="history-item">
                    <p class="blue">+1</p>
                    <p>${round.text}</p>
                </div>
            `
        } else if (round.winner === 'dealer') {
            return `
                <div class="history-item">
                    <p class="red">+1</p>
                    <p>${round.text}</p>
                </div>
            `
        } else {
            return `
                <div class="history-item">
                    <p class="grey">+0</p>
                    <p>${round.text}</p>
                </div>
            `
        }
    }).join('')
}

newGame()