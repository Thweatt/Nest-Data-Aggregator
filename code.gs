function doGet() {
// you only need to modify the next three lines of this code then publish web app
  var email = 'username'; //what you use to login to nest
  var password = 'password' //what you use to login to nest
  var sheetid = 'Sheet ID';  //on your spreadsheet url its everything between /d/ <sheet id> /edit
  
/*  to publish web app just:
  1) Make sure the four variables are set above before you publish
  2) Click Publish --> Deploy as web app
  3) Describe the web app and save a new version
  4) Execute the app as: me (your google account)
  5) Who has access to the app: Anyone, even anonymous (this what allows the timebased() triggers to run as expected)
  6) Click Deploy
  7) Set your timebased() trigger to run getData() which just does a url fetch of this script and invokes doGet()
*/

  var login_auth = performLogin(email,password);
             
  var headers = {
    "Authorization" : 'Basic '+login_auth['access_token'],
    "X-nl-user-id"  : login_auth['userid'],
    "X-nl-protocol-version" : '1',
    'Accept-Language': 'en-us',
    'Connection'    : 'keep-alive',
    'Accept'        : '*/*',
  };
  
  var options = {
    'headers' : headers
  };
  
  var request=UrlFetchApp.fetch(login_auth['urls']['transport_url']+'/v2/mobile/user.'+login_auth['userid'], options);
  var result=JSON.parse(request.getContentText());
 
  var structure_id = result['user'][login_auth['userid']]['structures'][0].split('.')[1]
  var device_id    = result['structure'][structure_id]['devices'][0].split('.')[1]
 
  var current_temp = ((result["shared"][device_id]["current_temperature"]*9)/5)+32; //converts current_temp to Fahrenheit
  var target_temp  = ((result["shared"][device_id]["target_temperature"]*9)/5)+32; //converts target_temp to Fahrenheit
  var humidity     = result["device"][device_id]["current_humidity"]/100; //converts humidity to percent
  var auto_away    = result["shared"][device_id]["auto_away"];
  var heater_state = result["shared"][device_id]["hvac_heater_state"];
  var ac_state     = result["shared"][device_id]["hvac_ac_state"]
  var time = new Date();
 
  //Weather information from http://openweathermap.org/
  var wxrequest=UrlFetchApp.fetch('http://api.openweathermap.org/data/2.5/weather?id=4645738&APPID=<Insert Your App ID>&units=imperial');
  var wxresult=JSON.parse(wxrequest.getContentText());

  var cloudcover       = (wxresult["clouds"]["all"]) / 100;
  var outside_temp     = wxresult["main"]["temp_min"];
  var outdoor_humidity = (wxresult["main"]["humidity"]) / 100;
//var description      = wxresult["weather"]["description"];

 
/*  
  //weather.gov weather variables
  
  var wxrequest2=UrlFetchApp.fetch('http://forecast.weather.gov/MapClick.php?lat=35.934&lon=-86.659&FcstType=json');
  var wxresult2=JSON.parse(wxrequest2.getContentText());
  
  var wxresult2=JSON.parse(wxrequest2.getContentText());
  var outside_temp = wxresult2["currentobservation"]["Temp"];
  var outdoor_humidity = (wxresult2["currentobservation"]["Relh"])/100;
*/  
  
  var ss = SpreadsheetApp.openById(sheetid);
  var sheet = ss.getSheets()[0];
 
  // Appends a new row with 3 columns to the bottom of the
  // spreadsheet containing the values in the array
  sheet.appendRow( [ time, target_temp, current_temp,  outside_temp, humidity, outdoor_humidity , cloudcover , heater_state, ac_state , auto_away ] );
}

function performLogin(email, password) {
  var payload = {
    "username" : email,
    "password" : password
  };
  
  var options = {
    "method"  : "post",
    "payload" : payload
  };
 
  var response = JSON.parse(UrlFetchApp.fetch('https://home.nest.com/user/login', options).getContentText());
  if ('error' in response) {
    throw "Invalid login credentials";
  }  
  return response
}

function getData(){  
  var url = ScriptApp.getService().getUrl();
  var response = UrlFetchApp.fetch(url);
}  
