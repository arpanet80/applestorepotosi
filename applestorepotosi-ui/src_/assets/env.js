(function(window) {
  window["env"] = window["env"] || {};

  /////////////////////////////////////////////////////////////////////////
  // https://pumpingco.de/blog/environment-variables-angular-docker/
  /////////////////////////////////////////////////////////////////////////
  // Environment variables

  /* Local */
  window["env"]["apiUrl"] = "http://localhost:3000/";
  window["env"]["telegramBotToken"] = "8263595117:AAHIy0aro2uwCe9iD-bm4V3aTF6BdFrbcwE";
  window["env"]["telegramChatId"] = "-4973074977";
  window["env"]["publicUrl"] = "http://localhost:4200";
  window["env"]["debug"] = true;

})(this);
