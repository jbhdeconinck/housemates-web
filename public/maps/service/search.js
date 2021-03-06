// Creates the gservice factory - our primary means to interact with Google Maps
angular.module('search', []).factory('search', ['$http', '$rootScope', function($http, $rootScope) {

  // The service our factory will return
  var googleMapService = {};

  // Array of locations obtained from API calls
  var locations = [];

  // Selected Location (London)
  var selectedLat = 51.500;
  var selectedLong = -0.137;

  googleMapService.clickLat = 0;
  googleMapService.clickLong = 0;

  // Refresh the Map with new data. The function will take new lat and long co-ords
  googleMapService.refresh = function(latitude, longitude) {
    locations = [];

    selectedLat = latitude;
    selectedLong = longitude;

    // AJAX call to get all of the records in the db.
    $http.get('/users').success(function(response) {
      // Convert the results into Google Map format
      locations = convertToMapPoints(response);
      console.log("respons", response);

      // Initialize the map
      initialize(latitude, longitude);
    }).error(function(){});
  };

  // PRIVATE FUNCTIONS
  // Convert a JSON of users into map points
  var convertToMapPoints = function(response) {
    var locations = [];

    // Loop through all of the JSON entries provided in the response
    for(var i=0; i < response.length; i++) {
      var user = response[i];
      console.log("Username: ", user.username);
      console.log("Desired Location: ", user.desiredLocation);
      console.log("Id: ", user.id);

      // Create popup windows for each record
      var contentString =
      '<p><b>Username</b>: <a href="/#!/users/' + user.id + '">' + user.username + '</a>' +
      '<br><b>Desired Locations</b>: ' + user.desiredLocation +
      '</p>';

      console.log("Lat", user.location[0]);
      console.log("lon", user.location[1]);
      console.log("  ");
      // Converts each of the JSON records into Google Maps Location format [Lat, Lng]
      locations.push({
        latlon: new google.maps.LatLng(user.desired_location[1], user.desired_location[0]),
        message: new google.maps.InfoWindow({
          content: contentString,
          maxWidth: 320
        }),
        username: user.username,
        desiredLocations: user.desiredLocation
      });
    }
  //  getLocation(locations, function(location){
  //   });
    return locations;
  };

  // Initializes the map
  var initialize = function(latitude, longitude) {

    // Uses the selected lat, long as starting point
  var myLatLng = {lat: selectedLat, lng: selectedLong};

  if (!map) {
    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: myLatLng
    });
    var autocomplete = new google.maps.places.Autocomplete(document.getElementById('desired_location'));
  }

  // Loop through each location in the array and place a marker
  locations.forEach(function(n, i) {
    var marker = new google.maps.Marker({
      position: n.latlon,
      map: map,
      title: "Big Map",
      icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  });

  // For each marker created, add a listener that checks for clicks
  google.maps.event.addListener(marker, 'click', function(e) {
    currentSelectedMarker = n;
    console.log('hi');
    n.message.open(map, marker);
  });
});

// Set initial location as a bouncing red marker
var initialLocation = new google.maps.LatLng(latitude, longitude);
var marker = new google.maps.Marker({
  position: initialLocation,
  animation: google.maps.Animation,
  map: map,
  icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
});
lastMarker = marker;

// Function for moving to a selected Location
map.panTo(new google.maps.LatLng(latitude, longitude));

// Clicking on the Map moves the bouncing red marker
google.maps.event.addListener(map, 'click', function(e) {
  var marker = new google.maps.Marker({
    position: e.latLng,
    animation: google.maps.Animation,
    map: map,
    icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
  });

  // Delete the old red marker when a new spot is selected
  if(lastMarker) {
    lastMarker.setMap(null);
  }

  // Create a new red marker and move to it
  lastMarker = marker;
  map.panTo(marker.position);

  // Update broadcasted variable (lets the panel know to change their lat, long values)
  googleMapService.clickLat = marker.getPosition().lat();
  googleMapService.clickLong = marker.getPosition().lng();
  $rootScope.$broadcast("clicked");
});
  };

  // Refresh the page upon window load. Use the initial latitude and longitude
  google.maps.event.addDomListener(window, 'load', googleMapService.refresh(selectedLat, selectedLong));

  return googleMapService;
}]);
