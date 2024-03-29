//-----------------------------------------------------------------------------------------------------------------------------------------
// Meetings View - the meeting view
//
// Author: Nick Hingston - mothership software ltd 2013
//
//-----------------------------------------------------------------------------------------------------------------------------------------
// Public prototype Functions:
//-----------------------------------------------------------------------------------------------------------------------------------------
// Public class functions:
//----


define(["backbone","text!../templates/Meeting.html"], function(Backbone, meetingTemplate) {
    "use strict";
    var _meetingTemplate;
    var MeetingView = Backbone.View.extend({
        events: {
            'click #nextTopic': 'nextTopicClicked',
            'click #nextItem':  'nextItemClicked'
        },
        initialize: function(){
            //_.bindAll(this, "render");
            var me = this;

            // bit of a cheat - better have a higher level controller view that triggers event in this view
            $("#nextItem").click(function() {me.nextItemClicked();});
            this.stopMeeting();
            this.model.bind('change', function()  { me.render(); });
            this.render();
        },
        render:function() {

            var currentTopicInt = this.model.get("currentTopic");
            var agenda = this.model.get("agenda");
            var attendees = this.model.get("attendees");
            var meetingName = this.model.get("name");

            if (!agenda.length) {
                return this;
            }
            for (var i in agenda) {
                if (typeof agenda[i].remainingTime == 'undefined') {
                    agenda[i].remainingTime = agenda[i].length*1000;
                }
                var items = agenda[i].items;
                for (var j in items) {
                    if (typeof items[j].remainingTime == 'undefined') {
                        items[j].remainingTime = items[j].length*1000;
                    }
                }
            }
            var remainingTopics = agenda.slice(currentTopicInt+1, agenda.length);
            var currentTopic = agenda[currentTopicInt];
            this.$el.html(_meetingTemplate({
                me: this,
                name: meetingName,
                agenda: agenda,
                currentTopic:currentTopic,
                attendees: attendees,
                remainingTopics:remainingTopics
            }));

            this.$topicList = this.$el.find("#topicList").children();
            this.$currentTimer = this.$el.find(".currentTopic").find(".listTime");
            return this;
        },
        updateTimer:function() {

            var me = this;
            var startTime = this.model.get("startTime");
            var currentTopicIndex = this.model.get("currentTopic");

            var endTimeOfCurrentTopic = startTime;
            var agenda = this.model.get("agenda");

            for (var i = 0; i <= currentTopicIndex; i++) {
                endTimeOfCurrentTopic += agenda[i].length*1000;
            }

            var timeElapsed = endTimeOfCurrentTopic - (new Date()).getTime();
            if (agenda && this.$currentTimer !== undefined) {
                agenda[currentTopicIndex].remainingTime = timeElapsed;

                this.$currentTimer.text(me.timeStringFromElapsed(timeElapsed));

                var currentItemIndex = this.model.get("currentItem");

                var thisItem = agenda[currentTopicIndex].items[currentItemIndex];

                thisItem.remainingTime -= 100;

                // find the current item in the DOM

                var n = currentItemIndex+1;
                for (i = currentTopicIndex-1; i >= 0; i--) {
                    n += agenda[i].items.length + 1;
                }

                var $currentItem = $(this.$topicList[n]);


                $currentItem.children().text(me.timeStringFromElapsed(thisItem.remainingTime));

                if (thisItem.remainingTime < 0 && thisItem.remainingTime > -200 && $currentItem.length) {
                    console.log("remaing time: " + thisItem.remainingTime);
                    // TODO: !!add class crashes mobile safari!!
                    // this is the workaround...far from ideal.
                    $currentItem.css({background:"#FF454B",color:"#fff"});
                }
            }
        }

    });

    MeetingView.prototype.startMeeting = function() {
        var me = this;

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = 0;
        }
        this.timer = setInterval(function() {me.updateTimer();}, 100);
    };

    MeetingView.prototype.stopMeeting = function() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = 0;
        }
    };

    MeetingView.prototype.resetMeeting = function() {
        this.stopMeeting();
        this.model.set("startTime",new Date().getTime());
        this.model.set("currentItem", 0);
        this.model.set("currentTopic", 0);
        var agenda = this.model.get("agenda");
        for (var i in agenda) {
            agenda[i].remainingTime = agenda[i].length*1000;
            var items = agenda[i].items;
            for (var j in items) {
                items[j].remainingTime = items[j].length*1000;
            }
        }
    };

    MeetingView.prototype.timeStringFromElapsed = function(timeElapsed) {
        var mins = Math.floor(Math.abs((timeElapsed/1000)/60));
        var secs = Math.floor(Math.abs((timeElapsed/1000)%60));
        var timeStr = "";

        // format time (probably a simpler way to achieve this)
        if (timeElapsed < 0) {
            timeStr = "-";
        }

        if (mins < 10) {
            timeStr += "0";
        }
        timeStr += mins + ":";
        if (secs < 10) {
            timeStr += "0";
        }
        timeStr += secs;
        return timeStr;
    };

    MeetingView.prototype.nextTopicClicked = function(btn) {
        var currentTopic = this.model.get("currentTopic");
        var agenda = this.model.get("agenda");
        currentTopic++;
        if (currentTopic < agenda.length) {
            this.model.set("currentTopic", currentTopic);
            this.model.set("currentItem", 0);
        }
    };

    MeetingView.prototype.nextItemClicked = function() {
        var currentTopic = this.model.get("currentTopic");
        var currentItem = this.model.get("currentItem");
        var agenda = this.model.get("agenda");
        currentItem++;
        if (currentItem < agenda[currentTopic].items.length) {
            this.model.set("currentItem", currentItem);
        }
        else {
            this.nextTopicClicked(0);
        }
    };

    MeetingView.prototype.classForTopic = function(topic) {
        var currentTopicIndex = this.model.get("currentTopic");
        var agenda = this.model.get("agenda");

        var thisTopicIndex = agenda.indexOf(topic, 0);

        if (thisTopicIndex < currentTopicIndex) {
            return "title doneItem sticky";
        }
        else if (thisTopicIndex === currentTopicIndex) {
            return "currentTopic title sticky";
        }
        return "title sticky";
    };

    MeetingView.prototype.classForItem = function(topic, item) {
        var currentTopicIndex = this.model.get("currentTopic");
        var currentItemIndex = this.model.get("currentItem");
        var agenda = this.model.get("agenda");

        var thisTopicIndex = agenda.indexOf(topic, 0);
        var thisItemIndex = agenda[thisTopicIndex].items.indexOf(item, 0);

        if (thisTopicIndex < currentTopicIndex) {
            return "listItem doneItem";
        }
        else if (currentTopicIndex === thisTopicIndex) {
            if (currentItemIndex > thisItemIndex) {
                return "listItem doneItem";
            }
            if (currentItemIndex === thisItemIndex) {
                if (agenda[thisTopicIndex].items[thisItemIndex].remainingTime > 0) {
                    return "listItem currentItem";
                }
                else {
                    return "listItem lateItem";
                }
            }
        }

        return "listItem";
    };

    _meetingTemplate = _.template(meetingTemplate);

    return MeetingView;
});