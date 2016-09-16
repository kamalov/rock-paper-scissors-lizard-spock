import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';



export const Lobbies = new Mongo.Collection('lobbies');



if (Meteor.isServer) {
	Meteor.publish('lobbies', function lobbiesPublication() {
		return Lobbies.find();
	});

	Meteor.publish('users_online', function usersPublication() {
  		return Meteor.users.find();
	});
}



export function get_round_score(round) {
	const win_table = [
		[ 0, -1,  1,  1, -1],
		[ 1,  0, -1, -1,  1],
  		[-1,  1,  0,  1, -1],
		[-1,  1, -1,  0,  1],
		[ 1, -1,  1, -1,  0]
	];

	const draw = { player1: 0, player2: 0 };
	const player1_won = { player1: 1, player2: 0 };
	const player2_won = { player1: 0, player2: 1 };

	const score_by_result = {
		[-1]: player2_won,
	    [ 0]: draw,
	    [ 1]: player1_won
	};

	if (round.pick1 === null && round.pick2 === null) {
		return draw;
	}

	if (round.pick1 === null) {
		return player2_won;
	}

	if (round.pick2 === null) {
		return player1_won;
	}

	return score_by_result[win_table[round.pick1][round.pick2]];
}



export function transact(fn) {
	// tx.start(fn.name);
	// try {
	// 	fn();
	// }
	// finally {
	// 	tx.commit();
	// }
}



function update_lobby(lobby_id, update_params) {
	//Lobbies.update(lobby_id, { $set: update_params }, {tx: true});
	Lobbies.update(lobby_id, { $set: update_params });
}



function update_user(user_id, update_params) {
	//Meteor.users.update(user_id, { $set: update_params }, {tx: true});
	Meteor.users.update(user_id, { $set: update_params });
}



function is_game_finished(lobby) {
	return !lobby || lobby.game_state === "finished";
}



function finish_game(lobby, reason) {
	update_lobby(lobby._id, { game_state: "finished", finish_reason: reason });
}



function user_ban_timer(user_id) {
	const user = Meteor.users.findOne(user_id);
	const seconds_left = (user.profile.ban_seconds_left || 0) - 1;

	update_user(user_id, { "profile.ban_seconds_left": seconds_left });
	if (seconds_left > 0) {
		if (Meteor.isServer) {
			Meteor.setTimeout(user_ban_timer.bind(null, user_id), 1000);
		}
	}
}



function ban_user(user_id) {
	const user = Meteor.users.findOne(user_id);
	update_user(user_id, { "profile.ban_seconds_left": 30 });
	user_ban_timer(user_id);
}



function finish_round(lobby_id, round_index) {
	const lobby = Lobbies.findOne(lobby_id);
	const round = lobby.rounds[round_index];

	if (round.finished) {
		return;
		//console.log('(finish_round) error: round already finished');
	}
	
	let score = get_round_score(round);
	
	if (round_index > 0) {
		const prev_round = lobby.rounds[round_index - 1];
		score.player1 += prev_round.score1;
		score.player2 += prev_round.score2;
	}
	
	const update_params = {
		["rounds." + round_index + ".score1"]: score.player1,
		["rounds." + round_index + ".score2"]: score.player2,
		["rounds." + round_index + ".finished"]: true
	};
	update_lobby(lobby._id, update_params);

	if (Math.abs(score.player1 - score.player2) >= 3 || lobby.rounds.length > 100) {
		finish_game(lobby);
	}	
	else {
		add_round(lobby_id);
	}
}



function round_seconds_left_timer(lobby_id, round_index) {
	//return;
	
	const lobby = Lobbies.findOne(lobby_id);
	if (!lobby) {
		return;
	}

	if (is_game_finished(lobby)) {
		finish_round(lobby_id, round_index);
		return;
	}

	const round = lobby.rounds[round_index];
	const round_prefix = "rounds." + round_index + ".";
	const seconds_left = round.seconds_left - 1;
	
	update_lobby(lobby._id, {[round_prefix + "seconds_left"]: seconds_left });
	
	if (seconds_left > 0) {
		if (Meteor.isServer) {
			if (!round.finished) {
				Meteor.setTimeout(round_seconds_left_timer.bind(null, lobby_id, round_index), 1000);
			}
		}
	}
	else {
		finish_round(lobby_id, round_index);
	}
}



function add_round(lobby_id) {
	const lobby = Lobbies.findOne(lobby_id);
	if (is_game_finished(lobby)) {
		return;
	}

	const current_round_index = lobby.rounds.length - 1;
	if (lobby.rounds.length > 0) {
		const round = lobby.rounds[current_round_index];
		update_lobby(lobby._id, { ["rounds." + current_round_index +  ".finished"] : true });
	}
	
	const params = { rounds: { pick1: null, pick2: null, seconds_left: lobby.round_timeout + 1} };
	//Lobbies.update(lobby._id, { $push: params }, { tx: true });
	Lobbies.update(lobby._id, { $push: params });
	round_seconds_left_timer(lobby_id, current_round_index + 1);
}



function clear_user_lobby(user_id){
	if (user_id) {
		update_user(user_id, { "profile.lobby_id": null }); 		
	}
}



Meteor.methods({
	'lobbies.start_game'(lobby_id, round_timeout_str) {
		//transact(function lobbies_start_game() {
		//tx.start('lobbies.start_game');
			const timeout = Math.min(Math.max(parseInt(round_timeout_str) || 30, 5), 60);
			//console.log(normalized_timeout);
			update_lobby(lobby_id, { game_state: "running", round_timeout: timeout });
			add_round(lobby_id);
		//});
		//tx.commit();
	},



	'lobbies.insert'(name, user_id) {
		//tx.start('lobbies.insert');
		
		const insert_callback = function(err, lobby_id) {
			update_user(user_id, { "profile.lobby_id": lobby_id }); 
		};
		Lobbies.insert(
			{
				name: name,
				player1_id: user_id,
				player2_id: null,
				rounds: [],
				game_state: "waiting opponent",
				createdAt: new Date(), 
			}, 
			insert_callback.bind(this));

		//tx.commit();
	},



	// 'lobbies.add_round'(lobby_id) {
	// 	add_round(lobby_id);
	// },



	'lobbies.update_round'(lobby_id, player_number, round_index, selected_index) {
		//tx.start('lobbies.update_round');

		const lobby = Lobbies.findOne(lobby_id);
		const round = lobby.rounds[round_index];

		if (round.finished) {
			return;
		}
		
		if (round["pick" + player_number]) {
			return;
		}

		update_lobby(lobby._id, { ["rounds." + round_index + ".pick" + player_number]: selected_index });
	    
		const other_player_number = player_number === 1 ? 2 : 1;
	    if (round["pick" + other_player_number] !== null) {
	    	finish_round(lobby_id, round_index);
	    }

		//tx.commit();
	},



	'lobbies.set_player2'(lobby_id, player2_id) {
		//tx.start('lobbies.set_player2');

		update_lobby(lobby_id, { player2_id: player2_id, game_state: "waiting start" });
      	update_user(player2_id, { "profile.lobby_id": lobby_id }); 

		//tx.commit();
	},
	


 	'lobbies.remove'(lobby) {
 		//tx.start('lobbies.remove');

		clear_user_lobby(lobby.player1_id);
		clear_user_lobby(lobby.player2_id);
 		Lobbies.remove(lobby._id);

		//tx.commit();
	},



 	'lobbies.leave'(lobby, user) {
 		//tx.start('lobbies.leave');
	
 		const gp = Lobby_utils.get_game_params(lobby, user);
		if (gp.user_is_player1) {
			if (gp.game_state.running) {
		      	finish_game(lobby, "player 1 left");
		    }
		    else {
		    	Lobbies.remove(lobby._id);
		    }
      	}
      	else if (gp.user_is_player2) {
			if (gp.game_state.running) {
		      	finish_game(lobby, "player 2 left");
		    }
		    else {
		    	if (gp.game_state.waiting_start) {
		      		update_lobby(lobby._id, { "player2_id": null, game_state: "waiting opponent" }); 
		    	}
		    	if (gp.game_state.finished && lobby.finish_reason === "player 1 left") {
		    		Lobbies.remove(lobby._id);
		    	}
		    }
      	}
		
		clear_user_lobby(user._id); 
		if (gp.game_state.running) {
			ban_user(user._id);
		}

		//tx.commit();
	},



	'lobbies.set_hint'(game_params, round_params) {
		//tx.start('lobbies.set_hint');

		const gp = game_params;
		const rp = round_params;

		let random_pick = rp.player_pick;
		while (random_pick === rp.player_pick) {
			random_pick = Math.floor((Math.random() * 5));
		}
		let update_params = {};
		update_params["hint" + rp.player_number] = { round_index: rp.round_index, pick: random_pick };

		update_lobby(gp.lobby._id, update_params);

		//tx.commit();
	}
});



export class Lobby_utils {

	static get_game_params(lobby, user) {	

		function get_game_state(game_state_string) {
			let game_state = {};
			game_state.waiting_opponent = game_state_string === "waiting opponent";
			game_state.waiting_start = game_state_string === "waiting start";
			game_state.running = game_state_string === "running";
			game_state.finished = game_state_string === "finished";
			return game_state;
		}

		var r = {};
		
		r.lobby = lobby;
		r.user = user;
		r.game_state = get_game_state(lobby.game_state);
		
		r.player1 = Meteor.users.findOne(lobby.player1_id);
		if (lobby.player2_id) {
			r.player2 = Meteor.users.findOne(lobby.player2_id);
		}
		r.user_is_player1 = lobby.player1_id === user._id;
		r.user_is_player2 = lobby.player2_id === user._id;

		const user_already_in_lobby = r.user && r.user.profile && r.user.profile.lobby_id;
		
		r.is_user_banned = user.profile && user.profile.ban_seconds_left > 0;

		r.can_player2_join_lobby = 
			!r.player2 && 
			!r.game_state.finished && 
			!r.user_is_player1 && 
			!user_already_in_lobby && 
			!r.is_user_banned;

		r.can_start_game = r.user_is_player1 && r.game_state.waiting_start;

		return r;
	}
}





