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

(function () {

  "use strict";

  var app = {

    //Fields

    server: "http://pmra.edumedia.ca/test.php",
    photo: null,
    textDict: {
      //Junk data for initialization
      profile: {
        "2": "Reporter",
        "@2": [
          "Individual",
          "Company Representative"
        ],
        "3": "Company Name",
        "4": "Title/Position",
        "5": "First Name",
        "6": "Last Name",
        "7": "Address",
        "8": "City",
        "9": "@country",
        "10": "@subdivision",
        "11": "Postal Code/ZIP",
        "12": "Telephone",
        "13": "Email Address",
        "btnSaveProfile": "Save Profile"
      }
    },
    picklistData: {},
    countries: {},
    subdivisions: {},
    formData: {},
    formDebounce: null,
    postalRegex: {},
    profile: {},
    //previousFormID: null,
    submissionHistory: [],
    pagination: null,
    attachNum: 0,

    //Methods

    initialize: function () {
      //Wait for DOM/Device to be ready
      //---gulp will inject either DOMContentLoaded/DeviceReady listener---
    },

    //DOMContent is loaded and device is ready, set event listeners
    onDeviceReady: function () {
      console.log("App ready");

      // Shrink webview instead of viewport while keyboard is active
      if (Keyboard) Keyboard.shrinkView(true);

      // Enable platform specific features
      if (met.isAndroid()) {
        $(".platform-android").each(function () { $(this).removeClass("hidden"); });
        $("#main-menu").addClass("navmenu-fixed-left");
      }
      else {//if (met.isApple() || met.isWindows() || met.isBlackberry()) {
        // TODO: discuss windows/BB
        //$(".pageHeading").css("margin-top", "6.5em;");
        $(".platform-ios").each(function () { $(this).removeClass("hidden"); });
        $("#main-menu").addClass("navmenu-fixed-right");
      }

      //init data elements
      app.getData("ISO/countries.json")
        //Get country data
        .then(function countryDataLoadHandler(data) {
          //console.warn("COUNTRIES --- ");
          //console.dir(data);
          app.countries = data.countries;

          //get subdivision data
          return app.getData("ISO/subdivisions.json");
        })
        .catch(function (err) {
          console.error("Couldn't get countries");
          console.dir(err);
        })
        .then(function subdivisionDataLoadHandler(data) {
          //console.warn("SUBDIVISIONS --- ");
          //console.dir(data);
          app.subdivisions = data;

          //Get form data
          return app.getData("FormData.json");
        })
        .catch(function (err) {
          console.error("Couldn't get subdivisions");
          console.dir(err);
        })
        .then(function formDataLoadHandler(data) {
          //console.warn("FORM DATA --- ");
          //console.dir(data);
          app.formData = data;

          // Get postal code data
          return app.getData("ISO/postalcodes.json");
        })
        .catch(function (err) {
          console.error("Couldn't get form data.");
          console.dir(err);
        })
        .then(function postalDataLoadHandler(data) {
          //console.warn("POSTAL CODE DATA --- ");
          //console.dir(data);
          app.postalRegex = data;

          //Init secure storage object
          return app.storage.init();
        })
        .catch(function (err) {
          console.error("Couldn't get postal code data.");
          console.dir(err);
        })
        .then(function secureStorageInitializationHandler(storage) {
          console.log("Storage initialized.");

          // Set event listeners

          var menuHam = new Hammer($("#main-menu")[0]);

          menuHam.on(met.isAndroid() ? 'swipeleft' : 'swiperight', function (ev) {
            $("#main-menu").offcanvas("hide");
          });

          // Navigation listener, wait for hashchange to switch pages
          $(window).on("hashchange", app.navigate);

          // Go back one history state
          $("#btnBack").on("click", app.back);

          // Hide menu
          $(".navmenu-nav li a, #btnCloseMenu").on("click", function () { $('#main-menu').offcanvas('hide'); });

          // Highlight menu buttons for current active page
          $(".btn-menu").on("click", function (ev) {
            $(".btn-menu").each(function () {
              if (this.id == ev.currentTarget.id) $(this).addClass('current');
              else $(this).removeClass('current');
            });
          });

          // Change language when menu language button is pressed
          $(".btnMenuLang").on("click", function () { app.loadText($(this).attr("value")); });

          //Save user profile
          $("#btnSaveProfile").on("click", app.saveProfile);

          // Init language and 'start app'

          if (met.storage.exists("pep_lang")) {
            app.initText(met.storage.load("pep_lang"));
            app.checkProfile();
          }
          else {
            location.replace("#intro-page");
            history.go(-1);
            $("#intro-page > div > input").one("click", function () {
              app.initText(this.id);
              app.checkProfile();
            });
          }
          //Load submission history
          return app.storage.exists("sub-history");
        })
        .catch(function (err) {
          console.dir(err);
          console.error("Storage initalization error");
        })
        .then(function historyExistsHandler(exists) {
          //TODO: Bilingual
          if (exists) {
            $('#existsAlert').text("Submissions Completed");
            app.loadSubmissions();
          }
          else { $('#existsAlert').text("There Are No Submissions To Display"); }
        })
        .catch(function (err) {
          console.error("Error checking if submission history exists");
          console.dir(err);
        });
    },

    checkProfile: function () {

      var profileAnswer = met.storage.load("profileAnswer");
      //Check if userProfile exists
      app.storage.exists("userProfile")
        .then(function (exists) {
          if (exists && profileAnswer == "true") {
            //Userprofile is in local storage proceed to main page
            console.log("Loading user profile");
            app.storage.loadData("userProfile")
              .then(function (data) {
                console.info("found profile.");
                app.profile = JSON.parse(data);
                if ($("#profile").my()) $("#profile").my("data", app.profile);
                location.replace("#main-page");
                history.go(1);
              })
              .catch(function (err) {
                console.error("Problem loading profile!");
                location.replace("#main-page");
                history.go(1);
                console.dir(err);
              });
          }
          else {
            // load intro page asking if user wants to save profile
            // -yes: go to profile page
            // -no: go to main page
            console.log("No existing user profile");

            if (profileAnswer == "false") {
              location.replace("#main-page");
              history.go(1);
            } else {
              location.replace("#profile-load");
              history.go(1);
            }

            $("#btnAcceptProfile").one("click", function () {
              var profileAnswer = "true";
              met.storage.save("profileAnswer", profileAnswer);
              app.goTo("#profile-page");
            });
            $("#btnDeclineProfile").one("click", function () {
              var profileAnswer = "false";
              met.storage.save("profileAnswer", profileAnswer);
              var store = met.storage.load("profileAnswer");
              console.log(store);
              app.goTo("#main-page");
            });
          }
        })
        .catch(function (err) {
          console.error("Storage issue checking if profile exists.");
          console.dir(err);
        });
    },

    //Navigavtion handler
    navigate: function (ev) {
      console.info("Navigating to: " + location.hash);
      //console.dir(ev);

      var
        page_id = location.hash.substring(1, 5),
        form_id = location.hash.substring(6, 10);

      history.replaceState(
        { form_id: form_id },
        page_id === "form" ? app.textDict[form_id].Name : APP_NAME,
        location.hash
      );

      if (page_id === "form") {
        met.spinner.show(false);
        app.loadForm();
      }

      // Show current page hide others
      $('[data-role="page"]').each(function () {
        if ("#" + this.id === location.hash) {
          $(this).removeClass("inactive-page");
          $(this).addClass("active-page");
          //$("#main-title").html("<h4>" + "Public Engagement Portal" + "</h4>");
        }
        else {
          $(this).removeClass("active-page");
          $(this).addClass("inactive-page");
          //unbind and clear form
          if (this.id === "form-" + app.previousFormID) {
            console.warn("Clearing form");
            if ($("#form-" + app.previousFormID).my()) $("#form-" + app.previousFormID).my("remove");
            $(this).empty();
            clearTimeout(app.formDebounce);
          }
        }
      });

      app.previousFormID = history.state.form_id;
      $("select").each(function () { $(this).select2(); });
    },

    //Load page, set state
    goTo: function (hash, title, state) {
      title = title || APP_NAME;
      state = state || null;

      location.hash = hash;
      history.replaceState(state, title, hash);
    },

    //go back one page in history
    back: function () {
      history.go(-1);
      return false;
    },

    //Load and bind form
    loadForm: function () {

      app.storage.exists("form-" + history.state.form_id)
        .then(function (exists) {
          if (exists) {
            //Form is in local storage, load and check
            console.info("found form data.");

            //Load template
            return app.storage.loadData("form-" + history.state.form_id);
          }
          else {
            console.info("No existing form draft");
            app.buildForm();
          }
        })
        .catch(function (err) {
          console.error("Storage issue checking if form draft exists.");
          console.dir(err);
        })
        .then(function (data) {
          //Ask user if they wish to resume draft

          if (confirm(app.textDict.messages.keepDraft)) {
            //use saved draft
            console.warn("Draft data");
            console.dir(data);
            data = JSON.parse(data);
            console.dir(data);
            app.formData.template[history.state.form_id] = data;
            if ($("#" + history.state.form_id).my()) $("#" + history.state.form_id).my("data", app.formData.template[history.state.form_id]);
            console.dir(app.formData.template[history.state.form_id]);
            if ($("#" + history.state.form_id).my()) $("#" + history.state.form_id).my("data", app.formData.template[history.state.form_id]);

            app.buildForm();
          }
          else {
            //reset form data
            app.getData("FormData.json")
              .then(function (data) {
                app.formData.template[history.state.form_id] = data.template[history.state.form_id];
                app.buildForm();
              })
              .catch(function (err) {
                console.error("Couldn't get form data to reset.");
                console.dir(err);
                app.buildForm();
              });
          }
          setTimeout(met.spinner.hide, 1500);
        })
        .catch(function (err) {
          console.error("Problem loading form data to reset!");
          console.dir(err);
          app.buildForm();
        });
    },

    // Load and bind form
    buildForm: function () {

      $(location.hash).load("assets/HTML-Templates/common.html", function () {
        $("#privacy-modal").my({
          ui: {
            "#privacy-title": { bind: "privacy-title" },
            "#privacy-header": { bind: "privacy-header" },
            "#privacy-content": { bind: "privacy-content" }
          }
        }, app.textDict[history.state.form_id].Privacy);


        $('#helpSection').my({
          ui: {
            "#modal-title": { bind: "title" },
            "#help-section": { bind: "content" }
          }
        }, app.textDict[history.state.form_id].btnHelp);
      });

      //$(location.hash).load("assets/HTML-Templates/form-" + history.state.form_id + ".html", );

      $.get("assets/HTML-Templates/form-" + history.state.form_id + ".html", function (formContent) {
        $(location.hash).append(formContent);
        var
          manifest = { data: {}, ui: {} },
          selector = "",
          labels = [],
          buttons = [],
          pickLists = [],
          buttonGroups = [],
          button = null,
          inputs = [],
          opts = null,
          keys = [],
          self = null,
          i = 0;

        //manifest.ui["#privacy-title"] = { bind: "privacy-title" };
        //manifest.ui["#privacy-header"] = { bind: "privacy-header" };
        //manifest.ui["#privacy-content"] = { bind: "privacy-content" };

        //manifest.ui["#modal-title"] = { bind: "mtitle" };
        //manifest.ui['#help-section'] = { bind: "content" };

        //Generate manifest from ui elements, bind text
        labels = $(location.hash).find(".form-page>.form-group>label");
        labels.each(function () {
          selector = "#" + this.parentNode.id + ">label";
          manifest.ui[selector] = { bind: this.parentNode.id };
        });

        buttons = $(location.hash).find(".form-group>button");
        buttons.each(function () {
          selector = "#" + this.id;
          //console.dir(selector);
          manifest.ui[selector] = { bind: this.id };

          if (this.id === "btnAttach") $(this).on("click", app.attachImage);
        });

        pickLists = $(location.hash).find(".form-group>select");
        manifest = app.buildPicklists(pickLists, manifest, selector, opts, keys, i);

        buttonGroups = $(location.hash).find(".form-group>.btn-group");
        buttonGroups.each(function () {
          self = this;
          $(app.textDict[history.state.form_id]["%" + this.parentNode.id]).each(function (i, v) {
            button = $("<div>")
              .addClass("btn-group")
              .append(
              $("<button>")
                .text(v)
                .attr("type", "button")
                .attr("value", v)
                .attr("id", $(self).attr("name") + "-" + v)
                .addClass("btn")
                .addClass("btn-success")
                .addClass("btn-radio")
              );

            $(self).append(button);
            manifest.ui["#" + button.find(".btn-radio").attr("id")] = { bind: "%" + self.parentNode.id + "." + i };
          });
        });

        // Enable scaling text areas
        $('textarea').autogrow({ vertical: true, horizontal: false });

        // Enable profile switch
        $('#toggleProfile')
          .bootstrapToggle({
            // TODO: Bilingual
            on: "Yes",
            off: "No"
          })
          .change(function (ev) {
            console.warn("toggling");
            console.dir(ev);
            console.dir(this);

            if (this.checked && !$.isEmptyObject(app.profile)) {
              // if yes and if profile exists load profile
              console.info("loading profile");

              $("#profile").find("[data-profile]").each(function () {
                try {
                  app.formData.template[history.state.form_id][$(this).attr("name")] = $("#profile").find("[data-profile='" + $(this).data("profile") + "']").val();

                  this.tagName === "SELECT" ?
                    $("#" + history.state.form_id).find("[data-profile='" + $(this).data("profile") + "']").val($("#profile").find("[data-profile='" + $(this).data("profile") + "']").val()).select2() :
                    $("#" + history.state.form_id).find("[data-profile='" + $(this).data("profile") + "']").val($("#profile").find("[data-profile='" + $(this).data("profile") + "']").val());
                }
                catch (e) {
                  console.dir(e);
                  console.error("Error applying profile");
                }
              });


              $("#" + history.state.form_id).my("data", app.formData.template[history.state.form_id]);

              return;
            }
            //empty profile section.
            console.info("emptying profile");
            try {
              app.formData.template[history.state.form_id][$(this).attr("name")] = "";

              this.tagName === "SELECT" ?
                $("#" + history.state.form_id).find("[data-profile='" + $(this).data("profile") + "']").val("").select2() :
                $("#" + history.state.form_id).find("[data-profile='" + $(this).data("profile") + "']").val("");

              app.saveFormDraft();
            }
            catch (e) {
              console.dir(e);
              console.error("Error erasing profile");
            }

            $("#" + history.state.form_id).find("data-profile").empty();
          });

        // add listeners to 'radio' button groups
        $(".btn-radio").on("click", function () {
          app.formData.template[history.state.form_id][$(this.parentNode.parentNode).attr("name")] = this.value;
          $(this).addClass("active");
          $(this).parent().siblings().each(function () { $(this).find(".btn-radio").removeClass("active"); });
          app.saveFormDraft();
        });

        //show help section
        //$("#btnHelp").on("click", function () { $('#help-section').modal("show"); });

        //bind text
        $(location.hash).my(manifest, app.textDict[history.state.form_id]);

        //reset manifest
        manifest = { /*data: app.formData.template[history.state.form_id],*/ ui: {} };

        // Bind form inputs

        inputs = $("#" + history.state.form_id)
          .find(".form-group>input, .form-group>select, .form-control>textarea, .form-group>.input-group>input");

        inputs.each(function () {

          $(this).val(app.formData.template[history.state.form_id][this.parentNode.id]);
          //manifest.data[this.parentNode.id] = app.formData.template[history.state.form_id][this.parentNode.id];

          manifest.ui["#" + (this.id || (this.parentNode.id ? this.parentNode.id + ">.form-control" : this.name + ">.input-group>input"))] = {
            bind: function (data, value, $control) {
              //console.warn("Binding form data: ");
              //console.dir(data);
              //console.dir(value);
              //console.dir($control);

              value = value || "";
              app.formData.template[history.state.form_id][$control.parent().attr("id") || $control.attr("name")] = value;

              if ($control.data("role") === "country") {
                // Update subdivision list
                value = value || "CA";
                $control.parent().next().find("select").html("<option value='' disabled>------</option>");
                for (var code in app.subdivisions[value].divisions) {
                  $control.parent().next().find("select").append("<option value=" + code + ">" + app.subdivisions[value].divisions[code] + "</option>");
                }
                $control.parent().next().find("select").select2({
                  data: function () {
                    opts = [];
                    for (key in app.subdivisions[value].divisions) {
                      opts.push({ id: key, text: app.subdivisions[value].divisions[key] });
                    }
                    console.warn("Updated subdivision items: ");
                    console.dir(opts);
                    return opts;
                  }
                });
              }

              // Save history when user is done typing
              clearTimeout(app.formDebounce);
              app.formDebounce = setTimeout(app.saveFormDraft, 500);
            },
            //Form field validation
            check: function (data, value, $control) {
              console.warn("Checking - " + $control + " with value: " + value);
              if (app.formData.validation[history.state.form_id]) {
                //console.log("Input has test");
                var testString = app.formData.validation[history.state.form_id][$control.parent().attr("id")];
                if (testString === "@postal") testString = app.postalRegex[$("select[data-role='country']>option:selected").val()];
                var checkTest = new RegExp(testString, "i");

                try { if (!checkTest.test(value)) return "Invalid " + $control.prev("label").text() + "..."; }
                catch (e) { console.dir(e); }
              }
            }
          };
        });

        //bind
        try {
          $("#" + history.state.form_id).my(manifest, app.formData.template[history.state.form_id]);
        }
        catch (e) {
        }

        try {
          if ($("#help-section").my()) $("#help-section").my("data", app.textDict[history.state.form_id]["btnHelp"]);
        }
        catch (e) {
        }
        

        // Initialize form sub-navigation
        var
          pages = $("#" + history.state.form_id + ">.form-page");
        //console.warn(pages);
        app.pagination = new Paginator(pages);
        app.pagination.update();
        app.navHeader = new BallHeader(function (index) {
          // Pagination validation
          if (history.state.form_id === "7011") {
            if (app.pagination.currentPage === 1 && !app.formData.template["7011"]["2"]) return false;
          }

          app.pagination.goTo(index);
          return true;
        });
        app.navHeader.initHeader(app.textDict[history.state.form_id].Headers);
        app.navHeader.setCurrent(app.pagination.currentPage);

        $("#main-title").html("<h4>" + app.textDict[history.state.form_id].Name + "</h4>");

        // Bind events to buttons
        $(".btn-nav-prev, .btn-nav-next").each(function (v, i) {
          $(this).on("click", function () {
            this.classList.contains("btn-nav-prev") ?
              app.pagination.goPrev() :
              app.pagination.goNext();
            app.navHeader.setCurrent(app.pagination.currentPage);
            $("#form-" + history.state.form_id + " .pageHeading").html("<h1>" + app.textDict[history.state.form_id].Headers[app.pagination.currentPage - 1] + "</h1>");
          });
        });

        //Filter out appropriate pages for 7011.

        if (history.state.form_id === "7011") $(".btn-incident").on("click", (function (p) {
          return function () {
            var filter =
              this.id === "btnAnimal" ? /page\-form\-\d[bc]/i :
                this.id === "btnEnvironment" ? /page\-form\-\d[ac]/i :
                  this.id === "btnHuman" ? /page\-form\-\d[ab]/i :
                    null;
            if (!filter) return;

            app.formData.template[history.state.form_id]["2"] = app.textDict["7011"]["@2"][this.value];
            app.pagination.filterPages(p, filter);
            app.pagination.goNext();
            app.navHeader.setCurrent(app.pagination.currentPage);
          };
        })(pages));

        //bind submit buttons
        $("#btnSubmitForm").on("click", app.formSubmit);

        //Go to next available input else hide keyboard when enter pressed on input
        $("#" + history.state.form_id + " input").each(function () {
          $(this).on("keypress", function (ev) {
            try {
              if (ev.which == 13) {
                var nextInput = $(this).parent().next().find('input, select');
                if (nextInput.length === 0) Keyboard.hide();
                else nextInput.focus();
              }
            }
            catch (e) { console.dir(e); }
          });
        });

        $("#btnHelp").on("click", function () {
          //show help modal - TODO non-spinner modal
          //met.spinner.show(true, app.textDict[history.state.form_id].btnHelp.content, "close");
          $("#privacy-modal").modal('show');
        });

        setTimeout(met.spinner.hide, 1500);
      });
    },

    // Populate picklists
    buildPicklists: function (pickLists, manifest, selector, opts, key, i) {
      console.info("Generating picklists - ");
      console.dir(pickLists);
      var
        country = "CA",
        prevSelector = null;

      pickLists.each(function () {
        this.innerHTML = "<option value='' disabled>------</option>";
        selector = "#" + this.parentNode.id + ">select";

        opts = app.textDict[history.state.form_id]["@" + (this.name || this.parentNode.id)];

        if (Array.isArray(opts)) {
          //if related picklist
          for (i = 1; i <= opts.length; i++) {
            $(selector).append("<option value='" + opts[i - 1] + "'>" + opts[i - 1] + "</option>");
            manifest.ui[selector + ">option:nth-child(" + (i + 1) + ")"] = {
              bind: "@" + this.name + "." + (i - 1)
            };
          }
          $(selector).select2({ data: opts });
        }
        //Bind country list
        else if (opts.indexOf("country") >= 0) {
          manifest.ui[selector] = {
            bind: function (data, val, $control) {
              $control.select2({
                data: app.countries.map(function (c) {
                  return { id: c.code, text: c.name };
                }),
              });
            }
          };
        }
        else if (opts.indexOf("subdivision") >= 0) {
          manifest.ui[selector] = {
            bind: function (data, val, $control) {
              console.warn("Binding subdivisions...");

              $control.html("<option value='' disabled>------</option>");
              country = app.formData.template[history.state.form_id][this.name] || "CA";
              for (var code in app.subdivisions[country].divisions) {
                $control.append("<option value=" + code + ">" + app.subdivisions[country].divisions[code] + "</option>");
              }
              $control.select2({
                data: function () {
                  opts = [];
                  for (key in app.subdivisions[country].divisions) {
                    opts.push({ id: key, text: app.subdivisions[country].divisions[key] });
                  }
                  console.warn("Subdivision items: ");
                  console.dir(opts);
                  return opts;
                }
              });
            }
          };
        }
      });
      return manifest;
    },

    //Secure Storage Object -- see https://github.com/Crypho/cordova-plugin-secure-storage#plugin-api
    storage: {
      //SecureStorage plugin object
      secure: null,

      //Save secure data as key value pair
      saveData: function (key, val) {
        return new Promise(function (resolve, reject) {
          if (!app.storage.secure) { //If no securestorage then save to localstorage
            try {
              met.storage.save(key, val);
              resolve(key);
            } catch (e) { reject(e); }
          }
          else {
            console.warn("SAVING");
            console.dir(JSON.parse(val));
            app.storage.secure.set(
              function (k) {
                console.log("Saved " + k);
                resolve(k);
              },
              function (error) {
                console.warn('SECURE STORAGE ERROR!');
                console.dir(error);
                reject(error);
              }, key, val);
          }
        });
      },

      //Load secure data by key
      loadData: function (key) {
        return new Promise(function (resolve, reject) {
          if (!app.storage.secure) {
            try { resolve(met.storage.load(key)); }
            catch (e) { reject(e); }
          }
          else {
            app.storage.secure.get(
              function (v) {
                console.warn("Loaded " + key);
                console.dir(v);
                resolve(v);
              },
              function (error) {
                console.warn('SECURE STORAGE ERROR!');
                console.dir(error);
                reject(error);
              }, key);
          }
        });
      },

      //Delete secure data by key
      deleteData: function (key) {
        return new Promise(function (resolve, reject) {
          if (!app.storage.secure) {
            try {
              met.storage.delete(key);
              resolve(key);
            } catch (e) { reject(e); }
          }
          else {
            app.storage.secure.remove(
              function (k) {
                console.warn("Deleted " + k);
                resolve(k);
              },
              function (error) {
                console.warn('SECURE STORAGE ERROR!');
                console.dir(error);
                reject(error);
              }, key);
          }
        });
      },

      //Clear secure storage
      deleteAll: function () {
        return new Promise(function (resolve, reject) {
          if (!app.storage.secure) {
            try {
              met.storage.clear();
              resolve(true);
            } catch (e) { reject(e); }
          }
          else {
            app.storage.secure.clear(
              function () { resolve(true); },
              function (error) {
                console.warn('SECURE STORAGE ERROR!');
                console.dir(error);
                reject(err);
              }
            );
          }
        });
      },

      //Get list of all storage keys to check if key exists
      exists: function (key) {
        return new Promise((function (k) {
          return function (resolve, reject) {
            try {
              app.storage.secure.keys(
                function (keys) { resolve(keys.filter(function (val) { return val === k; }).length > 0); },
                function (error) {
                  console.warn('SECURE STORAGE ERROR!');
                  console.dir(error);

                  //attempt localstorage
                  var keys = [];
                  for (i = 0; i < localStorage.length; i++) { keys.unshift(localStorage.key(i)); }
                  if (keys.length > 0) {
                    keys = keys.filter(function (val) { return val === k; }).length > 0;
                  }
                  else keys = false;
                  resolve(keys);
                }
              );
            }
            catch (e) {
              resolve(false);
              console.dir(e);
            }
          };
        })(key));
      },

      //Initialize storage
      init: function () {
        return new Promise(function (resolve, reject) {
          try {
            app.storage.secure = new cordova.plugins.SecureStorage(
              function () {
                console.log("Secure storage available.");
                resolve(app.storage.secure);
                app.storage.secure._migrate_to_native_storage(function () { console.log("native storage!"); });

              },
              function (error) {
                met.spinner.show(true, 'Secure storage unavailable, please enable the screen lock on your device if you with to enable this feature.', 'OK');
                app.storage.secure = null;
                reject(error);
              }, APP_NAME.replace(/\s/gi, "-"));
          } catch (e) { reject(e); }
        });
      }

    },

    //animateSVG: function (elements) {
    //  var delay = 1000;

    //  elements.forEach(function (element, index) {
    //    var length = element.getTotalLength();

    //    // Set up the starting positions
    //    element.style.strokeDasharray = length + ' ' + length;
    //    element.style.strokeDashoffset = length;
    //    // Trigger a layout so styles are calculated & the browser
    //    // picks up the starting position before animating
    //    element.getBoundingClientRect();

    //    setTimeout(function () {
    //      element.style.strokeDashoffset = '0';
    //      element.classList.add('fillIt');
    //    }, delay * index);
    //  });



    //  var logoLines = Array.prototype.slice.call(document.getElementsByClassName('logo'), 0);

    //  //		  animate( logoLines );


    //},

    saveProfile: function () {
      app.storage.saveData("userProfile", JSON.stringify(app.profile))
        .then(function (key) {
          console.info("Profile saved!");
          app.goTo("#main-page");
        })
        .catch(function (err) {
          console.error("Problem saving profile!");
          console.dir(err);
          app.goTo("#main-page");
        });
    },

    //
    saveFormDraft: function () {
      app.storage.saveData("form-" + history.state.form_id, JSON.stringify(app.formData.template[history.state.form_id]))
        .then(function (key) {
          console.info("Form Saved! - " + key);
        })
        .catch(function (err) {
          console.error("Problem saving form!");
          console.dir(err);
        });
    },

    //Retrieve JSON file from path
    getData: function (path) {
      return new Promise(function (resolve, reject) {
        try {
          path = window.location.href.replace(/\/.*\.html.*/gi, '') + "assets/data/" + path;
          console.log("Getting JSON from: " + path);
          $.getJSON(path, function (data) { resolve(data); });
        } catch (e) { reject(e); }
      });
    },

    //Load language specific text
    loadText: function (language) {
      language = language || met.storage.load("pep_lang") || "english";
      met.storage.save("pep_lang", language);

      console.info("Loading " + language + "...");

      app.getData("languages/pep_" + language.substring(0, 2) + ".json")
        .then(function (data) {
          //console.warn("NEW LANGUAGE DATA ---");
          //console.dir(data);

          app.textDict = data;

          //update bindings - should be updating on own, think it has to do with assigning object
          if ($("#profile-load").my()) $("#profile-load").my("data", app.textDict["intro-profile"]);
          if ($("#main-page").my()) $("#main-page").my("data", app.textDict["main-page"]);
          if ($("#main-menu").my()) $("#main-menu").my("data", app.textDict["main-menu"]);
          if ($("#about-page").my()) $("#about-page").my("data", app.textDict["about-page"]);
          if ($("#profile-page").my()) $("#profile-page").my("data", app.textDict.profile);


          //		  
          //		  if(app.navHeader != null){
          //			$('#fullHeader').load("assets/HTML-Templates/common.html ", function(){
          ////		    $('#fullHeader').remove();
          ////			$('#pageHeader').remove();
          //			app.navHeader.initHeader(app.textDict[history.state.form_id].Headers);
          //			
          //
          //			app.navHeader.updateHeader();
          //		  });
          //			  $('#pageHeader').load("assets/HTML-Templates/common.html", function(){
          //				app.navHeader.setCurrent(app.pagination.currentPage);
          //			  });
          //
          //		};
          //		  
          try { //fails if not on form page
            if (location.hash.indexOf(history.state.form_id) > 0 && $(location.hash).my()) {
              console.log("reloading : " + location.hash);
              $(location.hash).my("data", app.textDict[history.state.form_id]);

            }
          } catch (e) { console.dir(e); }

          // update list options
          $("select").each(function () { $(this).select2(); });

          //toggle menu language buttons
          $("#btnMenuEn").attr('class', language === "french" ? "" : "hidden");
          $("#btnMenuFr").attr('class', language === "french" ? "hidden" : "");
        },
        function (err) {
          console.error("Problem getting language data.");
          console.dir(err);
        }
        );
    },

    //Bind text to UI components
    initText: function (language) {
      if (["english", "french"].indexOf(language) >= 0) {
        app.loadText(language);
      }
      else { alert("INVALID LANGUAGE"); return; }

      //Bind elements - see http://jquerymy.com/api.html

      if (app.textDict) {
        var
          inputs = [],
          keys = [],
          country = "CA",
          manifest = { ui: {} },
          i = 0;

        $("#profile-load").my({
          ui: {
            "#intro-title": { bind: "title" },
            "#intro-content": { bind: "content" }
          }
        }, app.textDict["intro-profile"]);
        //Bind Main Menu
        $("#main-menu").my({
          ui: {
            "#btnMenuHome": { bind: "btnMenuHome" },
            "#btnMenuProfile": { bind: "btnMenuProfile" },
            "#btnMenuAbout": { bind: "btnMenuAbout" },
            "#btnMenuHistory": { bind: "btnMenuHistory" }
          }
        }, app.textDict["main-menu"]);

        //Bind Main Page
        $("#main-page").my({
          ui: {
            "#tileHeader_1": { bind: "tileHeader_1" },
            "#tileHeader_2": { bind: "tileHeader_2" },
            "#tileHeader_3": { bind: "tileHeader_3" },
            "#tileHeader_4": { bind: "tileHeader_4" },
            "#tileHeader_5": { bind: "tileHeader_5" },
            "#tileHeader_6": { bind: "tileHeader_6" }
          }
        }, app.textDict["main-page"]);

        //Bind about page
        $("#about-page").my({
          ui: {
            "#about-title": { bind: "title" },
            "#about-header": { bind: "header" },
            "#about-content": {
              bind: function (data, val, $control) { $control.html(data.content); }
            }
          }
        }, app.textDict["about-page"]);

        //Bind profile form

        //Populate profile picklists
        $("#profile-2").select2({ data: app.textDict.profile["@2"] });
        $("#profile-9").select2({
          data: app.countries.map(function (c) {
            return { id: c.code, text: c.name };
          }),
        });

        var opts = [];

        $("#profile-10").select2({
          data: function () {
            for (key in app.subdivisions["CA"].divisions) {
              opts.push({ id: key, text: app.subdivisions["CA"].divisions[key] });
            }
            console.warn("Profile subdivision items: ");
            console.dir(opts);
            return opts;
          }
        });

        inputs = $("#profile").find('.form-control');
        inputs.each(function () {
          manifest.ui["#" + this.id] = {
            bind: function (data, value, $control) {
              value = value || "";
              //console.dir(data);
              data[$control.attr("id")] = value;

              if ($control.data("profile") === "country") {
                // Update subdivision list
                value = value || "CA";
                $control.parent().next().find("select").html("<option value='' disabled>------</option>");
                for (var code in app.subdivisions[value].divisions) {
                  $control.parent().next().find("select").append("<option value=" + code + ">" + app.subdivisions[value].divisions[code] + "</option>");
                }
                $control.parent().next().find("select").select2({
                  data: function () {
                    opts = [];
                    for (key in app.subdivisions[value].divisions) {
                      opts.push({ id: key, text: app.subdivisions[value].divisions[key] });
                    }
                    console.warn("Updated subdivision items: ");
                    console.dir(opts);
                    return opts;
                  }
                });
              }

              return;
            }
          };
        });

        $("#profile").find("input").each(function () {
          $(this).on("keypress", function (ev) {
            try {
              if (ev.which == 13) {
                var nextInput = $(this).parent().next().find('input');
                if (nextInput.length === 0) Keyboard.hide();
                else nextInput.focus();
              }
            }
            catch (e) { console.dir(e); }
          });
        });



        //Bind profile
        $("#profile").my(manifest, app.profile);

        manifest = { ui: {} };

        for (i = 0; i < app.textDict.profile["@2"].length; i++) {
          manifest.ui["#profile-2>option:nth-child(" + (i + 1) + ")"] = "@2." + i;
        }

        for (i = 2; i <= 13; i++) {
          manifest.ui["#label-" + i] = i + "";
        }
        manifest.ui["#btnSaveProfile"] = "btnSaveProfile";

        $("#profile-page").my(manifest, app.textDict.profile);
      }
    },

    // Capture picture from device camera
    takePic: function (ev) {
      //TODO: local pictures or camera
      if (ev) ev.preventDefault();
      console.log("Taking photo...");
      return new Promise(function (resolve, reject) {
        try {
          navigator.camera.getPicture(
            function (imageData) { resolve(imageData); },
            function (err) { reject(err); },
            {
              quality: 50,
              destinationType: Camera.DestinationType.DATA_URL,
              sourceType: Camera.PictureSourceType.CAMERA,
              allowEdit: false,
              encodingType: Camera.EncodingType.JPEG,
              mediaType: Camera.MediaType.PICTURE,
              targetWidth: 1280,
              targetHeight: 720,
              cameraDirection: Camera.Direction.FRONT,
              saveToPhotoAlbum: false
            }
          );
        }
        catch (e) { app.onCameraFail(e); }
      });
    },

    // Capture image and add to form data
    attachImage: function () {
      app.takePic()
        .then(function (imgData) {
          navigator.camera.cleanup(function () { }, function (err) { console.dir(err); });

          app.attachNum++;
          $("#imageAttachments").append(
            $("<img>")
              .attr("src", "data:image/jpeg;base64," + imgData)
              .addClass("img-rounded")
              .addClass("img-responsive")
              .addClass("img-attachment")
              .attr("id", "attachNum" + app.attachNum)
          );
          //TODO: swipe to delete image with confirm
          app.formData.template[history.state.form_id].Attachments.push({
            type: "image/jpeg",
            data: imgData
          });

          console.warn("attachNum" + app.attachNum);
          var imageElement = document.getElementById("attachNum" + app.attachNum);
          console.log(imageElement);

          var imageHam = new Hammer(imageElement);

          imageHam.on('swiperight', (function (ev) {
            return function (e) {
              app.swipeToDelete(e.target.id);
            };
          })(ev));


          app.saveFormDraft();
        })
        .catch(function (err) {
          //TODO: better error handler
          console.dir(err);
          console.warn("Problem attaching photo to - " + history.state.form_id);
        });
    },

    swipeToDelete: function (id) {
      var imageSrc = document.getElementById(id).src;
      var vaildSrc = imageSrc.split("base64,")[1];

      app.formData.template[history.state.form_id].Attachments = $(app.formData.template[history.state.form_id].Attachments).filter(function (i) {
        return vaildSrc.indexOf(app.formData.template[history.state.form_id].Attachments[i].data) >= 0;
      });

      console.dir(app.formData.template[history.state.form_id].Attachments);
      $("#" + id).remove();
    },

    // Generate form case number from given form ID
    caseNumber: function () {
      var
        today = new Date(),
        year = today.getFullYear(),
        month = today.getMonth() + 1,
        day = today.getDate(),
        hour = today.getHours(),
        minuite = today.getMinutes(),
        second = today.getSeconds(),
        language = met.storage.load("pep_lang").substring(0, 1).toUpperCase(),
        caseNum =
          year + '-' +
          ('0' + month).slice(-2) + '-' +
          ('0' + day).slice(-2) + '-' +
          ('0' + hour).slice(-2) + '-' +
          ('0' + minuite).slice(-2) + '-' +
          ('0' + second).slice(-2) + '-' +
          '[' + history.state.form_id + ']' + '-' +
          '[' + language + ']' + '-' +
          '[M]';

      console.info("Generated case number: " + caseNum);
      return caseNum;
    },

    //Handle form submission
    formSubmit: function (ev) {
      //TODO: Create approptiate file based on form submission
      if (ev) ev.preventDefault();

      //Check if form passes validation
      //if (!$("#" + history.state.form_id).my("valid")) {
      //  // TODO: Bilingual + better message + custom modal
      //  alert("Invalid fields.");
      //  return;
      //}

      var
        userDidAccept = true,
        date = new Date();

      // Check if all conditions have been agreed to prior to submission
      $('#' + history.state.form_id + ' input.form-control[type=checkbox]').each(function () {
        if (!this.checked && this.id !== "#toggleProfile") {
          //TODO: bilingual alert
          alert("You must agree to all terms and conditions.");
          userDidAccept = false;
          return false;
        }
      });
      if (!userDidAccept) return;

      console.warn("Submitting form data for - " + history.state.form_id);

      // Insert case number and language into data
      app.formData.template[history.state.form_id]._case_id = app.caseNumber();
      app.formData.template[history.state.form_id].Language = met.storage.load("pep_lang").substring(0, 1).toUpperCase();

      //Save submission attempt
      app.saveSubmissions(app.formData.template[history.state.form_id]._case_id, date.toLocaleDateString());

      // Attempt to create file
      try {
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dir) {
          //dir.getFile(history.state.form_id + ".json", { create: true }, app.writeFile);
          dir.getFile("test.json", { create: true }, app.writeFile);

          // Test read file
          setTimeout((function (dir) {
            return function () {
              //dir.getFile(history.state.form_id + ".json", { create: false }, app.readFile);
              dir.getFile("test.json", { create: false }, app.readFile);
            };
          })(dir), 1500);
        });
      }
      catch (e) {
        met.spinner.start(true, "Problem uploading form...");
        console.dir(e);
      }
    },

    //Write JSON file from form data
    writeFile: function (file) {
      file.createWriter(function (writer) {
        //Upload file once it has been written
        writer.onwrite = function () { app.sendFile(file).then(function (r) { console.dir(r); }); };

        console.warn("Writing form data: ");
        console.dir(app.formData.template[history.state.form_id]);

        //TODO: XML
        writer.write(new Blob([JSON.stringify(app.formData.template[history.state.form_id])], { type: 'application/json' }));
        console.warn("File written: ");
        console.dir(file);

        //TODO: Handle error - sorry page?
      }, function (err) { console.dir(err); });
    },

    //Read created JSON file for testing purposes.
    readFile: function (file) {
      file.file(function (f) {
        var reader = new FileReader();
        var data = {};

        //Declare end of file read callback then read file.
        reader.onloadend = function (e) {
          data = JSON.parse(this.result);
          console.warn("Data");
          console.dir(data);
        };
        reader.readAsText(f);
      });
    },

    //Upload JSON file to server
    sendFile: function (file) {
      return new Promise(function (resolve, reject) {

        //TODO: Take user through submission flow - canadiana, success+case#/fail, and thanks pages
        //TODO: JSON OR XML
        //		  $("#Loading").show();
        //		  $('#btnSubmitForm').click(app.animateSVG(Array.prototype.slice.call( 			document.getElementsByClassName( 'logo' ), 0)));
        //		  
        met.spinner.show(false, "Uploading data... ");

        //Set transfer options
        var opts = new FileUploadOptions();
        opts.fileKey = "test";
        opts.fileName = file.name;
        opts.httpMethod = "POST";
        opts.mimeType = 'application/json'; //'application/xml';
        opts.params = {};

        //Attempt file transfer
        var transfer = new FileTransfer();
        transfer.upload(
          file.nativeURL,
          encodeURI(app.server),
          function (response) {
            //TODO: THANKYOU SCREEN -> MAIN PAGE

            //delete draft
            app.storage.deleteData("form-" + history.state.form_id);

            setTimeout(function () {
              met.spinner.hide();
              app.formSuccess();
            }, 2000);
            console.info("Upload success!");
            resolve(response);
          },
          function (err) {
            //TODO: ERROR SCREEN -> MAIN PAGE
            setTimeout(function () {
              met.spinner.hide();
              app.formfail();
            }, 2000);
            alert("File transfer error: ");
            console.warn("File transfer error: ");
            reject(err);
          },
          opts
        );
      });
    },

    // Show thankyou page after successful upload
    formSuccess: function () {
      app.goTo("#submit-success-page");
      //console.log(app.submissionHistory[0].caseNumber);
      $('#caseNum').html(app.submissionHistory[0].caseNumber);
      setTimeout(function () {
        app.goTo("#main-page");
      }, 5000);
    },

    // Show error page after unsuccessful upload
    formfail: function () {
      app.goTo("#submit-fail-page");

      setTimeout(function () {
        app.goTo("#main-page");
      }, 3000);
    },

    //Save submission history
    saveSubmissions: function (caseNumber, date) {
      app.submissionHistory.push({
        "title": app.textDict[history.state.form_id].Name,
        "date": date,
        "caseNumber": caseNumber
      });

      app.storage.saveData("sub-history", JSON.stringify(app.submissionHistory))
        .then(function (key) {
          console.log("saved submission history -- " + key);
          app.loadSubmissions();
        })
        .catch(function (err) {
          console.dir(err);
          console.error("Failed to save submission history.");
        });
    },

    //check for and load submission history
    loadSubmissions: function () {
      app.storage.exists("sub-history")
        .then(function (exists) {
          if (exists) return app.storage.loadData("sub-history");
          else $('#existsAlert').text("There Are No Submissions To Display");
        })
        .catch(function (err) {
          console.error("Error checking if submission history exists");
          console.dir(err);
        })
        .then(function (data) {
          console.info("found sub-history");
          app.submissionHistory = JSON.parse(data);

          console.warn("Submission history");
          console.dir(app.submissionHistory);

          if (app.submissionHistory.length < 1) {
            //no submissions
            $('#existsAlert').text("There Are No Submissions To Display");
            return;
          }

          $('#existsAlert').text("Previous Submissions");

          //create list of history items
          var
            subList = $('ul.subList'),
            subListItem = null,
            subHeader = null,
            subDateContainer = null,
            subCaseContainer = null;

          subList.empty();
          app.submissionHistory.each(function (v, i) {
            subListItem = $('<li/>').addClass('list-group-item');
            subHeader = $('<h4></h4>').text(v.title);
            subDateContainer = $('<div></div>').addClass('submissionName').text(v.date);
            subCaseContainer = $('<div></div>').addClass('submissionNum').text(v.caseNumber);

            subListItem.appendTo(subList);
            subHeader.appendTo(subListItem);
            subDateContainer.appendTo(subListItem);
            subCaseContainer.appendTo(subListItem);
          });
        })
        .catch(function (err) {
          var
            subList = $('ul.subList'),
            subListItem = $('<li/>').addClass('list-group-item'),
            subDateContainer = $('<div></div>').addClass('submissionName').text("Error loading submission history"),
            subCaseContainer = $('<div></div>').addClass('submissionNum').text(err);

          subList.empty();

          subListItem.appendTo(subList);
          subDateContainer.appendTo(subListItem);
          subCaseContainer.appendTo(subListItem);

          console.error("Problem loading sub-history!");
          console.dir(err);
        });
    }
  };

  //Invoke application
  app.initialize();

})();
