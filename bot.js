var TelegramBot = require('node-telegram-bot-api');
var fs = require('fs');

// Setup polling way
var me;
var that = this;

var userList = {};
// Config
var Config = require('./variable.json')
var BlockMessages = Config.BlockMessages;
var token = Config.Token;
var isSendMsgDelete = Config.isSendMsgDelete
var sendMsgDelete = Config.SendMsgDelete
var UserMessages = Config.UserMessages
var ReplyMessages = Config.ReplyMessages
var bot = new TelegramBot(token, { polling: true });
// End
var bannedUsers = [];
// var messageOptions = {'parse_mode': 'Markdown'};
var messageOptions = {};


bot.getMe().then(function(me) {
    that.me = me;
    init();
});

function init() {
    console.log('Hi! my name is @%s!', that.me.username);
}

// Command: Thao tác command
bot.onText(/\/setlink (.+)/, function(msg, match) {
    var chatId = msg.chat.id;
    // Can save to json / db to reuse | chatID/UserId/Data
    bot.sendMessage(chatId, 'Chức năng đang cập nhật', messageOptions);
});

// Command: /getlink
bot.onText(/\/getlink/, function(msg, match) {
    var chatId = msg.chat.id;
    // Read from json / db to reuse | chatID/UserId/Data
    bot.sendMessage(chatId, 'Chức năng đang cập nhật', messageOptions);
});
// Restrich message from user
bot.on('message', function(msg) {
    console.log('message: ', JSON.stringify(msg));
    var text = msg.text;
    if (text) {
        // Strike detected
        var chatId = msg.chat.id;
        let fromUser = msg.from;
        // Check behavior
        for (let index = 0; index < BlockMessages.length; index++) {
            var element = BlockMessages[index]; // Từ khóa
            if (text.replace(/[^a-z0-9]/gi, '').toUpperCase().includes(BlockMessages[index].toUpperCase())) {
                bot.kickChatMember(chatId, fromUser.id);
                deleteMessage(chatId, msg)
                if (isSendMsgDelete) {
                    sendMessage(chatId, sendMsgDelete + fromUser.username) // Kick the user
                }
                break;
            }
        }
        // Check and reply messages
        if (UserMessages.includes(text.toUpperCase())) {
            let reply = ReplyMessages[text.toUpperCase()]
            sendMessage(chatId, reply) // Kick the user
        }
    }
});

function deleteMessage(chatId, msg) {
    console.log("Deete msg: " + msg.id + " from " + chatId)
    bot.deleteMessage(chatId, msg.message_id, messageOptions)
}

function sendMessage(chatId, msg) {
    console.log("Send msg: " + msg + " to " + chatId)
    bot.sendMessage(chatId, msg, messageOptions)
}

function banUser(user, chat, lastStrike, returningEarly) {
    var banMessage = '';
    if (returningEarly) {
        banMessage = 'Hey @' + user.username + '! You are not allowed here yet, buddy.You are still grounded for minutes.';
    } else {
        banMessage = '@' + user.username + ', you have reached the maximum count of allowed links and you are now banned for minutes.'
        banMessage += 'If you want to receive a notification when you are allowed to join this group again, send me a direct message with the text /start. Otherwise, just come back in 10 minutes and chill about the links, ok?In the meantime, think about what you\'ve done.';
    }
}

function unBanUser(user) {
    var comeBackMessage = 'You can come back to ' + user.chatName + ', pal.'
    bot.sendMessage(user.userId, comeBackMessage);
    // Send a message to the group
    bot.sendMessage(user.chatId, '@' + user.username + ' is now allowed to join this group again.');
    console.log('User is now allowed to join the group again: ' + user.username);
}

function minutesPassed(since) {
    var now = new Date();
    var diff = now.getTime() - since.getTime();
    return Math.floor(diff / (1000 * 60));
}

function allowBannedUsers() {
    if (bannedUsers.length) {
        bannedUsers.forEach(function(user, index) {
            if (minutesPassed(user.lastStrike) >= banTimeInMinutes) {
                unBanUser(user);
                bannedUsers.splice(index, 1); // Remove the user from bannedUsers list
            }
        });
    }
}

function resetStrikes() {
    if (userList) {
        // Loop through all of the users
        Object.keys(userList).forEach(function(key) {
            if (userList[key].strikes > 0 && minutesPassed(userList[key].lastStrike) >= strikesResetTimeInMinutes) {
                userList[key].strikes = 0;
                console.log('Strikes reset for ' + userList[key].username);
            }
        });
    }
}

function saveLinks() {
    fs.writeFileSync('storage/chatLinks.json', JSON.stringify(chatLinks), 'utf8');
    console.log('The invite links file has been saved');
}

function getLinks() {
    chatLinks = JSON.parse(fs.readFileSync('storage/chatLinks.json'));
}