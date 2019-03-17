"use strict"

var notificationEngine = {
  toNotify: [],

  init: function() {
    setInterval(this.handler, 10000, this);
  },

  handler: function(self) {
    if(!self.canHandle(self)) {
      self.cleanup(self);
      return;
    } 

    if(self.toNotify.length == 1)
      return self.notifySingle(self);
    return self.notifyMany(self);
  },

  execute: function(self) {
    let pending = self.toNotify.length;
    if (pending == 1)
      self.notifySingle(self);
    else if (pending > 1 && pending <= 5 )
      self.notifyFew(self);
    else
      self.notifyMany(self);
  },

  canHandle: function(self) {
    if(self.toNotify.length == 0)
      return false;
    if(!settingsAPI.notifications_enabled)
      return false;
    return true;
  },

  cleanup: function(self) {
    self.toNotify = [];
  },

  notifySingle: function(self) {
    const title = "Twitch streams";
    let notif = self.toNotify[0];
    let streamUrl = browser.runtime.getURL(notif.img);
    let message = `${notif.channelName} is live.`;

    self.displayNotification(streamUrl, title, message);
    self.cleanup(self);
  },

  notifyFew: function(self) {
    const title = "Twitch streams";
    let streamUrl = browser.runtime.getURL("icons/twitch-notif-48.jpg");
    let message = self.buildMessageFew(self.toNotify);
    self.displayNotification(streamUrl, title, message);
    self.cleanup(self);
  },

  notifyMany: function(self) {
    const title = "Twitch streams";
    let channels = self.toNotify.length;
    let streamUrl = browser.runtime.getURL("icons/twitch-notif-48.jpg");
    let message = `${channels} channels are live.`;

    self.displayNotification(streamUrl, title, message);
    self.cleanup(self);
  },

  buildMessageFew: function(notifications) {
    let message = "";
    for (var notifIdx = 0; notifIdx < notifications.length; notifIdx++) {
      message += notifications[notifIdx];
      if(notifIdx != notifications.length - 1)
        message += ", ";
    }
    message += " are live.";
  },

  displayNotification: function(imgUrl, title, message) {
    browser.notifications.create({
      "type": "basic",
      "iconUrl": imgUrl,
      "title": title,
      "message": message
    });
  }
}