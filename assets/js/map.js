var openwindow = -1;
var map;
var optionsstate = 0;
var detailsstate = 0;
var speed = 750;
var deals = new Array();
var lat = -1;
var lng = -1;

function initialize() {
	//create the map
	var myOptions = {
		center : new google.maps.LatLng(39, -94),
		zoom : 5,
		mapTypeId : google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(document.getElementById("map_canvas"),
			myOptions);
	
	var addressBarDiv = document.createElement('div');
	var homeControl = new HomeControl(addressBarDiv, map);
	addressBarDiv = document.getElementById("AddressBar");
	addressBarDiv.index =2;
	map.controls[google.maps.ControlPosition.TOP_CENTER].push(addressBarDiv);
	
	var GrouponLogoDiv = document.createElement('div');
	var homeControl = new HomeControl(GrouponLogoDiv, map);
	GrouponLogoDiv = document.getElementById("GrouponLogo");
	GrouponLogoDiv.index =2;
	map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(GrouponLogoDiv);

	//loop through the deals array and make deal for each
	var infowindow = new google.maps.InfoWindow();
	$.getJSON('/getjson', function(data) {
		for (var i in data.deals) {
			if (data.deals[i].options[0].redemptionLocations[0]){
				deals[i] = new deal(data.deals[i].title,data.deals[i].options[0].price.formattedAmount,data.deals[i].options[0].redemptionLocations[0].lat,data.deals[i].options[0].redemptionLocations[0].lng,data.deals[i].type,data.deals[i].pitchHtml,data.deals[i].largeImageUrl,data.deals[i].dealUrl,infowindow,data.deals[i].id,data.deals[i].announcementTitle);
				}
		}
		ShowClosestDeal();
	});
	
	var searchstr = ""
	$.get("http://ipinfo.io/json", function(response) {
	if (response.region != "null"){
		searchstr = response.region;
	}
	if (response.country != "null"){
		searchstr = searchstr + ", " + response.country;
	}
	if (searchstr != ""){
		var latandlon = response.loc.split(",");
		lat = latandlon[0];
		lng = latandlon[1];
		result = searchLocationByString(searchstr);
	}
	
	}, "jsonp");
	
}

function ShowClosestDeal(){
	var closest = 9000;
	var closestdeal = "";
	var distance;
	var curdeal;
	//TODO check if we have loaded > 0 deals and if we have loaded the IP info
	for (var i in deals){
		curdeal = deals[i]
		distance = 9001;
		distance = Math.abs(curdeal.dealLat - lat) + Math.abs(curdeal.dealLon - lng);
		if (distance < closest){
			closest = distance;
			closestdeal = curdeal;
		}
	}
	if (closestdeal != ""){
		DisplayDeal(closestdeal);
	}
	
	

}
function makeInfoWindowEvent(map, deal, marker) {
  google.maps.event.addListener(marker, 'click', function () {
	DisplayDeal(deal);
  });
}
function DisplayDeal(deal){
	document.getElementById("dealdescription").innerHTML=deal.dealTitle;
	document.getElementById("dealpictureimg").src=deal.dealImageURL;
	document.getElementById("dealdetails").innerHTML=deal.dealDescription;
	document.getElementById("detailtitle").innerHTML= deal.announcementTitle
	document.getElementById("deallink").href=deal.dealBuyURL;
	$("#deallink").text("Stays starting at " + deal.dealPrice + "! view on Groupon")
    createCookie(deal.dealid, 'YES', 14);
    deal.viewed = 'YES';
    deal.marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
    detailsstate =1;
}
function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function deal(Title, Price, Lat, Lon, Type, Description, ImageURL, BuyURL, infowindow, dealid, announcementTitle) {
		this.dealTitle = Title;
		this.dealPrice = Price;
		this.dealLat = Lat;
		this.dealLon = Lon;
		this.dealType = Type;
		this.dealDescription = Description;
		this.dealImageURL = ImageURL;
		var PID = "7229223"
		this.dealBuyURL = encodeURI("http://www.anrdoezrs.net/click-"+PID+"-10804307?url=" + BuyURL);
		this.googlelatlon = new google.maps.LatLng(Lat, Lon);
		this.dealid = dealid;
		this.cookie = readCookie(dealid);
		this.announcementTitle = announcementTitle;
		this.marker = new google.maps.Marker({
			position : this.googlelatlon,
			map : map,
			title : this.dealTitle,
			animation: google.maps.Animation.DROP,
			visible : true
		});
		if (this.cookie){
			this.viewed = readCookie(dealid);
		}
	else{
			this.viewed = 'NO';
	}
		if (this.viewed == 'YES')
		{
			this.marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png')
		}
	else{
		this.marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png')
	}
		
		
		makeInfoWindowEvent(map, this, this.marker);

	}
	function HomeControl(controlDiv, map) {

  // Set CSS styles for the DIV containing the control
  // Setting padding to 5 px will offset the control
  // from the edge of the map.
  controlDiv.style.padding = '5px';

  // Set CSS for the control border.
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = 'white';
  controlUI.style.borderStyle = 'solid';
  controlUI.style.borderWidth = '2px';
  controlUI.style.cursor = 'pointer';
  controlUI.style.textAlign = 'center';
  controlUI.title = 'Click to set the map to Home';
  controlDiv.appendChild(controlUI);

  // Set CSS for the control interior.
  var controlText = document.createElement('div');
  controlText.style.fontFamily = 'Arial,sans-serif';
  controlText.style.fontSize = '12px';
  controlText.style.paddingLeft = '4px';
  controlText.style.paddingRight = '4px';
  controlText.innerHTML = '<strong>Home</strong>';
  controlUI.appendChild(controlText);

  // Setup the click event listeners: simply set the map to Chicago.
  google.maps.event.addDomListener(controlUI, 'click', function() {
    map.setCenter(chicago)
  });
}


	function changeView(checkbox){
		swlatlon= new google.maps.LatLng(checkbox.swcordlat, checkbox.swcordlon);
		nelatlon= new google.maps.LatLng(checkbox.necordlat, checkbox.necordlon);
		bounds = new google.maps.LatLngBounds(swlatlon, nelatlon);
		map.fitBounds(bounds);
		
	}
function searchLocation()	{
	address = document.getElementById("AddressBox").value
	geocoder = new google.maps.Geocoder();
	geocoder.geocode({ 'address': address }, function(results, status) {
  if (status == google.maps.GeocoderStatus.OK) {
    map.setCenter(results[0].geometry.location);
    map.fitBounds(results[0].geometry.bounds)
    
	}
}
);
return false;
}

function searchLocationByString(searchstring)	{
	address = searchstring;
	geocoder = new google.maps.Geocoder();
	geocoder.geocode({ 'address': address }, function(results, status) {
  if (status == google.maps.GeocoderStatus.OK) {
    map.setCenter(results[0].geometry.location);
    map.fitBounds(results[0].geometry.bounds)
    
	}
}
);
return false;
}