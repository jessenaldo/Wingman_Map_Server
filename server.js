var express = require('express')
var Firebase = require("Firebase");
var $http = require('http');
var request = require('request');
var btoa = require('btoa');
var _ = require('lodash-node');
var GeoFire = require('geofire');
var RSVP = require('rsvp');
var async = require('async');

var app = express();

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(bodyParser.json());

var server = app.listen(8000, function() {
	console.log("Listening on port 8000.....");
});



var firebaseRef = new Firebase("placeholder_url");
var firebase_auth_token = 'placeholder_token';

var locationsRef = new Firebase(firebaseRef + "/locations");


var ionic_private_api_key = 'placeholder_key';
var ionic_app_id = 'placeholder_app_id';







app.post('/requestwingman', function(req, res) {
	console.log(req.body);


	firebaseRef.authWithCustomToken(firebase_auth_token, function(error, result) {
	  if (error) {
	    console.log("Authentication Failed!", error);
	  } else {
	    console.log("Authenticated successfully with payload:", result.auth);
	    console.log("Auth expires at:", new Date(result.expires * 1000));
		  
		var notifyusers = [];
		firebaseRef.child("users").on("value", function(snapshot) {
			// console.log(snapshot.val());
			var allUsers = snapshot.val();

			var geoFire = new GeoFire(locationsRef);

			var geoQuery = geoFire.query({center: req.body.center, radius: req.body.radius});

			var tokens = [];
			var user; 

			var onKeyEnteredRegistration = geoQuery.on("key_entered", function(geokey, location) {
				console.log(geokey + " entered the query. Hi " + geokey + "!");

				for (var key in allUsers) {
					if(!allUsers.hasOwnProperty(key)) continue;

					var obj = allUsers[key];
					
					if (key == geokey && key != req.body.userId) {
						console.log(obj['deviceToken']);
						tokens.push(obj['deviceToken'])
						
					}

					// if (key = req.body.userId) {
					// 	user = key;
					// 	console.log("this is the user", user)
					// }
				}

				

			});

			var onReadyRegistration = geoQuery.on("ready", function() {
				console.log('GeoQuery has loaded and fired all other events for initial data');
				console.log(tokens);

				if (typeof(tokens) != "undefined") {
					if(tokens.length) {
						request({
							url: "https://push.ionic.io/api/v1/push",
							method: "POST",
							json: true,
							body: {
								"tokens": tokens,
								"notification": {
									"alert": req.body.userId + " needs a wingman!",
									"android":{
										"payload": {"$state":"wingmanhelper", "param": ""+ req.body.userId +""}
									}
								}
							},
							headers: {
								'Authorization': 'Basic ' + btoa(ionic_private_api_key + ":"),
								'X-Ionic-Application-Id': ionic_app_id
							}
						}, function (error, response, body) {
							console.log(body);
							return res.send(body);

						})
					}
				}

			})


		})

	  }
	});

	

	


})

