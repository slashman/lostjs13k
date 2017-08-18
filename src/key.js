const pressed = {};

module.exports = {
	init: function(){
		window.onkeydown = function(e) {pressed[e.keyCode] = true};
		window.onkeyup = function(e) {pressed[e.keyCode] = false};
	},
	isDown: function(keyCode){
		return pressed[keyCode];
	}
}