var parse = function(csv) {
	var lines = csv.trim().split("\n");
	var result = [];
	var headers = lines[0].split(sep);
	for (var i = 1; i < lines.length; i++) {
		var obj = {};
		var line = lines[i].split(sep);
		for (var j = 0; j < line.length; j++) {
			obj[headers[j]] = line[j].trim();
		}
		result.push(obj);
	}
	return result;
}

var append = function(tree, node, type) {
	if (type == "occurrence") {
		if (tree.id == node[fk]) {
			if (!tree.nodes) {
				tree.nodes = [];
			}
			tree.nodes.push(createnode(node, type));
			return true;
		} else if (tree.nodes) {
			for (n in tree.nodes) {
				if (append(tree.nodes[n], node, type)) {
					return true;
				}
			}
		}
		return false;
	} else if (type == "measurement") {
		if (node.occurrenceID && node.occurrenceID != "") {
			if (tree.id == node.occurrenceID) {
				if (!tree.nodes) {
					tree.nodes = [];
				}
				tree.nodes.push(createnode(node, type));
				return true;
			} else if (tree.nodes) {
				for (n in tree.nodes) {
					if (append(tree.nodes[n], node, type)) {
						return true;
					}
				}
			}
			return false;
		} else {
			if (tree.id == node[fk]) {
				if (!tree.nodes) {
					tree.nodes = [];
				}
				tree.nodes.push(createnode(node, type));
				return true;
			} else if (tree.nodes) {
				for (n in tree.nodes) {
					if (append(tree.nodes[n], node, type)) {
						return true;
					}
				}
			}
			return false;
		}
	} else if (type == "event") {
		if (tree.id == node.parentEventID) {
			if (!tree.nodes) {
				tree.nodes = [];
			}
			tree.nodes.push(createnode(node, type));
			return true;
		} else if (tree.nodes) {
			for (n in tree.nodes) {
				if (append(tree.nodes[n], node, type)) {
					return true;
				}
			}
		}
		return false;
	}
};

var createnode = function(data, type) {
	var node = {
		selectable: false
	};
	if (type == "occurrence") {
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
		node.text = text;
		node.id = data.occurrenceID;
	} else if (type == "measurement") {
		var text = "";
		if (data.measurementID) {
			text = data.measurementID + " ";
		}
		if (data.measurementType && data.measurementType != "") {
			text = text + "<span class=\"label label-info\">" + data.measurementType + "</span>";
		}
		if (data.measurementValue && data.measurementValue != "") {
			text = text + " <span class=\"label label-field\">measurementValue: " + data.measurementValue + "</span>";
		}
		node.text = text;
	} else if (type == "event") {
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
		node.text = text;
		node.id = data.eventID;
	}
	return node;
};

var tree = [];
var errors = [];
var fk = "id";
var sep = "\t";

var process = function() {
	fk = $("#fk").val();
	if ($("#sep").val() == "tab") {
		sep = "\t";
	}
	$("#working").show();
	$("#messages").html("");
	$("#report").hide();
	$("#wrapper").hide();
	setTimeout(function() {
		tree = [];
		errors = [];
		process_event();
		process_occurrence();
		process_measurement();
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

				tree.push(createnode(data[i], "event"));
				data.splice(i, 1);

			} else {

				// parentEventID present

				for (t in tree) {
					if (append(tree[t], data[i], "event")) {

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
			if (append(tree[t], data[i], "occurrence")) {
				found = true;
				break;
			}
		}
		if (!found) {
			errors.push("No event " + data[i].id + " found for occurrence " + data[i].occurrenceID);
		}
	}

};

var process_measurement = function() {

	// parse input

	var input = $("#measurement").val();
	var data = parse(input);

	// process lines

	for (var i = 0; i < data.length; i++) {
		var found = false;
		for (t in tree) {
			if (append(tree[t], data[i], "measurement")) {
				found = true;
				break;
			}
		}
		if (!found) {
			var e = "No event " + data[i].id + " found for measurement";
			if (data[i].measurementID) {
				e = e + " " + data[i].measurementID;
			}
			errors.push(e);
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
	$.ajax({
		url: "measurementorfact.txt",
		dataType: "text",
		success: function(data) {
			$("#measurement").text(data);
		}
	});
}); 

var expand = function() {
	$("#tree").treeview("expandAll", { levels: 100, silent: true });
};

var collapse = function() {
	$("#tree").treeview("collapseAll", { silent: true });
};

var empty = function() {
	$("#event").val("");
	$("#occurrence").val("");
	$("#measurement").val("");
};