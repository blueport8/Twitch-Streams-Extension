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

    self.execute(self);
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
    let message = self.buildMessageSingle(self, notif);

    self.displayNotification(streamUrl, title, message);
    self.cleanup(self);
  },

  notifyFew: function(self) {
    const title = "Twitch streams";
    let streamUrl = browser.runtime.getURL("icons/twitch-notif-48.jpg");
    let message = self.buildMessageFew(self, self.toNotify);
    self.displayNotification(streamUrl, title, message);
    self.cleanup(self);
  },

  notifyMany: function(self) {
    const title = "Twitch streams";
    let streamUrl = browser.runtime.getURL("icons/twitch-notif-48.jpg");
    let message = self.buildMessageMany(self, self.toNotify);

    self.displayNotification(streamUrl, title, message);
    self.cleanup(self);
  },

  buildMessageSingle: function(self, notification) {
    var uptimeMs = uptimeHelper.getUptimeMs(notification.channelUptime);
    var hyphen = self.determineHyphen(uptimeMs);
    
    return `Channel ${notif.channelName} ${hyphen} live.`;
  },

  buildMessageFew: function(self, notifications) {
    let message = "";
    for (var notifIdx = 0; notifIdx < notifications.length; notifIdx++) {
      message += notifications[notifIdx].channelName;
      if(notifIdx != notifications.length - 1)
        message += ", ";
    }
    var highestUptimeMs = uptimeHelper.getHighestUptimeMs(notifications);
    var hyphen = self.determineHyphen(uptimeMs, true);

    message += ` ${hyphen} live.`;
  },

  buildMessageMany: function(self, notifications) {
    var highestUptimeMs = uptimeHelper.getHighestUptimeMs(notifications);
    var hyphen = self.determineHyphen(highestUptimeMs, true);
    let channels = notifications.length;

    return `${channels} followed channels ${hyphen} live.`;
  },

  determineHyphen: function(uptimeMs, many) {
    if(uptimeMs < 600000) // 10 minutes
      return "went";
    if(many)
      return "are";
    return "is";
  },

  displayNotification: function(imgUrl, title, message) {
    browser.notifications.create({
      "type": "basic",
      "iconUrl": imgUrl,
      "title": title,
      "message": message
    });
  }
};

var uptimeHelper = {
  getUptimeMs: function(date_str) {
    let date = new Date(date_str);
    return new Date().valueOf() - date.valueOf();
  },

  getHighestUptimeMs: function(notifications) {
    var highestUptimeMs = 0;
    for (var notifIdx = 0; notifIdx < notifications.length; notifIdx++) {
      var uptime = uptimeHelper.getUptimeMs(notifications[notifIdx].channelUptime);
      if(highestUptimeMs < uptime){
        highestUptimeMs = uptime;
      }
    }
    return highestUptimeMs;
  }
};