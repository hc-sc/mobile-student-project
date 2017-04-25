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

// Pagination object

(function () {

  "use strict";

  window.Paginator = function Paginator(pages) {

    //fields

    this.pages = pages;
    this.totalPages = pages ? pages.length : 0;
    this.currentPage = 1;

    //Updates form view
    this.update = function () {
      //show/hide buttons
      if (this.currentPage === this.totalPages) {
        $(".btn-nav-next").each(function () { $(this).hide(); });
       }
      else if (this.currentPage === 1) {
        $(".btn-nav-prev").each(function () { $(this).hide(); });
      }
      else { $(".btn-nav-next, .btn-nav-prev").each(function () { $(this).show(); }); }

      // set current page in history state
      history.state.page_id = this.currentPage;

      // display appropriate page
      this.pages.each(function (i, v) {
        if (i + 1 === history.state.page_id) {
          $(v).show();
        }
        else $(v).hide();
      });
    };

    //Go to previous page
    this.goPrev = function () {
      console.log("Go prev form page");
      if (this.currentPage <= 1) return;
      this.currentPage--;
      this.update();
      $("html, body").animate({ scrollTop: 0 }, "fast");
    };

    //Go to next page
    this.goNext = function () {
      console.log("Go next form page");
      if (this.currentPage >= this.totalPages) return;
      this.currentPage++;
      this.update();
      $("html, body").animate({ scrollTop: 0 }, "fast");
    };

    //Go to specific page
    this.goTo = function (page) {
      this.currentPage = Math.max(0, Math.min(page, this.totalPages));
      this.update();
      $("html, body").animate({ scrollTop: 0 }, "fast");
    };

    //Filter out pages that match RegExp
    this.filterPages = function (p, filter) {
      if (filter.constructor.name !== "RegExp") return;
      try {
        this.pages = p.filter(function (i) {
          var result = !(filter.test(this.id));
          console.log(this.id + " - " + result);
          return result;
        });
        this.totalPages = this.pages.length;
        console.info("Pages have been filtered");
        console.dir(this.pages);
      }
      catch (e) {
        console.warn("Couldn't filter pages!");
        console.dir(e);
      }
    };
  };

})();