import React, { Component, PropTypes } from 'react';
import { Lobbies } from '../api/lobbies.js';
import Rps from './Rps.jsx';
  


export default class Round extends Component {

  render() {
    const gp = this.props.game_params;
    const round_index = this.props.round_index;
    const round = gp.lobby.rounds[round_index];
    // if (round.finished && round.score) {
    //   var score = ;
    // }

    return (
      <div className="flex-box">
          <Rps player_number={1} game_params={gp} round_index={round_index}/>

          <div className="flex-item flex-box" style={{ width: "100px" }}>
            <div className="round-divider">
              {/*<div>round&nbsp;{round_index + 1}</div> */}
              {round.finished ? 
                <div className="score">{round.score1}:{round.score2}</div>
                :
                <div>{round.seconds_left}</div>
              }
            </div>
          </div>

          <Rps player_number={2} game_params={gp} round_index={round_index}/>
      </div>);
  }
}