import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { Lobbies, Lobby_utils } from '../api/lobbies.js';
import Lobby from './Lobby.jsx';
import Lobby_preview from './Lobby_preview.jsx';

import AccountsUIWrapper from './AccountsUIWrapper.jsx';



export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = { };
  }
  


  handle_add_lobby(event) {
    event.preventDefault();

    const input_node = ReactDOM.findDOMNode(this.refs.add_lobby_text_input);
    const lobby_name = input_node.value.trim();
    Meteor.call('lobbies.insert', lobby_name, this.props.user._id);

    input_node.value = '';
  }



  render_lobbies_preview() {
    return this.props.lobbies.map((lobby) => (
      <Lobby_preview key={lobby._id} lobby={lobby} user={this.props.user}/>
    ));
  }



  render_users(game_params) {
    var users = [];
    for (var i = 0; i < this.props.users.length; i++) {
      var user = this.props.users[i];
      const is_online = user.status && user.status.online;
      const offline_string = is_online ? "" : "(offline)";
      const is_user_banned = user.profile && user.profile.ban_seconds_left > 0;
      let class_name = "user-in-list";
      if (is_user_banned) {
        class_name += "-banned";
      }
      if (is_online) {
        users.push(
          <div key={user._id}>
            <div className={class_name}>{user.username}</div>
            { is_user_banned &&
              (<div className="user-ban-timeout">{user.profile.ban_seconds_left}s</div>)}
          </div>);
      }
    };
    return users;
  }



  render() {
    const user = this.props.user;
    if (user && user.profile) {
      var is_user_banned = user.profile.ban_seconds_left > 0;
      const lobby_id = user.profile.lobby_id;
      if (lobby_id) {
        var lobby = Lobbies.findOne(lobby_id);
      }
    }

    return (
      <div className="container">
        <div className="flex-box" style={{ fontSize: "2em", padding: "5pt" }}>rock-paper-scissors-lizard-spock</div>
        <div className="flex-box" style={{ paddingBottom: "10pt" }}><AccountsUIWrapper /></div>

        { this.props.user ?
          (
            <div className="flex-box">

              {/* left column */}
              <div className="flex-item">
                <div className="users">
                  <div style={{ paddingLeft: "2pt" }}>users</div>
                  <div>
                    {this.render_users()}
                  </div>
                </div>
              </div>


              {/* center column */}
              <div className="center-column">
                <div className="flex-box">
                  { is_user_banned &&
                    (<div className="">user banned for {user.profile.ban_seconds_left} seconds for leaving lobby</div>)
                  }
                  { !lobby && !is_user_banned &&
                    (<form onSubmit={this.handle_add_lobby.bind(this)}>
                      <input className="add-lobby-input" type="text" ref="add_lobby_text_input" placeholder="type to create new lobby"/>
                    </form>)
                  }
                </div>


                <div className="lobbies">
                  { lobby &&
                    (<Lobby user={this.props.user} lobby={lobby} />) 
                  }
                </div>
              </div>
              

              {/* right column */}
              <div className="flex-item">
                <div style={{ textAlign: "right", paddingRight: "5pt" }}>lobbies</div>
                <div className="flex-box-right"> 
                  <div className="lobbies-preview">
                    {this.render_lobbies_preview()}
                  </div>
                </div>
              </div>
            </div>
          ) : ''
        }
      </div>
    );
  }
}


 
export default createContainer(() => {
  Meteor.subscribe('lobbies');
  Meteor.subscribe('users_online');

  return {
    users: Meteor.users.find({}).fetch(),  
    user: Meteor.user(),
    lobbies: Lobbies.find({}, { sort: { createdAt: -1 } }).fetch(),  
	};
}, App);