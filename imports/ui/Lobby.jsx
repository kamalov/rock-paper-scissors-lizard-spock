import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';

import { Meteor } from 'meteor/meteor';

import { Lobbies, Lobby_utils } from '../api/lobbies.js';
import Round from './Round.jsx';



export default class Lobby extends Component {
	
	start_game(event) {
	    const timeout_node = ReactDOM.findDOMNode(this.refs.round_timeout_text_input);
	    const timeout_str = timeout_node.value.trim();
		Meteor.call('lobbies.start_game', this.props.lobby._id, timeout_str);
	}



	update_round(player_number, round_index, selected_index) {
		Meteor.call('lobbies.update_round', this.props.lobby._id, player_number, round_index, selected_index);
	}



	delete_this_lobby() {
		Meteor.call('lobbies.remove', this.props.lobby);
	}



	leave_this_lobby() {
		Meteor.call('lobbies.leave', this.props.lobby, this.props.user);
	}


	render_rounds(game_params) {
		var rows = [];
		for (var i = 0; i < game_params.lobby.rounds.length; i++) {
			rows.push(<Round key={i} game_params={game_params} round_index={i}/>);
		}
		return rows;
 	}


 	get_leave_button(game_params) {
		const gp = game_params;
		const lobby = gp.lobby;
		const user = gp.user;
		if (gp.user_is_player1) {
			if (gp.game_state.running) {
				return (<div className="red-button" onClick={this.leave_this_lobby.bind(this)}>Leave Lobby</div>) 
			}
			else {
				return (<div className="green-button" onClick={this.delete_this_lobby.bind(this)}>Close Lobby</div>) 
			}
		}

		if (gp.user_is_player2) {
			if (gp.game_state.running) {
				return (<div className="red-button" onClick={this.leave_this_lobby.bind(this)}>Leave Lobby</div>) 
			}
			else {
				return (<div className="green-button" onClick={this.leave_this_lobby.bind(this)}>Leave Lobby</div>) 
			}
		}
 	}



	render() {
		const lobby = this.props.lobby;
		const user = this.props.user;
		const gp = Lobby_utils.get_game_params(lobby, user);

		gp.update_round = this.update_round.bind(this);

		//console.log(JSON.stringify(lobby));

		return (
			<div className="lobby">
				<div className="flex-box1">
					<div className="flex-item1">
						<div className="lobby-name flex-box">lobby "{lobby.name}" created by {gp.player1.username}</div>
					</div>
					{/*
					<div className="flex-box">
						{ gp.user_is_player1 && 
							(<div className="flex-item">
								<button className="delete-button" onClick={this.delete_this_lobby.bind(this)}>&times;</button>
							 </div>)  
						}
					</div>
					*/}
				</div>

				<div className="flex-box">
		    		<div className="flex-item flex-box">
		    			{ gp.player1 && (<div className="player1">{gp.player1.username}</div>) }
		    		</div>
		    		
		    		<div className="flex-item" style={{ maxWidth: "100px" }}>
		    		</div>

					<div className="flex-item flex-box">
						{ gp.player2 && (<div className="player2">{gp.player2.username}</div>) }
					</div>
				</div>

				<div>
					{this.render_rounds(gp)}
		    	</div>

				<div className="flex-box flex-item message">
		    		{lobby.game_state}
		    	</div>
		    	
		    	{gp.game_state.finished && lobby.finish_reason &&
					<div className="flex-box flex-item">
			    		<div>{lobby.finish_reason}</div>
			    	</div>
			    }
				
				{ gp.can_start_game && 
				<div>					
					<div className="flex-box flex-item">
						<div>
							<span>timeout</span>
							<input className="round-timeout-input" type="text" ref="round_timeout_text_input" placeholder="30"/>
							<span>seconds</span>
						</div>
		    		</div>

					<div className="flex-box flex-item">
						<div className="green-button" onClick={this.start_game.bind(this)}>Start Game</div>
		    		</div>
		    	</div>
		    	}

				<div className="flex-box flex-item">
					{this.get_leave_button(gp)}
		    	</div>
			</div>
		);
	}
}