/* jshint browser: true */
/* jshint -W097 */ /* remove function form of use strict warning */

'use strict';
//--------------------------
// SIMULATE_SERVER_POST - begin
var simulateServerPost = function(data, callback) {
    setTimeout( function() {
      logger.log(logger.level.INFO, 'Simulated server callback complete', data);
      callback(data);
    }, 4000);
};
// SIMULATE_SERVER_POST - end
//--------------------------

//--------------------------
// GENERATE_ID - begin
// sourced from:  http://fiznool.com/blog/2014/11/16/short-id-generation-in-javascript/
var ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

var ID_LENGTH = 5;

var generateId = function() {
  var rtn = '';
  for (var i = 0; i < ID_LENGTH; i++) {
    rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return rtn;
};
// GENERATE_ID - end
//--------------------------

//--------------------------
// LOG - begin
var logger = {
  level: {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG',
  },
  currentLevel: 'DEBUG',
  log: function(level, message, data, category) {
    var outputMessage = false;
    switch(this.currentLevel) {
      case this.level.ERROR:
        if (level === this.level.ERROR) {
          outputMessage = true;
        }
        break;
      case this.level.WARN:
        if (level === this.level.WARN || level == this.level.ERROR) {
          outputMessage = true;
        }
        break;
      case this.level.INFO:
        if (level === this.level.ERROR ||
            level === this.level.WARN ||
            level === this.level.INFO) {
          outputMessage = true;
        }
        break;
      case this.level.DEBUG:
         outputMessage = true;
        break;
      default:
        if (level === this.level.ERROR) {
          outputMessage = true;
        }
        break;
    }
    var date = new Date();

    var logMessage = '>>>>>>> ' + date.toString() + ' [' + level + '] | ' + message; 
    if (category) {
      logMessage += ' | category = ' + category + ' | ';
    }
    if (data) {
      logMessage += ' | data = ' + JSON.stringify(data);
    }
    window.console.log(logMessage);
    window.console.log(data);
  }
};
// LOG - end
//--------------------------

//--------------------------
// DATAEVENTNAMES - begin
var dataEventNames = {
  resetCurrentMember: 'resetCurrentMember',
  age: 'age',
  smoking: 'smoking',
  relationship: 'relationship',
  memberAdded: 'memberAdded',
  householdSaved: 'householdSaved',
  memberRemoved: 'memberRemoved',
  savingHousehold: 'savingHousehold'
};
// DATAEVENTNAMES - end
//--------------------------

//--------------------------
// DATASTORE - begin
var DataStore = function() {
  this.initialCurrentMember = {
    id: {
      value: null
    },
    relationship: {
      isValid: false,
      value: null
    },
    age: {
      isValid: false,
      value: null
    },
    smoking: {
      isValid: true,
      value: false
    },
  };
  this.unsavedChanges = false;
  this.data = {
    currentMember: JSON.parse(JSON.stringify(this.initialCurrentMember)),
    household: {}
  };
  this.listeners = [];
  this.postData = function(dataEventName, data, sender) {
    switch(dataEventName) {
      case dataEventNames.memberRemoved:
        var keys = Object.keys(data.household);
        delete this.data.household[keys[0]];
        this.unsavedChanges = true;
        break;
      case dataEventNames.householdSaved:
        this.unsavedChanges = false;
        break;
      default:
        this.data = this.merge(this.data, data);
        this.unsavedChanges = true;
        break;
    }

    logger.log(logger.level.DEBUG, 'Data notification', {
      dataEventName: dataEventName,
      data: data,
      sender: sender
    });
    this.listeners.forEach(function(listener) {
      listener.onDataUpdate(dataEventName, data, sender);
    });
  };

  this.registerListener = function(listener) {
    this.listeners.push(listener);
  };

  this.merge = function (dataObj, dataUpdate) {
    for (var key in dataUpdate) {
      try {
        if ( dataUpdate[key].constructor==Object ) {
          dataObj[key] = this.merge(dataObj[key], dataUpdate[key]);
        } else {
          dataObj[key] = dataUpdate[key];
        }
      } catch(e) {
        dataObj[key] = dataUpdate[key];
      }
    }

    return dataObj;
  };

  this.prepForStore = function(data) {
    var transformedData = {};

    for (var key in data) {
      var transformedMember = {};
      var member = data[key];

      for (var memberKey in member)  {
        transformedMember[memberKey] = member[memberKey].value;
      }
      transformedData[key] = transformedMember;
    }

    return transformedData;
  };
};
// DATASTORE - end
//--------------------------

//--------------------------
// ADDCONTROL - begin
var AddControl = function(store) {
  this.selector = 'button.add';
  this.element = document.querySelector(this.selector);

  this.store = store;
  this.name = 'Add';

  // Stage change handler
  this.onDataUpdate = function(dataEventName, data, sender) {
    switch(dataEventName) {
      case dataEventNames.resetCurrentMember:
        // Ignore
        break;
      default:
        var isValid = this.validate();
        if (isValid) {
          this.enableAdd();
        } else {
          this.disableAdd();
        }
        break;
    }
  };

  this.validate = function() {
    return (this.store.data.currentMember.relationship.isValid && 
                  this.store.data.currentMember.smoking.isValid &&
                  this.store.data.currentMember.age.isValid);
  };

  this.onAdd = function(evt) {
    evt.preventDefault();
    logger.log(logger.level.DEBUG, 'Add data', this.store.data.currentMember);

    var member = JSON.parse(JSON.stringify(this.store.data.currentMember));
    var id = generateId();
    member.id.value = id;

    var household = {};
    household[id] = member;

    this.store.postData(dataEventNames.memberAdded, {
      household: household
    }, this.name);

    // Reset currentMember state
    this.store.postData(dataEventNames.resetCurrentMember, {
      currentMember: this.store.initialCurrentMember
    }, this.name);

    // Update controls
    this.disableAdd();
  };

  this.enableAdd = function() {
    this.element.disabled = false;
  };
  
  this.disableAdd = function() {
    this.element.disabled = true;
  };

  this.initialize = function() {
    // register for state changes
    this.store.registerListener(this);

    // Add event listeners
    this.element.addEventListener('click', this.onAdd.bind(this));

    // Disable
    this.disableAdd();
  };

  this.initialize();
};
// ADDCONTROL - end
//--------------------------
//--------------------------
// SUBMIT - begin
var SubmitControl = function(store) {
  this.selector = 'button[type=\'submit\']';
  this.element = document.querySelector(this.selector);

  this.store = store;
  this.name = 'Submit';

  // Stage change handler
  this.onDataUpdate = function(dataEventName, data, sender) {
    switch(dataEventName) {
      case dataEventNames.resetCurrentMember:
        // Ignore
        break;
      case dataEventNames.memberAdded:
      case dataEventNames.memberRemoved:
        this.enableSubmit();
        break;
      default:
        break;
    }
  };

  this.serverPostComplete = function(data) {
    this.store.postData(dataEventNames.householdSaved, data, this.name);
  };

  this.onSubmit = function(evt) {
    evt.preventDefault();

    // Update controls
    this.disableSubmit();
    this.store.postData(dataEventNames.savingHousehold, { }, this.name);

    var data = this.store.prepForStore(store.data.household);

    simulateServerPost(data, this.serverPostComplete.bind(this));
  };

  this.enableSubmit = function() {
    this.element.disabled = false;
  };

  this.disableSubmit = function() {
    this.element.disabled = true;
  };

  this.initialize = function() {
    // register for state changes
    store.registerListener(this);

    // Add event listeners
    this.element.addEventListener('click', this.onSubmit.bind(this));

    // Disable submit
    this.disableSubmit();
  };

  this.initialize();
};

//  SUBMITCONTROL - end
//--------------------------

//--------------------------
// AGECONTROL - begin
var AgeControl = function(store) {
  this.selector = 'input[name=\'age\']';
  this.element = document.querySelector(this.selector);
  this.messageElement = document.createElement('span');
  this.element.parentNode.appendChild(this.messageElement);
  this.store = store;
  this.name = 'Age';

  this.onDataUpdate = function(dataEventName, data, sender) {
    switch(dataEventName) {
      case dataEventNames.resetCurrentMember:
        this.resetControl();
        break;
      default:
        break;
    }
  };

  this.resetControl = function() {
    this.element.value = '';
    clearFormStyles(this.element, this.messageElement);
  };

  this.onBlur = function(evt) {
    var value = parseFloat(this.getValue());
    var valid = this.validate(value);
    var message = '';
    if (!valid) {
      message = 'Please enter an age older than 0.';
    }
    showValidationState(this.element, valid, this.messageElement, message);
    this.store.postData(dataEventNames.age, {
      currentMember: {
        age: {
          isValid: valid,
          value: value
        }
      }
    }, this.name);
  };

  this.validate = function(age) {
    if (age > 0) {
      return true;
    }
    return false;
  };
 
  this.getValue = function() {
    return this.element.value;
  };

  this.initialize = function() {
    store.registerListener(this);

    this.element.addEventListener('blur', this.onBlur.bind(this));
  };

  this.initialize();

};
// AGE CONTROL - end
//--------------------------

//--------------------------
// RELATIONSHIPCONTROL - begin
var RelationshipControl = function(store) {
  this.selector = 'select[name=\'rel\']';
  this.element  = document.querySelector(this.selector);
  this.messageElement = document.createElement('span');
  this.element.parentNode.appendChild(this.messageElement);
  this.store = store;
  this.name = 'Relationship';

  this.onDataUpdate = function (dataEventName, data, sender) {
    switch(dataEventName) {
      case dataEventNames.resetCurrentMember:
          this.resetControl();
        break;
      default:
        break;
    }
  };

  this.resetControl = function() {
    this.element.value = '';
    clearFormStyles(this.element, this.messageElement);
  };

  this.onChange = function(evt) {
    var value = this.getValue();
    var valid = this.validate(value);
    var message = '';
    if (!valid) {
      message = 'Please select a relationship.';
    }
    showValidationState(this.element, valid, this.messageElement, message);
    this.store.postData(dataEventNames.relationship, {
      currentMember: {
        relationship: {
          isValid: valid,
          value: value
        }
      }
    }, this.name);
  };

  this.validate = function(value) {
    if (value.length > 0) {
      return true;
    }
    return false;
  };

  this.getValue = function() {
    return this.element.value.trim();
  };

  this.initialize = function() {
    store.registerListener(this);

    this.element.addEventListener('change', this.onChange.bind(this));
    this.element.addEventListener('blur', this.onChange.bind(this));
  };

  this.initialize();

};
// RELATIONSHIP CONTROL - end
//--------------------------

//--------------------------
// SMOKING CONTROL - begin
var SmokingControl = function(store) {
  this.selector = 'input[name=\'smoker\']';
  this.element  = document.querySelector(this.selector);
  this.store = store;
  this.name = 'Smoker';

  this.onChange = function (evt) {
    evt.preventDefault();
    var value = this.getValue();

    this.store.postData(dataEventNames.smoking, {
      currentMember: {
        smoking: {
          isValid: true,
          value: value
        }
      }
    }, this.name);
  };

  this.resetControl = function() {
    this.element.checked = false;
  };

  this.onDataUpdate = function (dataEventName, data, sender) {
    switch(dataEventName) {
      case dataEventNames.resetCurrentMember:
        this.resetControl();
        break;

      default:
        break;
    }
  };

  this.getValue = function() {
    return this.element.checked;
  };

  this.initialize = function() {
    store.registerListener(this);

    this.element.addEventListener('change', this.onChange.bind(this));
  };

  this.initialize();

};
// SMOKING CONTROL - end
//--------------------------

//--------------------------
// HOUSEHOLD CONTROL - begin
var Household = function(store) {
  this.name = 'Household';
  this.store = store;
  this.selector = 'div.builder';
  this.element = document.querySelector(this.selector);
  this.table = document.createElement('table');
  this.tbody = document.createElement('tbody');
  this.table.appendChild(this.tbody);
  this.element.appendChild(this.table);

  this.createHeader = function() {
    var header = this.table.createTHead();
    var row = header.insertRow(0);
    row.insertCell(0).innerHTML = 'Id';
    row.insertCell(1).innerHTML = 'Age';
    row.insertCell(2).innerHTML = 'Relationship';
    row.insertCell(3).innerHTML = 'Smoker?';
    row.insertCell(4).innerHTML = 'Remove';
  };

  this.onClick = function(evt) {
    var id = evt.target.attributes[0].value;

    var household = JSON.parse(JSON.stringify(this.store.data.household));

    var memberToRemove = {}; 
    memberToRemove[id] = household[id];

    this.store.postData(dataEventNames.memberRemoved, {
      household: memberToRemove
    }, this.name);
  };

  this.displayRecords = function() {
    var household = this.store.data.household;
    var tableRow;
    this.tbody.innerHTML = '';
    for (var key in household) {
      var member = household[key];
      tableRow = this.tbody.insertRow(-1);
      tableRow.setAttribute('align', 'center');

      tableRow.insertCell(0).innerHTML = member.id.value;
      tableRow.insertCell(1).innerHTML = member.age.value;
      tableRow.insertCell(2).innerHTML = member.relationship.value;
      tableRow.insertCell(3).innerHTML = member.smoking.value;

      var td = tableRow.insertCell(4);
      var button = document.createElement('button');
      button.innerHTML = 'X';
      button.setAttribute('data-name', member.id.value);
      button.addEventListener('click', this.onClick.bind(this));
      td.appendChild(button);
      
    }
  };

  this.removeRecord = function() {
    this.store.postData(dataEventNames.memberRemoved, { }, this.name);
  };

  this.onDataUpdate = function(dataEventName, data, sender) {
    switch(dataEventName) {
      case dataEventNames.memberAdded:
      case dataEventNames.memberRemoved:
        this.displayRecords();
        break;
      default:
        break;
    }
  };

  this.initialize = function() {
    store.registerListener(this);
    this.createHeader();
  };

  this.initialize();
};
// HOUSEHOLD CONTROL - end
//--------------------------

//--------------------------
//  SAVED HOUSEHOLD CONTROL - begin
var SavedHousehold = function(store) {
  this.name = 'Saved Household';
  this.selector = 'pre';
  this.element  = document.querySelector(this.selector);
  this.store = store;

  store.registerListener(this);

  this.displayResults = function(data) {
    clearDebug(this.element);
    showDebug(this.element);
    var div = document.createElement('div');
    this.element.appendChild(div);
    div.innerHTML = JSON.stringify(data, null, 2);
  };

  // Stage change handler
  this.onDataUpdate = function(dataEventName, data, sender) {
    switch(dataEventName) {
      case dataEventNames.householdSaved: 
        this.displayResults(data);
        break;
      default:
        break;
    }
  };
};
//  SAVED HOUSEHOLD CONTROL - end
//--------------------------

//--------------------------
//  STATUS CONTROL - begin
var StatusControl = function(store) {
  this.name = 'Status Control';
  this.selector = 'div.builder';
  this.store = store;
  this.element = document.querySelector(this.selector);
  this.div = document.createElement('div');
  this.div.className = styles.status;
  this.element.appendChild(this.div);

  store.registerListener(this);

  this.displayMessage = function(message) {
    this.div.innerHTML = message;

    setTimeout( function() {
      this.div.innerHTML = '';
    }.bind(this), 4000);
  };

  this.messages = {
    saved: function() {
      return 'Household saved';
    },
    saving: function() {
      return 'Saving Household';
    },
    added: function(id) {
      return 'Member id = \'' + id + '\' added to household.';
    },
    removed: function(id) {
      return 'Member id = \'' + id + '\' removed from household.';
    }
  };

  // Stage change handler
  this.onDataUpdate = function(dataEventName, data, sender) {
    var keys;
    switch(dataEventName) {
      case dataEventNames.householdSaved: 
        this.displayMessage(this.messages.saved());
        break;
      case dataEventNames.savingHousehold: 
        this.displayMessage(this.messages.saving());
        break;
      case dataEventNames.memberAdded: 
        keys = Object.keys(data.household);
        this.displayMessage(this.messages.added(keys[0]));
        break;
      case dataEventNames.memberRemoved: 
        keys = Object.keys(data.household);
        this.displayMessage(this.messages.removed(keys[0]));
        break;
      default:
        break;
    }
  };
};
//  SAVED HOUSEHOLD CONTROL - end
//--------------------------

//--------------------------
//  FORM STYLES - begin
function createStyle(name, rules) {
  var style = document.querySelector('style');
  if ( !(style.sheet || {}).insertRule)  {
    (style.styleSheet || style.sheet).addRule(name, rules);
  } else {
    style.sheet.insertRule(name + '{' + rules + '}' ,0);
  }
}

var styles = {
  'valid': 'valid',
  'invalid': 'invalid',
  'error': 'error',
  'status': 'status',
  'showDebug': 'showDebug',
  'debug': 'debug'
};

function createStyles() {
  createStyle('.' + styles.valid, 'border-color: green;');
  createStyle('.' + styles.invalid, 'border-color: red;');
  createStyle('.' + styles.error, 'color: red;');
  createStyle('table', 'border-collapse: collapse;');
  createStyle('table, th, td', 'border: 1px solid darkgrey; padding: 5px;');
  createStyle('.' + styles.status, 'background-color: lightgrey; margin: 5px; padding: 5px; text-align: center; min-height: 1em; max-width: 300px;');
  createStyle('.' + styles.showDebug, 'font-family: monospace; border: 1px solid black; padding: 10px; display: block; max-width: 300px;');
}

function showValidationState(element, valid, messageElement, message) {
  clearFormStyles(element, messageElement);
  if (valid){
    element.className = element.className + ' ' + styles.valid;
    messageElement.innerHTML = message;
  } else {      
    element.className = element.className + ' ' + styles.invalid;
    messageElement.className = messageElement.className + ' ' + styles.error;
    messageElement.innerHTML = message;
  }
}

function clearFormStyles(element, messageElement) {
  element.className = element.className.replace(new RegExp(' ' + styles.valid, 'g'), '');
  element.className = element.className.replace(new RegExp(' ' + styles.invalid, 'g'), '');
  messageElement.className = messageElement.className.replace(new RegExp(' ' + styles.error, 'g'), '');
  messageElement.innerHTML = '';
}

function clearDebug(element) {
  element.className = element.className.replace(new RegExp(styles.debug, 'g'), '');
  element.className = element.className.replace(new RegExp(' ' + styles.debug, 'g'), '');
  element.className = element.className.replace(new RegExp(' ' + styles.showDebug, 'g'), '');
  element.className = element.className + ' ' + styles.debug;
  element.innerHTML = '';
}

function showDebug(element) {
  element.className = element.className.replace(new RegExp(' ' + styles.showDebug, 'g'), '');
  element.className = element.className.replace(new RegExp(' ' + styles.debug, 'g'), '');
  element.className = element.className + ' ' + styles.showDebug;
}

//  FORM STYLES - end
//--------------------------

function app() {
  createStyles();

  var store = new DataStore();

  // Forrm controls
  var addControl = new AddControl(store);
  var submitControl = new SubmitControl(store);
  var ageControl = new AgeControl(store);
  var relationshipControl = new RelationshipControl(store);
  var smokingControl = new SmokingControl(store);

  var savedHousehold = new SavedHousehold(store);
  var statusControl = new StatusControl(store);
  var household = new Household(store);

  window.addEventListener("beforeunload", function (e) {
    if (store.unsavedChanges) {
      var confirmationMessage = "\o/";

      e.returnValue = confirmationMessage;     // Gecko, Trident, Chrome 34+
      return confirmationMessage;              // Gecko, WebKit, Chrome <34
    }
  }.bind(this));
}

function main() {
  document.addEventListener('DOMContentLoaded', app);
}

main();
