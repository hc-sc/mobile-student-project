document.addEventListener("deviceReady", function () {

	var testData = "This is a test of data passthrough.";
	var counter = 1;

	$("#delayed-notification-success").hide();
	$("#scheduled-notification-success").hide();

	$("#basic-notification").click(function () {
		// Notification to go off right away
		cordova.plugins.notification.local.schedule({
			id: counter,
			text: "Test Notification",
		});

		counter++;
	});

	$("#delayed-notification").click(function () {
		var now = new Date().getTime();
		var scheduledDate = new Date(now + (10 * 1000)); // 10 seconds later

		// Notification set for 10 seconds from init with title
		cordova.plugins.notification.local.schedule({
			id: counter,
			text: "Delayed Notification",
			at: scheduledDate,
			data: testData
		});

		$("#delayed-notification-success").show().delay(1500).fadeOut();
		counter++;
	});

	$("#scheduled-form").submit(function (e) {
		e.preventDefault();

		var title = $("#scheduled-title");
		var titleVal = title.val().trim();

		var text = $("#scheduled-text");
		var textVal = text.val().trim();
		if (textVal === "") {
			text.parent('fieldset').addClass('has-error');
			text.focus();
		} else {
			text.parent('fieldset').removeClass('has-error');
		}

		var time = $("#scheduled-time");
		var timeVal = time.val().trim();
		if (timeVal === "") {
			time.parent('fieldset').addClass('has-error');
			if (textVal !== "") { time.focus(); }
		} else {
			time.parent('fieldset').removeClass('has-error');
		}

		var data = $("#scheduled-data");
		var dataVal = data.val().trim();
		if (dataVal !== "") {
			testData = dataVal;
		}

		if (textVal !== "" && timeVal !== "") {
			var now = new Date().getTime();
			var scheduled = new Date(now + (parseInt(timeVal) * 1000));

			// Notification set for XX seconds from init with data
			cordova.plugins.notification.local.schedule({
				id: counter,
				title: titleVal,
				text: textVal,
				at: scheduled,
				data: testData
			});

			$("#scheduled-notification-success").show().delay(1500).fadeOut();
			counter++;
		}
	});


	// "schedule" event
	cordova.plugins.notification.local.on("schedule", function (notification, state) {
		// alert(notification.title + " was scheduled from " + state);
	}, this);

	// "trigger" event
	cordova.plugins.notification.local.on("trigger", function (notification, state) {
		// alert(notification.title + " was triggered from " + state);
	}, this);

	// "click" event
	cordova.plugins.notification.local.on("click", function (notification, state) {
		var data = notification.data;
		if (data) { alert(data); }

		// alert(notification.title + " was clicked from " + state);
	}, this);

}, false);