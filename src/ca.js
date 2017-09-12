/* jshint node: true, loopfunc: true */
//'use strict';

let rng = null;

module.exports = {
	run: function(rules, times, cells, _rng){
		rng = _rng;
		for (let i = 0; i < times; i++){
			rules.forEach(rule => applyRule(rule, cells));
		}
	}
};

function applyRule(rule, cells){
	cells.forEach((cell)=>{
		if (rule.chance !== undefined && !rng.chance(rule.chance)){
			cell.nextType = cell.type;
			return;
		}
		if (cell.type != rule.type){
			cell.nextType = cell.type;
			return;
		}
		var surroundingCount = getSurroundingCellsCount(cell, rule.sType);
		if (rule.op === '>'){
			if (surroundingCount > rule.q){
				cell.nextType = rule.nType;
				return;
			}
		} else if (rule.op === '<'){
			if (surroundingCount < rule.q){
				cell.nextType = rule.nType;
				return;	
			}
		}
		cell.nextType = cell.type;
	});
	cells.forEach(cell => cell.type = cell.nextType);
}

function getSurroundingCellsCount(cell, type){
	return cell.surroundingCells.reduce((sum, cell) => {
		if (cell.type === type){
			return sum + 1;
		} else {
			return sum;
		}
	}, 0);
}