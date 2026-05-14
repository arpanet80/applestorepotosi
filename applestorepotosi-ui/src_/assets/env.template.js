(function(window) {
    window.env = window.env || {};

    // Environment variables
    window["env"]["apiUrl"] = "${API_URL}";
    window["env"]["telegramBotToken"] = "${TELEGRAM_BOT_TOKEN}";
    window["env"]["telegramChatId"] = "${TELEGRAM_CHAT_ID}";
    window["env"]["publicUrl"] = "${PUBLIC_URL}";
    window["env"]["debug"] = "${DEBUG}";
  })(this);
