import React from 'react'
import ReactDOM from 'react-dom'
import ReactBodymovin from 'react-bodymovin'
import { HashRouter as Router, Route, Link } from 'react-router-dom'
import io from 'socket.io-client'
import Lottie from 'react-lottie'
import * as animDormant from './animations/dormant.json'
import * as animIdentifying from './animations/identifying.json'

/* SETUP */

let socket = io.connect('https://tactile-api.now.sh')
// socket = io.connect('http://localhost:3000')

const colors = {
  'dormant-bg': '#F6FBFC',
  'dormant-fg': '#F40053',
  'dormant-text': '#919CA9',
  'dormant-logo': '#919CA9',

  'identifying-bg': '#F40053',
  'identifying-fg': 'white',
  'identifying-text': 'white',
  'identifying-logo': '#FF82AD',

  'found-bg': '#44E9B4',
  'found-fg': 'white',
  'found-text': 'white',
  'found-logo': '#27BA8B'
}

if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('Service Worker and Push is supported');

  navigator.serviceWorker.register('sw.js')
  .then(function(swReg) {
    console.log('Service Worker is registered', swReg);

    swRegistration = swReg;
  })
  .catch(function(error) {
    console.error('Service Worker Error', error);
  });
} else {
  console.warn('Push messaging is not supported');
  pushButton.textContent = 'Push Not Supported';
}


class Master extends React.Component {
  render() {
    return(
      <Router>
        <div>
          <Route exact path="/" component={Client} />
          <Route path="/controls" component={Controls} />
        </div>
      </Router>
    )
  }
}


/* CLIENT PAGE */

class Client extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      mode: 'dormant',
      sound: ''
    }
  }
  componentDidMount() {
    let timeout1
    let timeout2
    // Because this links with the open socket, it calls the callback from now until infinity
    this.updateTitle((sound) => {
      window.clearTimeout(timeout1)
      window.clearTimeout(timeout2)
      this.setState({ mode: 'identifying' })
      timeout1 = setTimeout(() => {
        this.setState({ sound: sound, mode: 'found' })
      }, 1000)
      timeout2 = setTimeout(() => {
        this.setState({ sound: '', mode: 'dormant' })
      }, 8000)
    })
  }
  updateTitle(callback) {
    socket.on('hear', (sound) => callback(sound))
  }
  render() {
    const style = {
      background: colors[this.state.mode + '-bg'],
      width: '100%',
      height: '100%',
      position: 'absolute'
    }
    return(
      <main style={style}>
        <Title mode={this.state.mode} />
        <Graphic mode={this.state.mode} sound={this.state.sound} />
        <Caption mode={this.state.mode} sound={this.state.sound} />
      </main>
    )
  }
}

function Title (props) {
  let style = {
    fontFamily: 'Patua One, serif',
    textAlign: 'center',
    fontWeight: 'normal',
    color: colors[props.mode + '-logo']
  }
  return (
    <h1 style={style}>Tactile</h1>
  )
}

class Graphic extends React.Component {
  constructor(props) {
    super(props)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.sound === 'Car Horn' && this.props.sound !== 'Car Horn') {
      navigator.vibrate([100, 200, 100, 200, 1000, 500, 1000, 500, 1000, 500, 1000])
    } else if (nextProps.sound === 'Doorbell' && this.props.sound !== 'Doorbell') {
      navigator.vibrate([100, 200, 100, 200, 100, 2000, 100, 200, 100, 200, 100])
    } else if (nextProps.sound === 'Home Phone' && this.props.sound !== 'Home Phone') {
      navigator.vibrate([600, 100, 600, 1500, 600, 100, 600])
    }
  }

  render () {
    const options = {
      animationData: (this.props.mode === 'dormant') ? animDormant : animIdentifying,
      loop: true,
      autoplay: true
    }

    let imgStyle = {
      width: '42%',
      marginTop: '50px',
      marginBottom: '60px'
    }
    let content = ''
    if (this.props.mode === 'found') {
      let src = '/icons/' + this.props.sound.split(' ').join('') + '.png'
      content = <img src={src} style={imgStyle} />
    } else {
      content = <Lottie options={options} />
    }

    return(
      <div style={{ textAlign: 'center' }}>
        { content }
      </div>
    )
  }
}

function Caption (props) {
  let style = {
    fontFamily: 'Roboto, sans-serif',
    fontSize: '23px',
    color: colors[props.mode + '-text'],
    textAlign: 'center'
  }
  let foundHeadingStyle = {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: '600',
    fontSize: '18px',
    display: 'block',
    color: colors[props.mode + '-logo'],
    textAlign: 'center',
    marginBottom: '10px'
  }
  let foundTextStyle = {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: '500',
    fontSize: '40px',
    color: colors[props.mode + '-text'],
    textAlign: 'center',
    marginTop: 0
  }
  let caption

  if (props.mode === 'dormant') {
    caption = <p style={style}>Waiting for sounds</p>
  } else if (props.mode === 'identifying') {
    caption = <p style={style}>Identifying...</p>
  } else {
    caption =
      <div><p style={foundHeadingStyle}>SOUND IDENTIFIED</p><p style={foundTextStyle}>{props.sound}</p></div>
  }
  return (
    caption
  )
}

/* CONTROLS PAGE */

function Controls () {
  const buttonStyle = {
    border: 0,
    borderRadius: '5px',
    WebkitAppearance: 'none',
    background: '#ddd',
    fontSize: '30px',
    width: '300px',
    display: 'block',
    margin: '15px auto',
    padding: '10px 0',
    cursor: 'pointer',

  }

  const containerStyle = {
    textAlign: 'center',
    width: '100%',
    height: '100%',
    position: 'absolute',
    paddingTop: '50px'
  }

  const buttons = ['Car Horn', 'Doorbell', 'Home Phone'].map((sound, i) => {
      return <button style={buttonStyle} onClick={() => emitSound(sound)} key={i}>{sound}</button>
    })

  console.log(buttons)

  return(
    <div style={containerStyle}>
      { buttons }
    </div>
  )
}

function emitSound (sound) {
  socket.emit('sound', {type: sound})
  var audio = new Audio('/sounds/' + sound.split(' ').join('') + '.mp3');
  audio.play();
}


ReactDOM.render(<Master />, document.getElementById('app'))
