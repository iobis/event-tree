var parse = function(csv) {
	var lines = csv.trim().split("\n");
	var result = [];
	var headers = lines[0].split("\t");
	for (var i = 1; i < lines.length; i++) {
		var obj = {};
		var line = lines[i].split("\t");
		for (var j = 0; j < line.length; j++) {
			obj[headers[j]] = line[j].trim();
		}
		result.push(obj);
	}
	return result;
}

var append = function(tree, node, occurrence) {
	if (occurrence) {
		if (tree.id == node.id) {
			if (!tree.nodes) {
				tree.nodes = [];
			}
			tree.nodes.push(createnode(node, occurrence));
			return true;
		} else if (tree.nodes) {
			for (n in tree.nodes) {
				if (append(tree.nodes[n], node, occurrence)) {
					return true;
				}
			}
		}
		return false;
	} else {
		if (tree.id == node.parentEventID) {
			if (!tree.nodes) {
				tree.nodes = [];
			}
			tree.nodes.push(createnode(node, occurrence));
			return true;
		} else if (tree.nodes) {
			for (n in tree.nodes) {
				if (append(tree.nodes[n], node, occurrence)) {
					return true;
				}
			}
		}
		return false;
	}
};

var createnode = function(data, occurrence) {
	if (occurrence) {
		var text = data.occurrenceID;
		if (data.scientificName && data.scientificName != "") {
			text = text + " <span class=\"label label-warning\">" + data.scientificName + "</span>";
		}
		if (data.eventDate && data.eventDate != "") {
			text = text + " <span class=\"label label-field\">eventDate: " + data.eventDate + "</span>";
		}
		if (data.decimalLongitude && data.decimalLongitude != "") {
			text = text + " <span class=\"label label-field\">decimalLongitude: " + data.decimalLongitude + "</span>";
		}
		if (data.decimalLatitude && data.decimalLatitude != "") {
			text = text + " <span class=\"label label-field\">decimalLatitude: " + data.decimalLatitude + "</span>";
		}
		if (data.minimumDepthInMeters && data.minimumDepthInMeters != "") {
			text = text + " <span class=\"label label-field\">minimumDepthInMeters: " + data.minimumDepthInMeters + "</span>";
		}
		if (data.maximumDepthInMeters && data.maximumDepthInMeters != "") {
			text = text + " <span class=\"label label-field\">maximumDepthInMeters: " + data.maximumDepthInMeters + "</span>";
		}
		var node = {
			text: text,
			id: data.occurrenceID
		};
		return node;
	} else {
		var text = data.eventID;
		if (data.generated) {
			text = text + " <span class=\"label label-danger\">Generated</span>";
		}
		if (data.eventDate && data.eventDate != "") {
			text = text + " <span class=\"label label-field\">eventDate: " + data.eventDate + "</span>";
		}
		if (data.decimalLongitude && data.decimalLongitude != "") {
			text = text + " <span class=\"label label-field\">decimalLongitude: " + data.decimalLongitude + "</span>";
		}
		if (data.decimalLatitude && data.decimalLatitude != "") {
			text = text + " <span class=\"label label-field\">decimalLatitude: " + data.decimalLatitude + "</span>";
		}
		if (data.minimumDepthInMeters && data.minimumDepthInMeters != "") {
			text = text + " <span class=\"label label-field\">minimumDepthInMeters: " + data.minimumDepthInMeters + "</span>";
		}
		if (data.maximumDepthInMeters && data.maximumDepthInMeters != "") {
			text = text + " <span class=\"label label-field\">maximumDepthInMeters: " + data.maximumDepthInMeters + "</span>";
		}
		var node = {
			text: text,
			id: data.eventID
		};
		return node;
	}
};

var tree = [];
var errors = [];

var process = function() {
	$("#working").show();
	$("#messages").html("");
	$("#report").hide();
	$("#wrapper").hide();
	setTimeout(function() {
		tree = [];
		errors = [];
		process_event();
		process_occurrence();
		draw();
	});
};

var process_event = function() {

	// parse input

	var input = $("#event").val();
	var data = parse(input);

	// orphans and id cleanup

	var ids = {};
	var parentids = {};

	for (i in data) {
		if (data[i].eventID && data[i].eventID == "") {
			delete data[i].eventID;
		}
		if (data[i].parentEventID && data[i].parentEventID == "") {
			delete data[i].parentEventID;
		}
		if (data[i].eventID) {
			ids[data[i].eventID] = true;
		}
		if (data[i].parentEventID) {
			parentids[data[i].parentEventID] = true;
		}
	}

	for (i in parentids) {
		if (!ids[i]) {

			errors.push("Parent event " + i + " does not exist, will be generated");

			data.push({
				eventID: i,
				generated: true
			});
		}
	}

	// process lines

	data.reverse();

	while (data.length > 0) {

		console.log("next run: " + data.length);

		for (var i = data.length - 1; i >= 0; i--) {

			if (!data[i].parentEventID) {

				// no parentEventID present

				tree.push(createnode(data[i]));
				data.splice(i, 1);

			} else {

				// parentEventID present

				for (t in tree) {
					if (append(tree[t], data[i])) {

						// parent found

						data.splice(i, 1);
						break;

					}
				}

			}

		}

	}
};

var process_occurrence = function() {

	// parse input

	var input = $("#occurrence").val();
	var data = parse(input);

	// process lines

	for (var i = 0; i < data.length; i++) {
		var found = false;
		for (t in tree) {
			if (append(tree[t], data[i], true)) {
				found = true;
				break;
			}
		}
		if (!found) {
			errors.push("No event " + data[i].id + " found for occurrence " + data[i].occurrenceID);
		}
	}

};

var draw = function() {

	$("#wrapper").show();

	$("#tree").treeview({
		data: tree,
		levels: 100,
		showBorder: false
	});

	if (errors.length > 0) {
		var messages = "";
		for (e in errors) {
			messages = messages + errors[e] + "\n";
		}
		$("#messages").html(messages);
		$("#report").show();
	}

	$("#working").hide();

};

$(document).ready(function() {
	$.ajax({
		url: "event.txt",
		dataType: "text",
		success: function(data) {
			$("#event").text(data);
		}
	});
	$.ajax({
		url: "occurrence.txt",
		dataType: "text",
		success: function(data) {
			$("#occurrence").text(data);
		}
	});
}); 