'use strict';
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
          outputMessage = true
        }
        break;
      case this.level.WARN:
        if (level === this.level.WARN || level == this.level.ERROR) {
          outputMessage = true
        }
        break;
      case this.level.INFO:
        if (level === this.level.ERROR ||
            level === this.level.WARN ||
            level === this.level.INFO) {
          outputMessage = true
        }
        break;
      case this.level.DEBUG:
         outputMessage = true
        break;
      default:
        if (level === this.level.ERROR) {
          outputMessage = true
        }
        break;
    }
    var message = Date.now() + ' [' + level + '] | ' + message; 
    if (category) {
      message += ' | category = ' + category + ' | '
    }
    if (data) {
      message += ' | data = ' + JSON.stringify(data);
    }
    console.log(message)
  }
}
// LOG - end
//--------------------------

//--------------------------
// DATAEVENTNAMES - begin
var dataEventNames = {
  resetCurrentMember: 'resetCurrentMember',
  age: 'age',
  smoking: 'smoking',
  relationship: 'relationship'
}
// DATAEVENTNAMES - end
//--------------------------

//--------------------------
// DATASTORE - begin
var DataStore = function() {
  this.initialCurrentMember = {
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
  this.data = {
    currentMember: JSON.parse(JSON.stringify(this.initialCurrentMember)),
    household: {}
  };
  this.listeners = [];
  this.postData = function(dataEventName, data) {
    this.data = this.merge(this.data, data);

    logger.log(logger.level.DEBUG, 'Data notification', {
      dataEventName,
      data
    })
    this.listeners.forEach(function(listener) {
      listener.onDataUpdate(dataEventName);
    });
  }

  this.registerListener = function(listener) {
    this.listeners.push(listener)
  }

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
  }
};
// DATASTORE - end
//--------------------------

//--------------------------
// FORMCONTROL - begin
var FormControl = function(store) {
  this.addSelector = 'button.add',
  this.submitSelector = 'button[type=\'submit\']',
  this.store = store;

  this.initialize = function() {
    store.registerListener(this);
    var addElement = document.querySelector(this.addSelector);
    addElement.addEventListener("click", this.onAdd.bind(this));

    var submitElement = document.querySelector(this.submitSelector);
    submitElement.addEventListener("click", this.onSubmit.bind(this));

    this.disableAdd();
    this.disableSubmit();
  };

  this.onDataUpdate = function(dataEventName) {
    switch(dataEventName) {
      case dataEventNames.resetCurrentMember:
        break;
      default:
        var isValid = this.validate();
        if (isValid) {
          this.enableAdd();
        }
        break;
    };
  };

  this.validate = function() {
    return (this.store.data.currentMember.relationship.isValid && 
                  this.store.data.currentMember.smoking.isValid &&
                  this.store.data.currentMember.age.isValid)
  },

  this.onAdd = function(evt) {
    evt.preventDefault();
    logger.log(logger.level.DEBUG, 'Add data', this.store.currentMember)
    this.toggleElementState(this.submitSelector, false);
    this.toggleElementState(this.addSelector, true);
    this.store.postData(dataEventNames.resetCurrentMember, {
      currentMember: this.store.initialCurrentMember
    });
  },

  this.onSubmit = function(evt) {
    evt.preventDefault();
    this.disableSubmit()
  },

  this.enableAdd = function() {
    this.toggleElementState(this.addSelector, false);
  },
  
  this.disableAdd = function() {
    this.toggleElementState(this.addSelector, true);
  },

  this.enableSubmit = function() {
    this.toggleElementState(this.submitSelector, false);
  },

  this.disableSubmit = function() {
    this.toggleElementState(this.submitSelector, true);
  },

  this.toggleElementState = function(elementSelector, disabled) {
    var element = document.querySelector(elementSelector);
    element.disabled = disabled;
  }
}
// FORM CONTROL - end
//--------------------------

//--------------------------
// AGECONTROL - begin
var AgeControl = function(store) {
  this.ageSelector = 'input[name=\'age\']',
  this.ageElement = document.querySelector(this.ageSelector);
  this.store = store;

  this.initialize = function() {
    store.registerListener(this);

    this.ageElement.addEventListener("blur", this.onBlur.bind(this));
  },

  this.onDataUpdate = function(dataEventName) {
    switch(dataEventName) {
      case dataEventNames.resetCurrentMember:
        this.resetControl();
        break;
      default:
        break;
    }
  };

  this.resetControl = function() {
    this.ageElement.value = '';
  }

  this.onBlur = function(evt) {
    var value = parseFloat(this.getValue());
    var valid = this.validate(value);
    this.store.postData(dataEventNames.age, {
      currentMember: {
        age: {
          isValid: valid,
          value
        }
      }
    });
  },

  this.validate = function(age) {
    if (age > 0) {
      return true;
    }
    return false;
  },
 
  this.getValue = function() {
    return this.ageElement.value;
  }
}
// AGE CONTROL - end
//--------------------------

//--------------------------
// RELATIONSHIPCONTROL - begin
var RelationshipControl = function(store) {
  this.relationshipSelector = 'select[name=\'rel\']',
  this.relationshipElement  = document.querySelector(this.relationshipSelector);
  this.store = store;

  this.initialize = function() {
    store.registerListener(this);

    this.relationshipElement.addEventListener("change", this.onChange.bind(this));
  };

  this.onDataUpdate = function (dataEventName) {
    switch(dataEventName) {
      case dataEventNames.resetCurrentMember:
          this.resetControl();
        break;
      default:
        break;
    }
  };

  this.resetControl = function() {
    this.relationshipElement.value = '';
  }

  this.onChange = function(evt) {
    var value = this.getValue();
    var valid = this.validate(value);
    this.store.postData(dataEventNames.relationship, {
      currentMember: {
        relationship: {
          isValid: valid,
          value
        }
      }
    });
  };

  this.validate = function(value) {
    if (value.length > 0) {
      return true;
    }
    return false;
  };

  this.getValue = function() {
    return this.relationshipElement.value.trim();
  };
};
// RELATIONSHIP CONTROL - end
//--------------------------

//--------------------------
// SMOKING CONTROL - begin
var SmokingControl = function(store) {
  this.smokingSelector = 'input[name=\'smoker\']';
  this.smokingElement  = document.querySelector(this.smokingSelector);
  this.store = store;

  this.initialize = function() {
    store.registerListener(this);

    this.smokingElement.addEventListener("change", this.onChange.bind(this));
  }

  this.onChange = function (evt) {
    evt.preventDefault();
    var value = this.getValue();

    this.store.postData(dataEventNames.smoking, {
      currentMember: {
        smoking: {
          isValid: true,
          value
        }
      }
    });
  }

  this.resetControl = function() {
    this.smokingElement.checked = false;
  }

  this.onDataUpdate = function (dataEventName) {
    switch(dataEventName) {
      case dataEventNames.resetCurrentMember:
        this.resetControl();
        break;
      default:
        break;
    }
  };

  this.getValue = function() {
    return this.smokingElement.checked;
  }
}
// SMOKING CONTROL - end
//--------------------------

function app() {
  var store = new DataStore();

  var formControl = new FormControl(store);
  formControl.initialize();

  var ageControl = new AgeControl(store);
  ageControl.initialize();

  var relationshipControl = new RelationshipControl(store);
  relationshipControl.initialize();

  var smokingControl = new SmokingControl(store);
  smokingControl.initialize();
}

function main() {
  document.addEventListener("DOMContentLoaded", app);
}

main();
