class Option{
    constructor(value, color){
        this.value = value
        this.button = document.createElement('button')
        this.button.textContent = this.value
        this.button.classList.add('option-button')
        document.body.append(this.button)
        if (color == 0){
            if (screen.width > 450){
                this.button.style = "position: absolute; top: 40%; transform: translate(0, -50%); height: 40vh; width: 45.5vw; left: 3vw; background-color: rgb(46, 76, 176); font-size: 15vh"
            } else {
                this.button.style = "position: absolute; top: 40%; transform: translate(0, -50%); height: 40vh; width: 45.5vw; left: 3vw; background-color: rgb(46, 76, 176); font-size: 5vh"
            }
        } else if (color == 1){
            if (screen.width > 450){
                this.button.style = "position: absolute; top: 40%; transform: translate(0, -50%); height: 40vh; width: 45.5vw; left: 51.5vw; background-color: rgb(184, 31, 49); font-size: 15vh"
            } else {
                this.button.style = "position: absolute; top: 40%; transform: translate(0, -50%); height: 40vh; width: 45.5vw; left: 51.5vw; background-color: rgb(184, 31, 49); font-size: 5vh"
            }
        }
    }   
}