/*
 _____ ___________  ___  ______  _____
/  __ \  _  |  _  \/ _ \ | ___ \/  ___|
| /  \/ | | | | | / /_\ \| |_/ /\ `--.
| |   | | | | | | |  _  ||  __/  `--. \
| \__/\ \_/ / |/ /| | | || |    /\__/ /
 \____/\___/|___/ \_| |_/\_|    \____/

  Public engagement Portal
  April 18, 2017
*/

// Ball-Chain navigation object

(function () {
  "use strict";

  //Ball-chain navigation header
  window.BallHeader = function BallHeader(clickHandler) {
    this.ballCount = 0;
    this.filledPages = 0;
    this.currentPage = 0;
    this.clickHandler = clickHandler || null;
    this.nameStash = [];

    var
      iterBall = null,
      iterText = null,
      self = this;

    this.initHeader = function (headerNames) {
      this.ballCount = headerNames.length;
      console.log("BALLCOUNT: " + headerNames);

      //Clearing page for new header.
      $("#ballHeader").html();
      $("#navTitle").html();

      //Load header content.
      for (var i = 0; i < this.ballCount; i++) {
        //Navheader header updates 1:2 - object-local array of header names when navballs are clicked. 
        this.nameStash[i] = headerNames[i];
        $('#ballHeader').append("<span class='navclick' style='left: " + ((i / (this.ballCount - 1)) * 94.7 + 1.3) + "%' id='navspan-" + i + "'></span>");
        $('#navTitle').append("<span class='navbox' style='left: " + (i / (this.ballCount - 1)) * 95 + "%' id='navtext-" + i + "'>" + headerNames[i] + "</span>");
      }

      $(".navclick").click(function () {
        //THIS IS WHERE NAVIGATION REQUESTS ARE COMPUTED.  What follows is largely sample code to drive this demo.
        //It can be removed and replaced with some manner of function like select_page(selected) or however you've worked it.

        //console.warn("Using progress bar default handler.");

        // If handler passed execute it, handler validates animation
        if (typeof self.clickHandler === "function") if (!self.clickHandler($(this).index() + 1)) return;

        var selected = $(this).attr("id");
        selected = selected.substring(8, 9);
        //Selected contains the header id ref of the nav ball that was clicked on.

        //If the navigation request is valid, we'll want to update currentPage (the large ball) and filledPages (how many pages
        //are successfully filled in and should be solid).  You can do it directly with currentPage and filledPages variables, or
        //setFilled(int) and setCurrent(int).

        //The below code is just for demo purposes:
        self.currentPage = selected;
        self.filledPages = selected;

        //Call updateHeader() to redraw the ball-and-chain to reflect changes.
        self.updateHeader(selected);
      });
    };

    this.setFilled = function (filled) {
      this.filledPages = filled;
      this.updateHeader();
    };

    this.setCurrent = function (current) {
      this.currentPage = current - 1; //
      this.filledPages = current - 1; //NB: Take this out later when we want the filled balls to operate independently.
      this.updateHeader();
    };

    this.updateHeader = function (page) {
      //If speed is an issue we can pre-find all the objects instead of searching for them each time.
      //console.log("BALL: "+this.currentPage);
      $("#progress-bar").val(this.currentPage / (this.ballCount - 1) * 100);

      for (var i = 0; i < this.ballCount; i++) {
        //Just ensuring no superfluous classes exist to affect styling.
        iterBall = $("#navspan-" + i).attr("class", "navclick");
        iterText = $("#navtext-" + i).attr("class", "navbox");

        if (i <= self.filledPages) {
          iterBall.addClass("make-green");
        }

        //  console.dir(page);
        if (i == (page || self.currentPage)) {
          iterBall.addClass("enlarge");
          iterText.addClass("text-enlarge");
        }
      }
      //Part 2 of 2: Getting header updates when ballheaders are clicked.
      $("#form-" + history.state.form_id + " .pageHeading").html("<h1>" + this.nameStash[self.currentPage] + "</h1>");
    };

  };

})();