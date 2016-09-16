import React, { Component, PropTypes } from 'react';

import { Lobbies, get_round_score } from '../api/lobbies.js';
 


export default class Rps extends Component {
  
  on_rps_click(selected_index) { 
    this.props.game_params.update_round(this.props.player_number, this.props.round_index, selected_index)
  }



  on_show_hint_click(game_params, round_params) {
    const gp = this.props.game_params;
    const rp = round_params;
    if (!rp.player_hint) {
      Meteor.call('lobbies.set_hint', gp, rp);
    }
  }



  get_round_hint(game_params, round_params) {
    let show_hint = false;
    const gp = this.props.game_params;
    const rp = round_params;
    
    if (rp.is_player_round) {
      if (rp.is_hinted_round) {
        //var content = (<div className="message">used&nbsp;hint</div>)
      }        
    }
    else {
      if (rp.round.finished) {
        if (rp.is_hinted_round) {
          //var content = (<div className="message">used&nbsp;hint</div>)
        }
      }
      else {
        if (rp.player_pick !== null) {
          if (!rp.player_hint) {
            var content = (<div className="green-button" onClick={this.on_show_hint_click.bind(this, gp, rp)}>show 50/50 hint</div>)
          }
        }
        else {
          var content = (<div>waiting&nbsp;opponent&nbsp;move...</div>)
        }
      }
    }

    return (<div className="round-hint">{content}</div>);
  }



  get_rows(game_params, round_params) {
    const gp = this.props.game_params;
    const rp = round_params;

    const names = ["rock", "paper", "scissors", "lizard", "spock"];
    var rows = [];
    for (var pick_index = 0; pick_index < 5; pick_index++) {
      const is_selected = pick_index === rp.player_pick;
      let class_names = "rps-item" + rp.player_number;
      
      let overlay;
      const wrong_guess = (<div className="rps-item-wrong-guess">&times;</div>);
      const wrong_hint = (<div className="rps-item-hint">50%</div>);
      // свой половина поля  
      if (rp.is_player_round) {
        if (rp.round.finished) {
          if (rp.is_hinted_round && rp.player_hint.pick === pick_index) {
            overlay = wrong_hint;
          }
          else if (is_selected) {
            if (rp.is_player_won) {
              class_names += " rps-item-winner "; 
            }
            else {
              overlay = wrong_guess;
            }
          } 
          else {
            class_names += " opaque-50 "; 
          }
        }
        else {
          if (is_selected) {
            class_names += " rps-item-selected "; 
          }
        }
      }
      // чужая половина поля
      else {
        if (rp.round.finished) {
          if (rp.is_hinted_round && rp.player_hint.pick === pick_index) {
             class_names += "  "; 
             overlay = wrong_hint;
          }
          else if (is_selected) {
            if (rp.is_player_won) {
              class_names += " rps-item-winner "; 
            } 
            else {
              overlay = wrong_guess;
            }
          }
          else {
            class_names += " opaque-50 "; 
          }
        }
        else {
          if (rp.is_hinted_round) {
            if (is_selected || rp.player_hint.pick === pick_index) {
              class_names += " opaque-70 "; 
            }
            else {
              class_names += " hidden-item";
            }
          }
          else {
            class_names += " hidden-item";
          }
        }
      }

      const name = names[pick_index];
      rows.push(
        <div key={pick_index} className={class_names} onClick={this.on_rps_click.bind(this, pick_index)}>
          <div className="flex-box">
            <div style={{position: 'relative'}}>
              <div className="rps-item-overlay">{overlay}</div>
              <img className="rps-image flex-box" src={"/images/" + name + ".png"}></img>
            </div>
          </div>
          <div className="rps-text flex-box" style={{ cursor: "default" }}>{name}</div>
        </div>
      );
    }
    return rows;
  }



  render() {
    const gp = this.props.game_params;

    let rp = {};
    rp.lobby = gp.lobby;
    rp.round_index = this.props.round_index;
    rp.round = gp.lobby.rounds[rp.round_index];
    rp.player_number = this.props.player_number;
    rp.player_pick = rp.round["pick" + rp.player_number]; 
    rp.player_hint = gp.lobby["hint" + rp.player_number]
    rp.is_hinted_round = rp.player_hint && rp.player_hint.round_index === rp.round_index;
    rp.is_player_round = rp.lobby["player" + rp.player_number + "_id"] === gp.user._id;

    const score = get_round_score(rp.round);
    rp.is_player_won = rp.round.finished && score["player" + rp.player_number];

    const rows = this.get_rows(gp, rp);
    const round_hint = this.get_round_hint(gp, rp);

    return (
      <div style={{position: "relative"}}>
        {round_hint}
        <div className="flex-box flex-item" style={{ alignItems: "center" }}>
          <div className="flex-box">{rows}</div>
        </div>
      </div>);
  }
}