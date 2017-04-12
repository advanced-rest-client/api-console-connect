var apiconsole = {};
apiconsole.connect = {};

// var DEFAULT_URL = 'https://anypoint.mulesoft.com/apiplatform/repository/v2/organizations/98196c04';
// DEFAULT_URL += '-981c-4702-90bd-c8a2f697d895/public/apis/13093617/versions/179482/files/root';
/**
 * Finds and returns the raml-js-parser element.
 */
apiconsole.connect.parser = function() {
  return document.querySelector('raml-js-parser');
};
/**
 * Finds and returns the raml-json-enhance element.
 */
apiconsole.connect.enhancer = function() {
  return document.querySelector('raml-json-enhance');
};
/**
 * Finds and returns the api-console element.
 */
apiconsole.connect.console = function() {
  return document.querySelector('api-console');
};
/**
 * Initialized the application.
 * 1) Adds listeners for parser and enhancers
 * 2) Adds UI event handlers
 * 3) Loads default API (DEFAULT_URL variable).
 */
apiconsole.connect.init = function() {
  var parser = apiconsole.connect.parser();
  var enhacer = apiconsole.connect.enhancer();
  parser.addEventListener('api-parse-ready', apiconsole.connect._parseReadyHandler);
  parser.addEventListener('error', apiconsole.connect._parseErrorHandler);
  enhacer.addEventListener('raml-json-enhance-ready', apiconsole.connect._enhancedHandler);
  enhacer.addEventListener('error', apiconsole.connect._enhancedErrorHandler);
  apiconsole.connect.initUi();
  // apiconsole.connect.loadApi(DEFAULT_URL);
};
/**
 * Initializes event handlers for the UI.
 */
apiconsole.connect.initUi = function() {
  document.querySelector('paper-listbox')
  .addEventListener('iron-select', apiconsole.connect._apiSelected);
};
/**
 * Load a RAML spec into the console.
 * 
 * @param {String} url The URL of the RAML file.
 */
apiconsole.connect.loadApi = function(url) {
  var apiConsole = document.querySelector('api-console');
  apiConsole.raml = undefined;
  apiconsole.connect.hideError();
  apiconsole.connect.toggleLoader(true);
  var parser = apiconsole.connect.parser();
  parser.loadApi(url);
};
/**
 * Called when the RAML parser parses the spec and has JSON ready.
 * Function calls the enhancer to produce the right data format.
 */
apiconsole.connect._parseReadyHandler = function(e) {
  var enhacer = apiconsole.connect.enhancer();
  enhacer.json = e.detail.json.specification;
};
/**
 * Handler for errors.
 */
apiconsole.connect._parseErrorHandler = function() {
  var message = 'Unable to parse RAML data. Make user you are authorized to use the resource';
  message += ' and your internet connection is working properly.';
  apiconsole.connect.displayError(message);
};
apiconsole.connect._enhancedErrorHandler = function() {
  var message = 'Received data are unknown format.';
  apiconsole.connect.displayError(message);
};
/**
 * Displays error screen.
 */
apiconsole.connect.displayError = function(message) {
  apiconsole.connect.toggleLoader(false);
  var msg = document.querySelector('.error-message');
  msg.innerText = message;
  document.querySelector('#error').removeAttribute('hidden');
};
/**
 * Hides the error message
 */
apiconsole.connect.hideError = function() {
  document.querySelector('#error').setAttribute('hidden', true);
};
/**
 * Called the the enhancer finish work and data are ready to serve.
 * Will set the result on the api-console's raml attribute.
 */
apiconsole.connect._enhancedHandler = function(e) {
  var apiConsole = document.querySelector('api-console');
  apiConsole.raml = e.detail.json;
  apiconsole.connect.toggleLoader(false);
};
/**
 * Called when the user click on the navigation drawer.
 */
apiconsole.connect._apiSelected = function(e) {
  var src = e.detail.item.dataset.src;
  apiconsole.connect.loadApi(src);
};
/**
 * Shows the Mule loader.
 * 
 * @param {Boolean} visible New state of the loader.
 */
apiconsole.connect.toggleLoader = function(visible) {
  var loader = document.querySelector('#logo-mule-wrapper');
  if (visible) {
    loader.removeAttribute('hidden');
  } else {
    loader.setAttribute('hidden', true);
  }
};
// Must start when all components are ready.
window.addEventListener('WebComponentsReady', apiconsole.connect.init);

