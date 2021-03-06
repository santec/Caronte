﻿/*
	Caronte: engine for Adventure Games and other Hypertext Applications
	(C) 2000 Enrico Colombini
	(C) 2011 Federico Razzoli
	
	Caronte is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, version 2 of the License.
	
	Caronte is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.
	
	You should have received a copy of the GNU General Public License
	along with Caronte.  If not, see <http://www.gnu.org/licenses/>.
*/


"use strict";

	// ### eventi needs to be moved to an extension!!! ###
	var eventi = {};
		eventi.frasi        = [];  // array di frasi che si alternano
		eventi.probabilita  = 5;            // probabilità che una frase sia visualizzata


var menu  = new UTILE.menuHandler("boxMenu");
var v     = {};

var SW = new function() {
	/*
	 *    Meta Info
	 */
	
	this.info = {
		name        : "Caronte",
		URL         : ["https://github.com/santec/Caronte Progetto su GitHub",
					   "http://www.erix.it/idra.html IDRA, di Enrico Colombini"],
		version     : "2.0.1",
		APIVersion  : "2.0",
		maturity    : "Sviluppo",
		date        : "2011",
		license     : "GNU GPL 2",
		licenseURL  : "README",
		author      : "Federico Razzoli",
		contacts    : "santec [At) riseup [Dot' net",
		copyright   : "2000 Enrico Colombini\n2011 Federico Razzoli",
		descr       : "Motore per giochi d'avventure e altre applicazioni ipertestuali. Deriva da IDRA, di Enrico Colombini.",
		notes       : ""
	};
	
	
	/*
	 *    Properties
	 */
	
	var links            = [],    // links created by Application
		numLinks         = 0,     // number of links
		here             = null,  // current page function
		boxMain;
	
	// ##########################################################################
	// ##  Inizio area funzioni chiamabili dall'autore                         ##
	// ##########################################################################
	
	// ===== Funzioni di cambio pagina ==========================================
	
	// Va alla pagina pag, che viene ricordata nella proprietà here
	// come pagina corrente, chiama:
	// Intestazione(pag) se esiste, pag(), PiePagina(pag) se esiste
	this.goTo = function(pag, args) {
		here = pag; // ricorda la pagina
		this.pageBegin();
		UTILE.events.exec("PageBegin");
		if (typeof args === "undefined") {
			args = null;
		}
		pag(args); // write page
		UTILE.events.exec("PageEnd");
		this.pageEnd();
	}
	
	// check if user-defined function exist before calling
	this.callUserFunc = function(strFunc) {
		if (typeof strFunc === "function" || typeof strFunc === "string") {
			eval(strFunc + "()");
			return true;
		} else { // errors
			if (typeof strFunc === "undefined") {
				UTILE.issue(locale.getp("errNoFunc", strFunc));
			} else {
				UTILE.issue(locale.getp("errInvalidFunc", strFunc));
			}
			return false;
		}
	}
	
	// exec again current page (here)
	this.refresh = function() {
		this.goTo(here);
	}
	
	// ===== Funzioni di creazione pagina =======================================
	
	// update boxMain title
	this.title = function(tit) {
		this.say('<h2>' + tit + "</h2>");
	}
	
	// write text in mainBox. accepts an arbitrary number of args.
	// there is no separator between args.
	this.say = function() {
		for (var i = 0; i < arguments.length; i++) {
			boxMain.write(arguments[i]);
		}
	}
	
	// similar to say(), but:
	//   * args are separated by a <br>\n
	//   * <p>args</p>
	// So you don't have to write all the tags.
	this.sayNl = function() {
		var out = "\n<p>\n",
			i;
		for (i = 0; i < arguments.length; i++) {
			out += arguments[i] + "<br>\n";
		}
		out += "\n</p>\n";
		this.say(out);
	}
	
	// empty line
	this.nl = function(n) {
		var out;
		if (n < 1) {
			n = 1;
		}
		while (n > 0) {
			out = "\n<br>&nbsp;<br>\n";
			n--;
		}
		this.say(out);
	}
	
	// similar to say(), but:
	//   * args are separated by a <br>\n
	//   * <p>args</p>
	// CSSClass, if specified, is the CSS class used (HTML attr "class")
	// So you don't have to write all the tags and CSS classes.
	this.sayNlCSS = function(CSSClass) {
		var out,
			i;
		if (CSSClass) {
			out   = '\n<p class="';
			out  += CSSClass;
			out  += '">\n';
		} else {
			out = "\n<p>\n";
		}
		for (i = 1; i < arguments.length; i++) {
			out += arguments[i];
			out += "<br>\n";
		}
		out += "\n</p>\n";
		this.say(out);
	}
	
	// Show a message and a link to prev location or another action
	//    @txt      : String     : Message
	//    @action   : mixed      : Function or string to execute; default: here
	this.message = function(txt, action) {
		this.pageBegin();
		this.say("<p>" + txt + "</p>\n");
		this.option(locale.get("SW.more"), action || here);
		this.pageEnd();
	}
	
	// Aggiunge una scelta al menu della pagina se la condizione cond e' vera,
	// desc e' il testo da mostrare, act e' l'azione da compiere in caso di clic
	// Se chiamata con due soli argomenti, sono desc e act (la condizione e' sempre vera).
	// SW.option(cond, desc, act)
	// SW.option(desc, act)
	this.option = function(p1, p2, p3) {
		var cond  = p1,
			desc  = p2,
			act   = p3;
		if (arguments.length === 2) { //2 argoments
			cond  = 1;
			desc  = p1;
			act   = p2;
		}
		if (cond) {
			this.say("<ul><li>"); //usa stile 'lista' mettendo la scelta in una lista a se' stante
			this.link(desc, act); //aggiunge scelta nel testo
			this.say("</li></ul>");
		}
	} 
	
	// Aggiunge una scelta nel testo, ricorda l'azione in links[], il link e'
	// preceduto da idPagina per evitare problemi con la navigazione del browser
	this.link = function(desc, act) {
		this.say("<a href=\"javascript:SW.exec('" + numLinks + "');\">");
		this.say(desc, "</a>");
		links[numLinks] = act;
		numLinks++;
	}
	
	// Aggiunge la scelta ";ore"; se cond e' vera usa act1, altrimenti act2
	// Se chiamata con un solo argomento, aggiunge la scelta in ogni caso
	// SW.more(cond, act1, act2)
	// SW.more(act)
	this.more = function(p1, p2, p3) {
		var cond = p1,
			act1 = p2,
			act2 = p3; //3 argomenti
		if (arguments.length === 1) {  //1 argument
			cond = 1;
			act1 = p1;
		}
		if (cond) {
			this.option(cond, locale.get("SW.more"), act1)
		} else if (act2) {
			this.option(!cond, locale.get("SW.more"), act2) 
		}
	}
	
	// ===== Funzioni di apertura e chiusura pagina =============================
	
	// assegna un identificatore univoco per rilevare problemi causati dai comandi 
	// di navigazione del browser, azzera il contatore delle scelte
	this.pageBegin = function() {
		numLinks = 0;
	}
	
	// Termina la scrittura di una pagina
	this.pageEnd = function() {
		boxMain.send();
	}
	
	// ===== Funzioni ausiliarie ================================================
	
	// Ritorna il nome di una pagina (funzione)
	this.pageName = function(p) {
		var s = p.toString();
		// salta "function" e uno spazio, tiene fino alla parentesi esclusa
		return trim(s.substring(9, s.indexOf("(", 0)));
	}
	
	// Tira un dado a n facce (6 se non indicate), ritorna un intero tra 1 e n
	this.dice = function(num) {
		if (!num) {
			num = 6; // default: 6 facce
		}
		return(Math.floor(Math.random() * (num - 1)) + 1); 
	}
	
	// trim() does not exist in javascript
	function trim(s) {
		var inizio  = 0,
			fine    = s.length; //primo carattere oltre la fine
		if (fine > 0) {
			while (s.charAt(inizio) === " ") {
				inizio++;
			}
			while (s.charAt(fine - 1) === " " && fine > inizio) {
				fine--;
			}
		}
		return s.substring(inizio, fine);
	}
	
	this.infoMenu = function() {
		var secInfo = menu.addSection("secInfo", locale.get("about"), locale.get("aboutTitle")),
			p;
		if (typeof info !== "undefined") {
			secInfo.addButton(null, "bttInfoApp", "SW.showInfo(info, 'app')", locale.get("infoApp"),  locale.get("infoAppTitle"));
		}
		secInfo.addButton(null, "bttInfoSW", "SW.showInfo(SW.info)", this.info.name, locale.getp("infoAbout", this.info.name));
		for (p in plugins.get()) {
			if (typeof plugins.get(p).info !== "undefined") {
				secInfo.addButton(null, "bttInfoPlugin" + p, "SW.showInfo(plugins.get('" + p + "').info)", p, locale.getp("infoAboutExt", p));
			}
		}
		if (typeof dictInfo !== "undefined") {
			secInfo.addButton(null, "bttInfoDict", "SW.showInfo(dictInfo)", locale.get("dictionary"), locale.get("currentDictionary"));
		}
	}
	
	this.showInfo = function(infoSet, moduleType) {
		if (typeof infoSet !== "undefined") {
			var out = "";
			if (infoSet["name"] || infoSet["title"])
				out += "<p><strong>" + 
					   locale.getp("infoAbout", infoSet["name"] ? infoSet["name"] : infoSet["title"]) + 
					   "</strong></p>\n";
			out += '<table border="0">\n';
			if (infoSet["version"]) {
				var version = (infoSet["maturity"]) ?
					infoSet["version"] + " (" + infoSet["maturity"] + ")" :
					infoSet["version"];
				out += "  <tr>\n" +
					   "    <td>" + locale.get("version") + "</td>\n" +
					   "    <td>" + version + "</td>\n" +
					   "  </tr>\n";
			}
			if (infoSet["URL"]) {
				var URL = "";
				if (UTILE.isArray(infoSet["URL"])) {
					for (var u in infoSet["URL"]) {
						// split url from text?
						var p = infoSet["URL"][u].indexOf(" ");
						if (p > 0) {
							var linkURL   = infoSet["URL"][u].substr(0, p);
							var linkText  = infoSet["URL"][u].substr(p);
						} else {
							// there's no text
							var linkURL   = infoSet["URL"][u];
							var linkText  = linkURL;
						}
						if (URL) URL += "<br>";
						URL += '<a href="' + linkURL + '">' + linkText + "</a>";
					}
				} else {
					var p = infoSet["URL"].indexOf(" ");
					if (p > 0) {
						var linkURL   = infoSet["URL"].substr(0, p);
						var linkText  = infoSet["URL"].substr(p);
					} else {
						// there's no text
						var linkURL   = infoSet["URL"];
						var linkText  = linkURL;
					}
					URL += '<a href="' + linkURL + '">' + linkText + "</a>";
				}
				out += "  <tr>\n" +
					   "    <td>" + locale.get("URL") + "</td>\n" +
					   "    <td>" + URL + "</td>\n" +
					   "  </tr>\n";
			}
			if (infoSet["APIVersion"]) {
				out += "  <tr>\n" +
					   "    <td>" + locale.get("APIVersion") + "</td>\n" +
					   "    <td>" + infoSet["APIVersion"] + "</td>\n" +
					   "  </tr>\n";
			}
			if (infoSet["author"]) {
				out += "  <tr>\n" +
					   "    <td>" + locale.get("author") + "</td>\n" +
					   "    <td>" + infoSet["author"] + "</td>\n" +
					   "  </tr>\n";
			}
			if (infoSet["contacts"]) {
				out += "  <tr>\n" +
					   "    <td>" + locale.get("contacts") + "</td>\n" +
					   "    <td>" + infoSet["contacts"] + "</td>\n" +
					   "  </tr>\n";
			}
			if (infoSet["copyright"]) {
				out += "  <tr>\n" +
					   "    <td>" + locale.get("copyright") + "</td>\n" +
					   "    <td>" + infoSet["copyright"].replace("\n", "<br>") + "</td>\n" +
					   "  </tr>\n";
			}
			if (infoSet["license"] || infoSet["licenseURL"]) {
				var license;
				if (infoSet["license"] && infoSet["licenseURL"])
					license = '<a href="' + infoSet["licenseURL"] + '">' + infoSet["license"] + "</a>";
				else if (infoSet["license"])
					license = ""+infoSet["license"];
				else
					license = '<a href="' + infoSet["licenseURL"] + '">' + infoSet["licenseURL"] + "</a>";
				out += "  <tr>\n" +
					   "    <td>" + locale.get("license") + "</td>\n" +
					   "    <td>" + license + "</td>\n" +
					   "  </tr>\n";
			}
			if (infoSet["descr"]) {
				out += "  <tr>\n" +
					   "    <td>" + locale.get("description") + "</td>\n" +
					   "    <td>" + infoSet["descr"].replace("\n", "<br>") + "</td>\n" +
					   "  </tr>\n";
			}
			if (infoSet["notes"]) {
				out += "  <tr>\n" +
					   "    <td>" + locale.get("notes") + "</td>\n" +
					   "    <td>" + infoSet["notes"].replace("\n", "<br>") + "</td>\n" +
					   "  </tr>\n";
			}
			out += "</table>\n";
			if (moduleType === "app" && typeof appLocaleInfo === "object") {
				out += '<a href="javascript:SW.showInfo(appLocaleInfo)">' +
				       locale.get("infoAppLocaleShow") + "</a>";
			}
			modal.info(out);
		} else {
			modal.info(local.get("noInfo"));
		}
	}
	
	// (re)start the Application Call plugins.loadAll() + start
	this.prepare = function() {
		var curTheme;
		
		// assign Application options
		if (typeof defaultOptions === "undefined") {
			window.defaultOptions = null;
		}
		options = new UTILE.opt(options, defaultOptions);
		
		// assign SW options
		if (typeof UTILE.SWDefaultOptions === "undefined") {
			UTILE.SWDefaultOptions = null;
		}
		this.options = new UTILE.opt(UTILE.SWOptions, UTILE.SWDefaultOptions);
		delete UTILE.SWOptions;
		
		// register themes
		for (var key in UTILE.allThemes) {
			if (typeof key === "string") {
				curTheme = UTILE.allThemes[key];
				if (key === this.options.get("defaultTheme")) {
					curTheme.isDefault = true;
				}
				UTILE.themes.add(key, curTheme);
			}
		}
		
		// apply selected theme
		var theme = options.get("theme") || this.options.get("defaultTheme");
		UTILE.themes.select(theme);
		
		// choose & load Application language
		if (typeof options.get("lang") !== "undefined" && typeof appLocaleInfo === "undefined") {
			var appLang = options.get("lang");
			queue.add("UTILE.link('js', 'apps/" + window.appName + "/locale/" + appLang + "')");
			// localized functions (if useless, don't create them)
			this.sayLocale = function()
			{
				var txt = locale.getp.apply(this, arguments);
				this.say(txt);
			}
			this.titleLocale = function(tit)
			{
				this.title(locale.get(tit));
			}
			this.sayNlLocale = function()
			{
				var out = "\n<p>\n";
				for (var i = 0; i < arguments.length; i++) {
					out += locale.get(arguments[i]) + "<br>\n";
				}
				out += "\n</p>\n";
				this.say(out);
			}
			this.sayNlCSSLocale = function()
			{
				var out;
				if (arguments[0]) out = "\n<p class=\"" + arguments[0] + "\">\n";
				else out = "\n<p>\n";
				for (var i = 1; i < arguments.length; i++) {
					out += locale.get(arguments[i]) + "<br>\n";
				}
				out += "\n</p>\n";
				this.say(out);
			}
			this.messageLocale = function(txt, action)
			{
				var txt = locale.get(locale, action);
				this.message(txt);
			}
			this.optionLocale = function()
			{
				var cond  = p1,
					desc  = p2,
					act   = p3;
				if (arguments.length === 2) {
					cond  = 1;
					desc  = p1;
					act   = p2;
				}
				desc = locale.get(desc);
				if (cond) {
					this.say("<ul><li>") //usa stile 'lista' mettendo la scelta in una lista a se' stante
					this.link(desc, act) //aggiunge scelta nel testo
					this.say("</li></ul>")
				}
			}
			this.linkLocale = function(desc, act)
			{
				desc = locale.get(desc);
				this.link(desc, act);
			}
			this.moreLocale = function(p1, p2, p3)
			{
				var cond = p1,
					act1 = p2,
					act2 = p3;
				if (arguments.length === 1) {
					cond = 1;
					act1 = p1;
				}
				if (cond) {
					this.option(cond, locale.get("SW.more"), act1)
				} else if (act2) {
					this.option(!cond, locale.get("SW.more"), act2) 
				}
			}
		} else {
			window.appLocaleInfo = true;
		}
		
		// load Caronte localization file
		if (typeof langOk === "undefined") {
			queue.add("UTILE.link('js', 'data/locale/' + SW.options.get('defaultLang'))", [], "locale");
		}
		
		// load dictionary
		if (typeof dictionary === "undefined") {
			window.dictionary = this.options.get("defaultDictionary");
		}
		if (dictionary) {
			UTILE.link("js", "data/dict/" + dictionary);
		} else {
			var dictOk = true;
		}
		
		if (typeof extensions === "undefined") {
			window.extensions = {};
		}
		
		// erase if exists
		menu.erase();
		
		gui.erase();
		boxMain = gui.createArea("boxMain", "box");
		
		// load extensions
		plugins.loadAll();
		
		if (this.options.toBool("noExec") !== true) {
			queue.add("SW.start()", ["?typeof appLocaleInfo !== 'undefined' && typeof plugins !== 'undefined' && plugins.ready",  "dictOk", "localeInfo"]);
		}
	}
	
	// this is called then Caronte's locale & plugins are loaded
	this.start = function() {
		var secThemes,
			themes;
		
		gui.draw();
		
		// add themes Control
		if (!this.options.toBool("noThemes")) {
			secThemes  = menu.addSection("secThemes");
			themes     = UTILE.themes.getAll();
			/*
			for (var t in themes) {
				var al = (t + "\n");
				for (var p in themes[t]) {
					al += (p + ": " + themes[t][p]) + "\n";
				}
				alert(al);
			}
			*/
			secThemes.addSelect(null, "selTheme", themes, "UTILE.themes.select", locale.get("mnuThemes"));
		}
		
		// add info section + draw() menu
		if (this.options.toBool("showInfo")) {
			this.infoMenu();
		}
		
		menu.draw();
		
		here  = null;  // no page open
		v     = {};    // re-alloc to remove garbage
		
		if (typeof info !== "undefined" && typeof info.title === "string") {
			parent.document.title = locale.get(info.title);
		} else {
			parent.document.title = locale.get(this.options.get("winTitle"));
		}
		
		UTILE.events.exec("ApplicationBegin");
		
		// initialize start Application
		this.callUserFunc("Inizia");
	}
	
	// Esegue l'azione act, che puo' essere:
	// - una stringa da eseguire, ad esempio "goTo(P1)"
	// - una funzione (pagina) a cui andare, ad esempio P1
	this.exec = function(act, args) {
		act = links[act];
		if (typeof(act) === "function") {       // function (page)
			this.goTo(act, args);
		} else if (typeof(act) === "string") {  // javascript expr
			eval(act);
		} else { // errors
			if (typeof act === "undefined") {
				modal.bad(locale.get(errNoAction));
			} else if (typeof act.toString !== "undefined") {
				modal.bad(locale.getp(errInvalidAction, act.toString()));
			} else {
				modal.bad(locale.get(errInvalidAction, act));
			}
		}
	}
};


// Date alcune frasi (o comunque stringhe) ne restituisce una a caso

function FraseCasuale() {
	var num = SW.dice(arguments.length);
	return arguments[num];
}

// Eventi casuali

function Eventi() {
	var eTesto;
	if (SW.dice(100) <= eventi.probabilita) {
		eTesto = eventi.frasi[SW.dice(eventi.frasi.length)];
		SW.sayNlCSS("evidFrase", eTesto);
	}
}

