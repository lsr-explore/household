# household

## Major components

### DataStore - The datastore is single source of data for the application.   It has the following responsibilities:
  * Manages a list of controls that have registered as listeners to data changes using the registerListener medhot
  * Processes messages sent to it via postData method.
  * Notifies listeners of data changes.  (At this time, all controls are notified for all changes) using the onDataUpdate method of listeners.
  * Transforms the data to be sent to the server - removes valid flags and flattens the object.

### Logger - logs messages to the console

### Miscellaneous
  * Various style methods were defined to handle transitions and errors
  * The simulation to the server is implemented with a timeout and callback.

### Controls

Controls should only communicate through sending or processing notifications to the dataStore.   They should not communicate directly with other controls.
  * AgeControl - manages the state of the age input field
  * RelationshipControl - manages the state of the relationship select field.
  * SmokingControl - manages the state of the smoking toggle
  * AddControl - add button
  * SubmitControl - submit button
  * Household - Displays the members in a table
  * SavedHousehold - Display of results sent to the server through a simulated callback method.
  * StatusControl - simple status line for messages.

## Quality Checks
* Code was run through JSHint 

## Acceptance Criteria

### Age Control
* Any value greater than 0 is considered a valid age
* If a non numeric value or a value that is <= 0 is entered in the age control
  * an error message should appear
  * the control should be outlined in red
  * the add button should be disabled.

* If a numeric value is entered in the age control..
  * The error message should be removed
  * the control should be outlined in green
  * If the relationship control value is valid, the add button should be enabled

### Relationship Control
* If the relationship is entered, but no value selected
  * display an error message
  * highlight the control in red
  * the add button should be disabled.
* If a valid relationship is selected
  * the error message should be removed
  * the control should be outlined in green
  * If the age control value is valid, the add button should be enabled.

### Add Control
* If the relationship and age control values are valid, the add control button should be enabled.
* Selecting the add control button should...
  * Display a message in the status field 
  * Add the member to the table
  * Enable the submit button
  * Disable the add control button once the operation is complete.
  * log a message to the console.

### Remove button
A remove button should be displayed for each record in the table.
* If the remove button is selected
  * The member should be removed from the table.
  * The submit button should be enabled.
  * log a message to the console.

### Submit button
* Selecting the submit button should..
  * Serialize the household data and simulate sending it to the server
  * Disable the submit button once the operation is complete
  * Log a message to the status field
  * log a message to the console.

### Navigation
* Navigating away from the page with unsaved changes should result in a prompt to stay on the page.


### Future criteria not implemented.

* Handle full server CRUD functionality
* Add or submit data should be a multi phase process - first polling controls if it is ok to continue to provide a window for halting the operation. 
* Accessibility and localization not supported.
* Unit tests and acceptance tests were not implemented.
