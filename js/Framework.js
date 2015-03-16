/**The framework */

var Framework = function() {
	/** PRIVATE MEMBERS */

	var _templateList= [];	

	var _extends = function (destination, source) {   
		for (var property in source) {
			destination[property] = source[property];
		}
		return destination;
	};

	// observer pattern for data binding /
	var Observer = function () {
		this._listeners = {};
	};

	Observer.prototype.notify = function (dataChanged, args) {
		var subscribers, i;

		subscribers = this._listeners[dataChanged];
		if (subscribers !== undefined) {
			for (i = 0; i < subscribers.length; i++) {
				if(subscribers[i].context) {
					subscribers[i].view.apply(subscribers[i].context, args);
				} else {
					subscribers[i].view(args);
				} 
			}
		}
	};

	Observer.prototype.onDataChanged = function (dataChanged, view, ctx) {
		var actionObj = this._listeners[dataChanged];
		if (actionObj === undefined) {
			this._listeners[dataChanged] = [
			                                {context:ctx, view:view}
			                                ];
		}
	};

	//Creating a basic MVC pattern
	//the model
	var model = model || {};

	//the view
	var BaseTemplate = function() {
		html = '';
		placeholder = '';
		ctrl = {};
		observer = {};
	};

	BaseTemplate.prototype.refresh = function () {
		var htmlToDisplay = this.html;

		var items = htmlToDisplay.match(/{{(.*?)}}/g);
		for(var i = 0; i < items.length; i++) {
			var currentItem = items[i];
			var key = currentItem.substring (2, currentItem.length - 2);

			htmlToDisplay = htmlToDisplay.replace(currentItem, this.ctrl.getModel()[key]);

			this.observer.onDataChanged(currentItem, this.refresh, this);
		}

		var lastFocusedElement = document.activeElement.id;
		this.placeholder.innerHTML = htmlToDisplay;
		
		// we compute the html first, then we inject it in one time, in order to improve performances 
		var newFocusableElement = document.getElementById(lastFocusedElement); 

		//setting back the focus
		if(newFocusableElement) {
			newFocusableElement.focus();
			newFocusableElement.selectionStart = newFocusableElement.selectionEnd = newFocusableElement.value.length
		}
	}

	BaseTemplate.prototype.render = function (placeholder) {
		this.placeholder = document.getElementsByClassName(placeholder.substring(1))[0];
		this.refresh();
	}

	//the controller
	var BaseController = function () {
		data = {};	
	};

	BaseController.prototype.getModel = function () {
		return this.data;
	}

	/** PUBLIC MEMBERS */
	return {
		create: function (args) {

			template = args.template || {};
			data     = args.data     || {};

			var html = document.getElementById(template).innerHTML;

			//sanitize html
			html = html.replace(/(\r\n|\n|\r)/gm," ");
			html = html.replace(/\s{2,}/g," ");
			
			//instanciating the controller
			var ctrl = Object.create (BaseController.prototype);
			ctrl = _extends(ctrl, args);
			
			// data binding
			var dataObserver = Object.create (Observer.prototype);
			dataObserver = _extends(dataObserver, new Observer());

			var tpl = Object.create (BaseTemplate.prototype);
			tpl = _extends (tpl, {
						html: html,
						ctrl: ctrl,
						observer: dataObserver
					});

			// event binding
			var eventObserver = Object.create (Observer.prototype);
			_extends(eventObserver, new Observer());

			var items = html.match(/data-event="(.*?)"/g);
			for(var i = 0; i < items.length; i++) {
				var currentItem = items[i];
				var events = currentItem.substring('data-event="'.length, currentItem.length - 1).split(':');

				eventObserver.onDataChanged(events[0], ctrl[events[1]]);
			}

			// event delegation in order improve good performances
			var _eventDelegate = function(evt) {
				if(evt.target.tagName == 'A') {
					eventObserver.notify('click', evt);
					dataObserver.notify(evt.target);				
				} else if (evt.target.tagName == 'INPUT') {
					eventObserver.notify('keyup', evt);
					dataObserver.notify(evt.target);
				}
			}

			document.addEventListener("keyup", _eventDelegate, false);
			document.addEventListener("click", _eventDelegate, false);

			return tpl;	
		}
	}
}();

