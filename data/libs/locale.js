/*
    This file is part of IDRA.
	
    IDRA is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, version 2 of the License.
	
    IDRA is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
	
    You should have received a copy of the GNU General Public License
    along with Nome-Programma; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/
/*
	USAGE
	
	Set a simple localized message:
	locale.set("stupid", "Error: you are too stupid to use this software!");
	
	Get a simple message:
	locale.get("stupid");
	
	Set a message with parameters:
	locale.set("stupid", "Error: you are too stupid to %1 and %2!");
	
	Get a message passing parameters:
	locale.get("stupid", "climb a wall", "survive");
*/

"use strict";

var locale = new function()
{
	this.set = function(id, txt)
	{
		arrMsg[id] = txt;
	}
	
	this.get = function()
	{
		var msg = arrMsg[arguments[0]];
		if (arguments.length > 0) {
			for (var i = 1; i < arguments.length; i++) {
				msg = msg.replace("%" + i, arguments[i]);
			}
		}
		return msg;
	}
	
	var arrMsg = new Array;
}
