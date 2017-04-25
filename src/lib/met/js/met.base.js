/*
Mobile Experience Template
@@pkg.version
*/

//Global Variables
var met;
var deviceReady = false;

//Constants
var APP_ID = "@@pkg.id";
var APP_NAME = "@@pkg.title";
var APP_VERSION = "@@pkg.version";

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
	deviceReady = true;
	met.language.set();
}

//Success Handler
function successHandler(s) {
	//console.log(s.toString); // Optional
}

//Error Handler
function errorHandler(e) {
	if (deviceReady) {
		alert(e.toString());
	} else {
		console.log(e.toString());
	}
}

met = {
	//Platform Detection
	isAndroid: function () {
		if (met.isWeb()) {
			return false;
		}
		if (met.isBlackberry()) return null;
		return navigator.userAgent.match(/Android/);
	},

	isAndroidWeb: function () {
		return navigator.userAgent.match(/Android/) && met.isWeb();
	},

	isApple: function () {
		if (met.isWeb()) {
			return false;
		}
		return navigator.userAgent.match(/(iPhone|iPod|iPad)/);
	},

	isAppleWeb: function () {
		return navigator.userAgent.match(/(iPhone|iPod|iPad)/) && met.isWeb();
	},

	isBlackberry: function () {
		if (met.isWeb()) {
			return false;
		}
		return navigator.userAgent.match(/(BlackBerry|BB10|Q10)/);
	},

	isBlackberryWeb: function () {
		return navigator.userAgent.match(/(BlackBerry|BB10|Q10)/) && met.isWeb();
	},

	isWindows: function () {
		if (met.isWeb()) {
			return false;
		}
		return navigator.userAgent.match(/(MSIE|Windows|WPDesktop)/);
	},

	isWindowsWeb: function () {
		return navigator.userAgent.match(/(MSIE|Windows|WPDesktop)/) && met.isWeb();
	},

	isWeb: function () {
		return (window.location.href.indexOf("http") === 0);
	},

	// Language
	language: {
		exists: function () {
			return met.storage.exists("language");
		},

		get: function () {
			var language = false;
			if (met.storage.exists("language")) {
				language = met.storage.load("language");
			}
			return language;
		},

		set: function () {
			var language = $("html").attr("lang");
			if (typeof language !== "undefined") {
				met.storage.save("language", language);
			} else {
				if (met.storage.exists("language")) {
					language = met.storage.load("language");
				} else {
					if (met.language.system()) {
						met.storage.save("language", met.language.system());
					} else {
						return false;
					}
				}
			}
			return true;
		},

		system: function () {
      try {
        var index = navigator.languages.indexOf('en');
        if (index) {
          return navigator.languages[index];
        } else {
          index = navigator.languages.indexOf('fr');
          if (index) {
            return navigator.languages[index];
          }
        }
      }
      catch (e) { console.dir(e); }
			return false;
		}
	},

	//Local Storage
	storage: {
		load: function (key) {
			return localStorage[key];
		},

		exists: function (key) {
			if (typeof localStorage[key] !== 'undefined') {
				return true;
			}
			return false;
		},

		clear: function () {
			return localStorage.clear();
		},

		size: function () {
			return localStorage.length;
		},

		save: function (key, value) {
			localStorage[key] = value;
		},

		delete: function (key) {
			localStorage.removeItem(key);
		}
	},

	//Session Storage
	session: {
		load: function (key) {
			return sessionStorage[key];
		},

		exists: function (key) {
			if (typeof sessionStorage[key] !== 'undefined') {
				return true;
			}
			return false;
		},

		clear: function () {
			return sessionStorage.clear();
		},

		size: function () {
			return sessionStorage.length;
		},

		save: function (key, value) {
			sessionStorage[key] = value;
		},

		delete: function (key) {
			sessionStorage.removeItem(key);
		}
	},

	//Spinner
	spinner: {
		show: function (cancel, spinnerMsg, cancelMsg, ajaxObject, imageLocation, imageFallback) {
			cancel = cancel || false;
			spinnerMsg = spinnerMsg || "";
			ajaxObject = ajaxObject || false;
			cancelMsg = cancelMsg || '<span class="glyphicon glyphicon-remove"></span>';

			var spinnerHTML;
			var imageAltText = (met.language.get() === 'fr' ? "indicateur de chargement" : "loading indicator");

			if (cancel) {
				spinnerHTML = '<div id="spinner-modal" class="modal fade" tabindex="-1" role="dialog"> ' +
					'<div class="modal-dialog"><div class="modal-content"><div class="modal-body modal-spinner"><div class="row"> ' +
					'<div class="col-md-10 col-xs-12 spinnerBtn-cont"><div class="row"> ' +
					'</div><div class="row">' +
					'<p class="spinner-text text-center">' + spinnerMsg + '</p>' +
					'<div class="spinner-button col-md-2 col-xs-12">' +
					'<button type="button" class="btn btn-danger center-block" data-dismiss="modal">' + cancelMsg + '</button>' +
					'</div></div></div></div></div></div></div></div>';

				$("body").append(spinnerHTML);

				var spinnerCancel = new Event("spinnercancel");

				$(".spinner-button > button").click(function () {
					document.dispatchEvent(spinnerCancel);
					if (ajaxObject) {
						ajaxObject.abort();
					}

					met.spinner.hide();
				});

			} else {
				spinnerHTML = '<div id="spinner-modal" class="modal fade" tabindex="-1" role="dialog"> ' +
					'<div class="modal-dialog"><div class="modal-content"><div class="modal-body modal-spinner"><div class="row"> ' +
					'<div class="col-md-12"><div class="row"> ' +
					'</div><div class="row">' +
					'<p class="spinner-text text-center">' + spinnerMsg + '</p>' +
					'</div></div></div></div></div></div></div>';

				$("body").append(spinnerHTML);
			}

			$("#spinner-modal").modal({
				backdrop: 'static',
				keyboard: false,
				show: true
			});
		},

		hide: function () {
			$("#spinner-modal").on("hidden.bs.modal", function () {
				$("#spinner-modal").remove();
			});

			$("#spinner-modal").modal("hide");
		}
	}
};