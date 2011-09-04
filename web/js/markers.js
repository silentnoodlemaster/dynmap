
var dynmapmarkersets = {};

componentconstructors['markers'] = function(dynmap, configuration) {
	var me = this;

	function removeall() {
		$.each(dynmapmarkersets, function(setname, set) {
			$.each(set.markers, function(mname, marker) {
				set.layergroup.removeLayer(marker.our_marker);
			});
			dynmap.layercontrol.removeLayer(set.layergroup);
		});
	}
			
	function loadmarkers(world) {
		removeall();
		dynmapmarkersets = {};	
		$.getJSON(dynmap.options.tileUrl+'_markers_/marker_'+world+'.json', function(data) {
			var ts = data.timestamp;
			$.each(data.sets, function(name, markerset) {
				dynmapmarkersets[name] = markerset;
				createMarkerSet(markerset);
				$.each(markerset.markers, function(name, marker) {
					createMarker(markerset, marker);
				});
			});
		});
	}
	
	function getPosition(marker) {
		return dynmap.getProjection().fromLocationToLatLng({ x: marker.x, y: marker.y, z: marker.z });
	}
	
	function createMarker(set, marker) {
		var markerPosition = getPosition(marker);
		marker.our_marker = new L.CustomMarker(markerPosition, { elementCreator: function() {
			var div = document.createElement('div');

			var markerPosition = getPosition(marker);
			marker.our_marker.setLatLng(markerPosition);
						
			$(div)
				.addClass('Marker')
				.addClass('mapMarker')
				.append($('<img/>').addClass('markerIcon16x16').attr({ src: dynmap.options.tileUrl+'_markers_/'+marker.icon+'.png' }))
				.append($('<span/>')
					.addClass('markerName')
					.text(marker.label));
			return div;
		}});
		
		set.layergroup.addLayer(marker.our_marker);
	}
	
	function createMarkerSet(set) {
		set.layergroup = new L.LayerGroup();
		dynmap.map.addLayer(set.layergroup);
		dynmap.layercontrol.addOverlay(set.layergroup, set.label);
	}
	
	$(dynmap).bind('component.markers', function(event, msg) {
		console.log('got marker event - ' + msg.ctype + ', ' + msg.msg);
		if(msg.msg == 'markerupdated') {
			var marker = dynmapmarkersets[msg.set].markers[msg.id];
			if(marker && marker.our_marker) {
				dynmapmarkersets[msg.set].layergroup.removeLayer(marker.our_marker);
			}
			marker = { x: msg.x, y: msg.y, z: msg.z, icon: msg.icon, label: msg.label };
			dynmapmarkersets[msg.set].markers[msg.id] = marker;
			createMarker(dynmapmarkersets[msg.set], marker);
		}
		else if(msg.msg == 'markerdeleted') {
			var marker = dynmapmarkersets[msg.set].markers[msg.id];
			if(marker && marker.our_marker) {
				dynmapmarkersets[msg.set].layergroup.removeLayer(marker.our_marker);
			}
			delete dynmapmarkersets[msg.set].markers[msg.id];
		}
	});
	
    // Remove marker on start of map change
	$(dynmap).bind('mapchanging', function(event) {
		$.each(dynmapmarkersets, function(setname, set) {
			$.each(set.markers, function(mname, marker) {
				set.layergroup.removeLayer(marker.our_marker);
			});
		});
	});
    // Remove marker on map change - let update place it again
	$(dynmap).bind('mapchanged', function(event) {
		$.each(dynmapmarkersets, function(setname, set) {
			$.each(set.markers, function(mname, marker) {
				var marker = set.markers[mname];
				var markerPosition = getPosition(marker);
				marker.our_marker.setLatLng(markerPosition);
				if(dynmap.map.hasLayer(marker.our_marker) == false)
					set.layergroup.addLayer(marker.our_marker);
			});
		});
	});
	// Load markers for new world
	$(dynmap).bind('worldchanged', function(event) {
		loadmarkers(this.world.name);
	});
	
	loadmarkers(dynmap.world.name);

};