var express = require('express'),
    passport = require('passport'),
    util = require('util'),
    uuid = require('node-uuid'),
    request = require('request'),
    CloudFoundryStrategy = require('passport-cloudfoundry').Strategy;

//temporarily store `state` ids
var states = {};

/*
 * Generates a random value to be used as 'state' param during authorization
 */
function generateStateParam() {
    var state = uuid.v4();
    states[state] = true;
    return state;
}

//Set App's credentials
var CF_CLIENT_ID = '';
var CF_CLIENT_SECRET = '';
var CF_CALLBACK_URL = 'https://cfnodelogger.cloudfoundry.com/auth/cloudfoundry/callback';


/*
 Passport session setup.
 To support persistent login sessions, Passport needs to be able to
 serialize users into and deserialize users out of the session.  Typically,
 this will be as simple as storing the user ID when serializing, and finding
 the user by ID when deserializing.  However, since this example does not
 have a database of user records, the complete CloudFoundry profile is
 serialized and deserialized.
 */
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

/*
 Use the CloudFoundryStrategy within Passport.
 Strategies in Passport require a `verify` function, which accept
 credentials (in this case, an accessToken, refreshToken, and CloudFoundry
 profile), and invoke a callback with a user object.
 */
var cfStrategy = new CloudFoundryStrategy({
    clientID: CF_CLIENT_ID,
    clientSecret: CF_CLIENT_SECRET,
    callbackURL: CF_CALLBACK_URL,
    passReqToCallback: true
}, function (req, accessToken, refreshToken, profile, done) {
    if (!req.query.state || !states[req.query.state]) {
        console.log("state error! " + req.query.state);
        return done({
            'error': ' state-variable didn\'t match. Possible CSRF?'
        });
    }

    //Store accessToken in session
    req.session._cfAccessToken = accessToken;

    //delete state
    delete states[req.query.state];

    // asynchronous verification, for effect...
    process.nextTick(function () {

        return done(null, profile);
    });
});

//Set a random 'state' generator
cfStrategy.setStateParamCallBack(generateStateParam);

passport.use(cfStrategy);


var app = express();

// configure Express
app.configure(function () {
    // app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.session({
        secret: 'keyboard cat'
    }));
    // Initialize Passport!  Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});


app.get('/', function (req, res) {
    if (!req.user || !req.user.email) {
        req.session.destroy();
        req.logout();
        cfStrategy.reset();
        //return res.redirect('/login');
    }
    res.sendfile(__dirname + '/public/index.html');
});

/*
 GET /auth/cloudfoundry
 Use passport.authenticate() as route middleware to authenticate the
 request.  The first step in CloudFoundry authentication will involve
 redirecting the user to angellist.co.  After authorization, CloudFoundry
 will redirect the user back to this application at /auth/angellist/callback
 */
app.get('/auth/cloudfoundry', passport.authenticate('cloudfoundry'), function (req, res) {
    // The request will be redirected to CloudFoundry for authentication, so this
    // function will not be called.
});

/*
 GET /auth/angellist/callback
 PS: This MUST match what you gave as 'callback_url' earlier
 Use passport.authenticate() as route middleware to authenticate the
 request.  If authentication fails, the user will be redirected back to the
 login page.  Otherwise, the primary route function function will be called,
 which, in this example, will redirect the user to the home page.
 */
app.get('/auth/cloudfoundry/callback', passport.authenticate('cloudfoundry', {
    failureRedirect: '/'
}), function (req, res) {
    res.redirect('/');
});

app.get('/logout', function (req, res) {
    console.log(' in logout');
    req.session.destroy();
    req.logout();
    cfStrategy.reset(); //reset auth tokens
    res.redirect('/');
});

/**
 *  Return currently logged in user's account
 */
app.get('/me', function (req, res) {
    if (!req.user) {
        return res.json({});
    }
    request({url: 'https://api.cloudfoundry.com/apps/', headers: {'Authorization': 'Bearer ' + req.session._cfAccessToken}},
        function (err, response, body) {
            if (!err && response.statusCode == 200) {
                var apps = JSON.parse(body);
                res.json({account: {user: req.user, apps: apps}});
            } else {
                res.json(response.statusCode, {Error: 'Could not get apps. Not authorized'});
            }
        });
});

/**
 * Simply stream logs back to browser.
 */
app.get('/logs', function (req, res) {
    request({url: req.query.url, headers: {'Authorization': 'Bearer ' + req.session._cfAccessToken}}).pipe(res);
});


/**
 * Simple route middleware to ensure user is authenticated.
 * Use this route middleware on any resource that needs to be protected.If
 * the request is authenticated(typically via a persistent login session), the request will proceed.Otherwise, the user will be redirected to the
 * login page.
 */
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

app.listen(3000);

