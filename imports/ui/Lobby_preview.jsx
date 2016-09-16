import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';

import { Lobbies, Lobby_utils } from '../api/lobbies.js';
import Round from './Round.jsx';
 


export default class Lobby_preview extends Component {
	
	delete_this_lobby() {
		Meteor.call('lobbies.remove', this.props.lobby);
	}



	join_lobby(event) {
		Meteor.call('lobbies.set_player2', this.props.lobby._id, this.props.user._id);
	}



	render() {
		const lobby = this.props.lobby;
		const user = this.props.user;
		const gp = Lobby_utils.get_game_params(lobby, user);

		return (
			<div className="lobby-preview">
				<div className="row-div">
					<div className="cell-div">
						<div className="lobby-name-preview">{lobby.name}</div>
					</div>
					{ user.username === 'ruslan' && <button className="delete-button" onClick={this.delete_this_lobby.bind(this)}>&times;</button> }
				</div>

				<div className="row-div">
					<div className="cell-div">
						{ gp.player1 && (<div className="player1">{gp.player1.username}</div>) }
					</div>
				</div>

				<div className="row-div">
		    		<div className="cell-div">vs</div>
		    	</div>

				<div className="row-div">
					<div className="cell-div">
						{ gp.player2 && 
							(<div className="player2">{gp.player2.username}</div>) }
						{ gp.can_player2_join_lobby && 
							(<div className="green-button" onClick={this.join_lobby.bind(this)}>Join</div>) }
					</div>
				</div>

				<div className="row-div">
		    		<div className="cell-div message">{lobby.game_state}</div>
		    	</div>
			</div>
		);
	}
}