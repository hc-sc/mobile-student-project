//Variables
analytics = "";

//Constants
var GA_ACCOUNT_ID = "@@pkg.ga.id"; //Google Analytics Account ID
var GA_PAGE_ID = "@@pkg.ga.page";

document.addEventListener("deviceready", onDeviceReady, false); //Phone Gap ready listener

function gaReady() {
	analytics = navigator.analytics;
	analytics.set('aip', '1'); //Anonymize IPs
	analytics.setDispatchInterval(10);
	analytics.setTrackingId(GA_ACCOUNT_ID);
	met.analytics.trackPage(GA_PAGE_ID); //Google Analytics track page
}

met.analytics = {
	trackPage: function (pageId) {
		var pageName;
		if (deviceReady) {
			pageName = window.location.pathname;
			if ((typeof pageId !== "undefined")) {
				if (pageId !== "")
					pageName = pageId;
			}
			gaPlugin.sendAppView(pageName, successHandler, errorHandler);
		} else {
			errorHandler("Device not ready.");
		}
	},
	trackEvent: function (category, eventAction, eventLabel, eventValue) {
		if (deviceReady) {
			gaPlugin.sendEvent(category, eventAction, eventLabel, eventValue, successHandler, errorHandler);
		} else {
			errorHandler("Device not ready.");
		}
	}
};