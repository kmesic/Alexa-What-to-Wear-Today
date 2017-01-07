/** 
 * Author: Kenan Mesic
 * Date: 1/7/2017
 */

/**
 * Examples:
 * One-shot model:
 *  User: "Alexa, tell What to Wear Today {city}"
 *  Alexa: "The temperatures will be with a 50F high and "
 */

/**
 * App ID for the skill
 */
var APP_ID = undefined; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');
var http = require('http');

/**
 * WearToday is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var WearToday = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
WearToday.prototype = Object.create(AlexaSkill.prototype);
WearToday.prototype.constructor = WearToday;

WearToday.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("WearToday onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

WearToday.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("WearToday onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to the Alexa What to Wear, you can say the city and I will give you recommendations of what to wear";
    var repromptText = "You can say the city";
    response.ask(speechOutput, repromptText);
};

WearToday.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("WearToday onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    //reset options back to normal
    // any cleanup logic goes here
};

WearToday.prototype.intentHandlers = {
    // register custom intent handlers
    "WearTodayIntent": function (intent, session, response) {
        handleWearToday(intent, session, response);
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "With Wear Today, I can recommend what you should wear or bring in a city today based on the weather forcast. What city would you like me to look into?";
        var repromptText =  "What city would you like for me to check what you should wear?";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Goodbye",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Goodbye",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the Wear Today skill.
    var wearToday = new WearToday();
    wearToday.execute(event, context);
};

var apiKey = 'cacdf29dc2be47d484a105606152306';

var b_clothes = ["shorts", "pants", "snow pants"]; //bottom clothing
var u_clothes = ["a short sleeved shirt", "a sweatshirt or a jacket", "a rain jacket", "a snow jacket"]; //upper clothing
var a_clothes = ["a hat", "an umbrella", "a beenie or a scarf or gloves"]; //accessories

var predicated_weather = "The temperatures will be a ";
var predicated_forcast = "The forecast seems to be ";
var what_to_wear = "I would recommend to wear ";
var bottom_wear = " on the bottom";
var upper_wear = " on the top";
var accessories_wear = "I would also recommend to wear or bring ";
var error = "An error occurred when trying to receive the weather forecast. It seems like I cannot tell you what to wear at the moment.";

function handleWearToday(intent, session, response) {
    var city_slot = intent.slots.city;

    var city = "";
    if (city_slot && city_slot.value) {
        city = city_slot.value;
    } else {
        city = "San Francisco";
    }

    dayWeather(response, city, dayWeatherResult);
}

function dayWeatherResult(response, city, valid, dataJson) {
    if (valid) {
        console.log(dataJson);
        var feelslike_f = dataJson.current.feelslike_f;
        var current_cloud = dataJson.current.cloud;
        var current_temp_f = dataJson.current.temp_f;
        var current_condition_text = dataJson.current.condition.text;
        var current_wind_speed = dataJson.current.wind_mph;
        var forecast = dataJson.forecast.forecastday[0];
        var forcast_mintemp_f = forecast.day.mintemp_f;
        var forcast_maxtemp_f = forecast.day.maxtemp_f;
        var forcast_maxwind_speed = forecast.day.maxwind_mph;
        var totalprecip_in = forecast.day.totalprecip_in;
        var forcast_condition = forecast.day.condition.text;

        var bottom_clothes = determineBottomWear(forcast_maxtemp_f, forcast_condition);
        var upper_clothes = determineUpperWear(forcast_maxtemp_f, forcast_condition);
        var accessories_clothes = determineAccessoriesWear(forcast_maxtemp_f, forcast_condition);

        var speech = "";
        var card_text = "";
        
        speech += predicated_weather + forcast_maxtemp_f + " Fahrenheit degrees high and a " + forcast_mintemp_f + " Fahrenheit degrees low. ";
        speech += predicated_forcast + forcast_condition + ". ";

        card_text += predicated_weather + forcast_maxtemp_f + "F high and a " + forcast_mintemp_f + "F low.\n";
        card_text += predicated_forcast + forcast_condition + ".\n";

        speech += what_to_wear + b_clothes[bottom_clothes] + bottom_wear + " and " + u_clothes[upper_clothes] + upper_wear + ". ";
        if (accessories_clothes != -1)
            speech += accessories_wear + a_clothes[accessories_clothes] + ".";     

        card_text += what_to_wear + b_clothes[bottom_clothes] + bottom_wear + ".\nAnd " + u_clothes[upper_clothes] + upper_wear + ".\n";
        if (accessories_clothes != -1)
            card_text += accessories_wear + a_clothes[accessories_clothes] + ".\n";    

        response.tellWithCard(speech, "What to Wear Today in " + city, card_text);

    }
    response.tellWithCard(error, "What to Wear Today in " + city, error);
}

function determineBottomWear(forcast_maxtemp_f, forcast_condition) {
    if (forcast_condition.search(/snow/i) != -1) {
        if (forcast_condition.search(/light/i) != -1) {
            return 1;
        } else {
            return 2;
        }
    }

    if (forcast_condition.search(/rain/i) != -1) {
        if (forcast_maxtemp_f > 80) {
            return 0;
        }
        else {
            return 1;
        }
    }
    
    if (forcast_maxtemp_f < 70) {
        if (forcast_maxtemp_f < 35) {
            return 2; //1.5 determine if snow on ground
        } else {
            return 1;
        }
    } else {
        return 0;
    }
}

function determineUpperWear(forcast_maxtemp_f, forcast_condition) {
    if (forcast_condition.search(/snow/i) != -1) {
        return 3;
    }

    if (forcast_condition.search(/rain/i) != -1) {
        return 2;
    }

    if (forcast_maxtemp_f > 80) {
        return 0;
    } else {
        return 1;
    } 
}

function determineAccessoriesWear(forcast_maxtemp_f, forcast_condition) {
    if (forcast_condition.search(/rain/i) != -1) {
        return 1;
    }
    if (forcast_condition.search(/snow/i) != -1) {
        return 2;
    }
    if (forcast_condition.search(/sunny/i) != -1 && forcast_maxtemp_f > 80) {
        return 0;
    }

    if (forcast_maxtemp_f < 50) {
        return 2;
    }
    return -1;
}


function dayWeather(response, query, callback) {
    var options = {
        host: 'api.apixu.com',
        port:80,
        path: '/v1/forecast.json?key=' + apiKey + '&q=',
        method: 'GET'
    };
    options.path += query + '&days=1';
    options.path = (encodeURI(options.path));
    var data = '';
    http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            var obj = JSON.parse(data);
            if ("error" in obj) {
                    if (obj.error.code > 1006) {
                        response._context.fail(new Error(obj.error.message));
                    }
                    response.ask("Sorry I did not hear the city you requested. In what city do you want to know what to wear?", "In what city do you want to know what to wear?");
            } else  {
                callback(response, query, true, obj);
            }
        });
    }).on('error', function(err) {
        callback(response, query, false, err);
    }).end();
};