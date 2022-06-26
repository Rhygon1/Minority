let socket = io("https://minoritygame.herokuapp.com/")
function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890-+";
    for (var i = 0; i < 10; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}
if (localStorage.getItem('Username') == null) localStorage.setItem('Username', makeid())
socket.emit('updateUserName', localStorage.getItem('Username'), window.location.href.split('/')[3])
let score = 0
let answered = false
let host = false
const roomName = window.location.href.split('/')[3]

let applyUsername = document.getElementById('apply-username')
let usernameInput = document.getElementById('input-username')
let customWords = document.querySelector('.custom-options-wrapper')
let newGameBUtton = document.getElementById('start-button')
let customWordsInput = document.querySelector('#custom-words-p')

customWords.style.display = "None"
newGameBUtton.style.display = "None"
customWordsInput.style.display = "None"

applyUsername.addEventListener('click', () => {
    if (usernameInput.value != ""){
        localStorage.setItem('Username', usernameInput.value)
        socket.emit('updateUserName', usernameInput.value, window.location.href.split('/')[3])
        usernameInput.value = ""
    }
})

newGameBUtton.addEventListener('click', () => {
    let customWordsArr = []
    let firstCustomOptions = document.querySelectorAll('.first-word')
    firstCustomOptions.forEach(word => {
        if(word.value != "" && word.nextElementSibling.value != ""){
            let arr = []
            arr.push(word.value)
            arr.push(word.nextElementSibling.value)
            customWordsArr.push(arr)
            word.value = ""
            word.nextElementSibling.value = ""
        }
    })
    socket.emit('newGame', customWordsArr, roomName)
    host = true
})

socket.on('NewGameServer', () => {
    score = 0
    answered = false
})

socket.on('setHost', () => {
    host = true
    newGameBUtton.style.display = "inline-block"
    customWordsInput.style.display = "block"
    customWords.style.display = "flex"
})

socket.on('remHost', () => {
    host = false
})

socket.on('setPlayerNames', players => {
    document.querySelector('.onlineplayers').innerHTML = ""
    if(players.length > 30){
        let p = document.createElement('p')
        p.classList.add('name')
        p.innerHTML = `${players.length} players have joined`
        document.querySelector('.onlineplayers').append(p)
    } else {
        players.forEach(player => {
            let p = document.createElement('p')
            p.classList.add('name')
            p.innerHTML = player
            document.querySelector('.onlineplayers').append(p)
        })
    }
})

socket.on('newQuestion', (options) => {
    document.getElementById('score').style.display = 'block'
    document.getElementById('score').innerHTML = `Score: ${score}`
    answered = false
    document.querySelectorAll('.option-button').forEach(button => {
        button.remove()
    })
    let newQuesBUttons = document.querySelectorAll('.New-Question')
    newQuesBUttons.forEach(button => {
        button.remove()
    })
    if(host){
        let newQues = document.createElement('button')
        newQues.textContent = "Results"
        newQues.classList.add("New-Question")
        newQues.style =`
        background-color: gold;
        color: black;
        width: 25%;
        height: 10vh;
        font-size: 300%;
        position: absolute;
        top: 10%;
        left: 15%;
        transform: translate(-50%, -50%);`
        if (screen.width < 450){
            newQues.style =`
                background-color: gold;
                color: black;
                width: 45%;
                height: 6vh;
                font-size: 120%;
                position: absolute;
                top: 8.4%;
                left: 25%;
                transform: translate(-50%, -50%);`
        }
        document.body.append(newQues)
        newQues.addEventListener('click', () => {
            socket.emit('ReqResults', roomName)
            newQues.disabled = true
        })
    }
    document.getElementById('second-responses').innerHTML = ""
    document.getElementById('first-responses').innerHTML = ""
    applyUsername.style.display = "None"
    usernameInput.style.display = "None"
    newGameBUtton.style.display = "None"
    customWords.style.display = "None"
    customWordsInput.style.display = "None"
    document.querySelector('.onlineplayers').style.display = "None"
    let gg = document.getElementById('gg')
    let finalUl = document.getElementById('final-result-ul')
    let con = document.getElementById('continue')
    if(gg != null){
        gg.remove()
        finalUl.remove()
        con.remove()
    }
    for (i = 0; i < options.length; i++){
        new Option(options[i], i)
    }
    let optionButtons = document.querySelectorAll('.option-button')
    optionButtons.forEach(button =>{
        button.addEventListener('click', () => {
            if (!answered){
                socket.emit('answer', button.innerHTML, roomName)
                answered = true
                optionButtons.forEach(button2 => {
                    if (button.innerHTML != button2.innerHTML){
                        button2.style.backgroundColor = "Grey"
                        button2.disabled = true
                    }
                })
            }
        })
    })
})

socket.on('results', (responses, amountOfQuestions) => {
    let first = responses[0]
    let second = responses[1]
    if(first.length + second.length < 30){
        for(i = 0; i<first.length; i++){
            let p = document.createElement('p')
            p.textContent = first[i]
            p.classList.add('result-name')
            document.getElementById('first-responses').append(p)
        }
        for(i = 0; i<second.length; i++){
            let p = document.createElement('p')
            p.textContent = second[i]
            p.classList.add('result-name')
            document.getElementById('second-responses').append(p)
        }
    } else {
        let firstPerc = document.createElement('p')
        firstPerc.textContent = `${Math.round((first.length/(second.length+first.length) * 100))}% of people voted here`
        document.getElementById('first-responses').append(firstPerc)
        
        let secondPerc = document.createElement('p')
        secondPerc.textContent = `${Math.round((second.length/(second.length+first.length) * 100))}% of people voted here`
        document.getElementById('second-responses').append(secondPerc)
    }
    answered = true
    let newQuesBUttons = document.querySelectorAll('.New-Question')
    newQuesBUttons.forEach(button => {
        button.remove()
    })
    if(host){
        let newQues = document.createElement('button')
        newQues.textContent = "Next question"
        newQues.classList.add("New-Question")
        newQues.style =`
        background-color: gold;
        color: black;
        width: 25%;
        height: 10vh;
        font-size: 300%;
        position: absolute;
        top: 10%;
        left: 15%;
        transform: translate(-50%, -50%);`
        if (screen.width < 450){
            newQues.style =`
                background-color: gold;
                color: black;
                width: 45%;
                height: 6vh;
                font-size: 120%;
                position: absolute;
                top: 8.4%;
                left: 25%;
                transform: translate(-50%, -50%);`
        }
        document.body.append(newQues)
        if (amountOfQuestions >= 10){
            newQues.textContent = "End game"
        }
        newQues.addEventListener('click', () => {
            if (amountOfQuestions >= 10){
                socket.emit('endGame', roomName)
            } else {
                socket.emit('ReqNewQues', roomName)
            }
            newQues.disabled = true
        })
    }
})

socket.on('incScore', () => {
    score++
    document.getElementById('score').innerHTML = `Score: ${score}`
})

socket.on('finalResult', results => {
    applyUsername.style.display = "None"
    usernameInput.style.display = "None"
    newGameBUtton.style.display = "None"
    customWords.style.display = "None"
    customWordsInput.style.display = "None"
    document.querySelector('.onlineplayers').style.display = "None"
    document.getElementById('score').style.display = "None"
    document.getElementById('second-responses').innerHTML = ""
    document.getElementById('first-responses').innerHTML = ""
    document.querySelectorAll('.option-button').forEach(button => {
        button.remove()
    })
    let newQuesBUttons = document.querySelectorAll('.New-Question')
    newQuesBUttons.forEach(button => {
        button.remove()
    })
    let gg = document.createElement('p')
    gg.id = 'gg'
    gg.textContent = "Results"
    document.body.append(gg)
    let ul = document.createElement('ul')
    ul.id = "final-result-ul"
    document.body.append(ul)
    for(i = 0; i < results.length; i++){
        let li = document.createElement('li')
        li.textContent = `${results[i][0]} - ${results[i][1]}`
        ul.append(li)
    }
    let continueButton = document.createElement('button')
    continueButton.innerText = "Continue"
    continueButton.id = "continue"
    document.body.append(continueButton)
    continueButton.addEventListener('click', () => {
        ul.remove()
        gg.remove()
        continueButton.remove()
        applyUsername.style.display = "inline-block"
        usernameInput.style.display = "inline-block"
        if(host){
            newGameBUtton.style.display = "inline-block"
            customWordsInput.style.display = "block"
            customWords.style.display = "flex"
        }
        document.querySelector('.onlineplayers').style.display = "flex"
    })
})