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

var append = function(tree, node) {
	if (tree.id == node.parentEventID) {
		if (!tree.nodes) {
			tree.nodes = [];
		}
		tree.nodes.push(createnode(node));
		return true;
	} else if (tree.nodes) {
		for (n in tree.nodes) {
			if (append(tree.nodes[n], node)) {
				return true;
			}
		}
	}
	return false;
};

var createnode = function(data) {
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
		text = text + " <span class=\"label label-field\">minimumDepthInMeters" + data.minimumDepthInMeters + "</span>";
	}
	if (data.maximumDepthInMeters && data.maximumDepthInMeters != "") {
		text = text + " <span class=\"label label-field\">maximumDepthInMeters" + data.maximumDepthInMeters + "</span>";
	}
	var node = {
		text: text,
		id: data.eventID
	};
	return node;
};

var convert = function() {
	$("#working").show();
	$("#messages").html("");
	$("#report").hide();
	$("#wrapper").hide();
	setTimeout(convert2);
};

var convert2 = function() {

	var errors = [];
	var rootevents = 0;
	var totalevents = 0;
	var tree = [];

	// parse inout

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

	// process nodes

	data.reverse();

	totalevents = data.length;

	while (data.length > 0) {

		console.log("next run: " + data.length);

		for (var i = data.length - 1; i >= 0; i--) {

			if (!data[i].parentEventID) {

				// no parentEventID present

				rootevents++;
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

	// create tree

	$("#wrapper").show();

	$("#tree").treeview({
		data: tree,
		levels: 100,
		showBorder: false
	});

	var messages = "";
	for (e in errors) {
		messages = messages + errors[e] + "\n";
	}

	$("#messages").html(messages);
	$("#report").show();

	$("#working").hide();

};