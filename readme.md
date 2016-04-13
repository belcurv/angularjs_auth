## AngularJS Authentication

What this course is about: **How to authenticate our apps with JSON web tokens**.

1.  We're going to use Auth0 to do this.  Auth0 is a service that provides a ncice login box that's ready to go.
2.  We just need to provide some functions in our app to tie into that service.
3.  Once we've done that, we'll be able to get our users profile and token and save those in local storage.
4.  Then we can use that token to make requests for secured resources on our server.

In traditional applications, a user needs to refresh the page to get or submit data.  Of course Angular is a framework for building single page apps, and single page apps send/receive data behind the scenes using XHR requests.

Authentication in a traditional app looks like this:

1.  A user lands on your web page and log in with their credentials (username and password)
2.  Those credentials get submitted to a server where they're checked against a database.
3.  If the check out, a **session** is created on the backend for that user.
4.  The server responds to the user's browser with a session cookie.
5.  That session cookie is automatically sent to the server with each round trip request.
6.  This is maintained until logout or until the cookie expires.

The traditional session cookie approach has some issues when building modern apps.

1.  AngularJS apps work very well with data APIs, and JSON data is the easiest to use.  So what we're going to do is build basically 2 separate apps: and API and a client app.  They communicate via XHR requests.  So we're going to build a RESTful API.  One core tenet: **RESTful APIs should be stateless**.  This means that when we construct an API request, that request should always return the same resouse.  This is an issue with traditional auth sessions because sessions introduce state on our server, which can affect the results returned from requests.
2.  Modern app ecosystems don't work well with sessions.  Sessions can't easily be shared - modern apps often use multiple servers, and session authentication across multiple servers is difficult.
3.  Coockies don't flow downstream.  Our server might rely on downstream servers.
4.  We want to be able to write an API that can be used across vaious different applications (web, mobile, etc.) and cookies aren't a good fit for this.

What about the front-end?  In a good Angular setup our app doesn't have any kind of stateful connection to the backend. Instead it's going to satisfy its data needs via XHR.  So what do we want in AngularJS authentication?

1.  Route access should be controlled.
2.  Need some indication of authentication.
3.  Conditionally show/hide UI elements depending on the user's authentication status.

How can Angular know if the user is authenticated without a session?  How can we authenticate at all without sessions, cookies and state?  **JSON Web Tokens**

### JSON Web Tokens

It's and open standard under RFC that describes a way to securely transmit 'claims' between two parties.  JWTs communicate JSON objects, one of which is a claim: a piece of info that's asserted about a subject.  For the purpose of authentication, that subject is a user.

Auth0 has a nice site: jwt.io.  It has a debugger and encode/decode feature.

JWT has three parts:

1.  Header: the algorithm and token type
2.  Payload: the data - _the claims_.  
3.  Signature: takes the encoded header + encoded payload + a secret, and hashes it using algorithm specified in the header.

How are JWT used for authentication in Angular apps?

1.  User sends creds to a server
2.  In response, sever sends user JWT
3.  Subsequent client requests for secured resources include the JWT in the request header

The JWT is attached to the Authorization header using a "bearer" scheme.  `Authorization: Bearer <token>`.  HTTP requests just need to attach an extra header which includes the JWT.

## Here's where Ryan takes off and goes really fast

### Using Auth0 Authentication 'Brokerage'

Auth0 offloads the tricky parts of authentication for us.  Basically Auth0 has our user database.  Our app's login feature sends credentials to Autho0, and if everything checks out they'll get a JWT back from Auth0.  After that we can use the JWT to secure our own server.

Auth0 can do social login, multi-factor, single sign-on, passwordless login.

### Sign up for Auth0 and register a User

Go to: **https://auth0.com/angularjs**

During setup, we need to create an account name.  This can be anything, but should probably be something like our organization name.  Region: US West.  Company Name: AngularJS Testing.  Role: Software Developer.  Accept EU clause.  Click create account.

7000 regular active users are included in Auth0's free plan.  That's the only limitation.

Creating our account also create a Default App.  Go the the settings area and note the:

1.  Domain - this is used to call Auth0 from within our Angular application
2.  ClientID - public "key" used by our Angular app.
3.  Client Secret - used to sign the tokens our users get back.  This goes on our NodeJS server so that our users' JWTs can be verified when they reach our middleware.

In Settings > Connections, there are Social login connections.  Twitter, Google, facebook, Github, etc.

In Settings > Users, we can manage our users.  **Set up a use now**, with our own credentials.  Connection type will just be the default _Username-Password-Authentication_ for now.

The Users dashboard is really nice.  After user creation their status will be 'pending' because Auth0 emailed them to verify their account.  Nice!

### Creating the AngularJS Front-End App

To-do:

1.  Create logic to get user's JWT and save it to local storage.
2.  Attach the JWT as a request header so that when the user communicates to the back-end they are able to get the secure resource(s).

Ryan uses NPM to get dependencies. There's lots of them:

1.  **angular**
2.  **angular-material**
3.  **angular-animate**
4.  **angular-aria**
5.  **angular-messages**
6.  **angular-ui-router**
7.  **angular-jwt** - An Auth0 package that makes it easier to do JWT authentication in angular apps
8.  **angular-storage** - for storing a user's JWT in local storage
9.  **auth0-angular** - allows us to use Auth0 in our app

So...

```
npm install --save angular angular-material angular-animate angular-aria angular-messages angular-ui-router angular-jwt angular-storage auth0-angular
```

#### Create index.html

When we do authentication with Auth0, we can either use the login widget that they provide (called 'Lock') or we can provide our own login box that calls their API.  For this course, we use their Lock widget.  Get it from Auth0's Angular quick-start page (https://auth0.com/angularjs) - scroll down, copy the Auth0 Lock script CDN code and paste it into the `<head>`.  Also copy the meta viewport code; paste it into the `<head>`.  

We bootstrap the app with `ng-app="authApp"`.


The whole of it should look like this:


```
<!DOCTYPE html>
<html lang="en" ng-app="authApp">
    <head>
        <meta charset="utf-8">
        <!-- Setting the right viewport -->
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

        <title>AngularJS Auth</title>
        <link rel="stylesheet" href="css/angular-material.css">
        
        <!-- Auth0 Lock script and AngularJS module -->
        <script src="//cdn.auth0.com/js/lock-9.0.min.js"></script>
    </head>
    <body>
    
        <!-- 3RD PARTY JAVASCRIPT -->
        <script src="js/vendor/angular.js"             ></script>
        <script src="js/vendor/angular-animate.js"     ></script>
        <script src="js/vendor/angular-aria.js"        ></script>
        <script src="js/vendor/angular-material.js"    ></script>
        <script src="js/vendor/angular-jwt.js"         ></script>
        <script src="js/vendor/angular-storage.js"     ></script>
        <script src="js/vendor/auth0-angular.js"       ></script>
        <script src="js/vendor/angular-ui-router.js"   ></script>
        
        <!-- OUR JAVASCRIPT -->
        <script src="js/app.js"                        ></script>

    </body>
</html>
```

#### Now create app.js.  Inject a bunch of dependencies:

```javascript
angular
    .module('authApp', ['auth0', 'angular-storage', 'angular-jwt', 'ngMaterial', 'ui.router']);
```

Test it to make sure everything is working.

#### Create Our 3 Components

Create three subfolders: _home_, _profile_ and _toobar_.  Each needs the following files:

1.  **Home**:
    *   **home.tpl.html** (the main home template)
        ```
        <md-content>
            <h1>Welcome to the Angular Auth App</h1>
            <h3>Login from the toolbar above to access your profile.</h3>
        </md-content>
        ```
2.  **Profile**:
    *   **profile.ctr.js** (the profile controller)
        
        ```javascript
        (function() {
            'use strict';
            
            angular
                .module('authApp')
                .controller('profileController', profileController);
                
            function profileController($http) {
                var vm = this;
                vm.message = 'Hello';
            }
            
        })();
        ```
    
    *   **profile.tpl.html** (the profile template)

        ```
        <h1>{{ user.message }}</h1>
        ```
        
3.  **Toolbar**:
    *   **toolbar.dir.js** (the toolbar directive)
        
        ```javascript
        (function () {
            'use strict';
            
            angular
                .module('authApp')
                .directive('toolbar', toolbar);
                
            function toolbar () {
                return {
                    templateUrl: 'components/toolbar/toolbar.tpl.html',
                    controller : 'toolbarController',
                    controllerAs: 'toolbar'
                }
            }
            
            function toolbarController () {
            
            }
            
        })();
        ```
        
    *   **toolbar.tpl.html** (the toolbar template)
        ```
        <md-toolbar>
            <div class="md-toolbar-tools">
                <h2>
                    <span>Angular Auth</span>
                </h2>
                
                <span flex></span>
                
                <md-button>Login</md-button>
                <md-button>Profile</md-button>
                <md-button>Logout</md-button>
            </div>
        </md-toolbar>

Then we need to add references to these new files in index.html:

```
    <!-- OUR JAVASCRIPT -->
    <script src="js/app.js"                        ></script>
    <script src="components/profile/profile.ctr.js"></script>
    <script src="components/toolbar/toolbar.dir.js"></script>
```

Now we can use our `toolbar` directive in index.html, within the `<body>` tag.  And we'll also need a target for ui-router views:

```
    <body>
        <toolbar></toolbar>
        <div layout-padding>
            <ui-view></ui-view>
        </div>
        ...

```

#### Setup Routing in app.js

The following takes place in a `.config`.  We need some providers so we can use the packages we pulled in:

1.  **$provide** and **authProvider** (to use Auth0)
2.  **$urlRouterProvider** and **$stateProvider** (for routing)
3.  **$httpProvider** (for http interceptors)
4.  **jwtInterceptorProvider**

```javascript
angular
    .module('authApp', ['auth0', 'angular-storage', 'angular-jwt', 'ngMaterial', 'ui.router']);
    
    .config(function($provide, authProvider, $urlRouterProvider, $stateProvider, $httpProvider, jwtInterceptorProvider) {
        
        // routing
        $urlRouterProvider.otherwise('/home');
        
        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: 'components/home/home.tpl.html'
            })
            .state('profile', {
                url: '/profile',
                templateUrl: 'components/profile/profile.tpl.html',
                controller : 'profileController as user'
            });
    })
```

Note that the 'profile' controller uses the alias 'user', so the profile template needs to use the alias 'user.' appended to variables: `{{ user.message }}`, for example.

That completes the base of the application.  After the Node server is set up, we can complete the rest of the Angular app.

### Create a Simple NodeJS Back End with Express

The back end will have public and protected API resources.  Ryan creates an entirely separate project for the back end.  He separately NPM init's the node project and everything.  I didn't.

Dependencies:

1.  **express**
2.  **express-jwt**: package that provides us some middleware to check for a JWT when requests come in and pass the user through to the resource they're looking for if they have a valid JWT
3.  **cors**: required because we're doing _cross-origin requests_

I added `morgan` for nice logging of requests.

#### Setup and Config

Within our `server.js` Node server, we begin by requiring needed modules, telling our app to use `cors` and then we set up our middleware:

```javascript
    var express = require('express'),
        app     = express(),
        jwt     = require('express-jwt'),
        cors    = require('cors'),
        morgan  = require('morgan');
        
    app.use(cors());
    
    var authCheck = jwt({
        secret: new Buffer('auth0gibberishclientsecret', 'base64'),
        audience: 'auth0gibberishclientid'
    });
    
    app.listen(port, function () {
        console.log('Server listening on port ' + port);
    });    
```

Middleware allows us to provide a layer of protection that http requests have to pass through to get to their desired resource.  Instead of checking with each end-point to see if a user has a valid JWT, we can instead setup middleware once and then apply it any end point we want.

Above, `var authCheck = jwt` takes a _configuration object_.  We give that object:

1.  secret: comes from Auth0. These keys are Base64 URL encoded, so we have to decode them with Buffer, which takes 2 arguments:
    1.  the secret (from Auth0 dashboard > 'Client Secret')
    2.  the encoding, in this case: 'base64'
2.  audience: comes from Auth0 dashboard > 'Client ID'

#### Routing End-Points

This will be a simple app with only 2 resources: _public_ & _private_.  To use our middleware, we simply pass it in as a 2nd argument to the private end-point.  Still in server.js:

```javascript
    app.get('/api/public', function (req, res) {
        res.json({ message: "Hello from a public end-point.  You don't need to be authenticated."});
    });
    
    app.get('/api/private', authCheck, function (req, res) {
        res.json({ message: "Hello from a private end-point.  You need to be authenticated."});
    });
```

Now the _private_ route is protected by our middleware, which requires that an authorization header be present to get through to the resource.  If you try to navigate there now (localhost:3000/api/private) you'll get an error: "No authorization token was found".  This is because we don't have a valid JWT token yet.  How do we get one?

### Login and Logout

Now we return to the Angular app.  Again, we're using Auth0's 'Lock' widget - more about it here: https://auth0.com/lock.  It's a login box we can use without doing any code.

To use it, we use **authProvider**, which we pulled in in our `.config`.  `authProvider.init` takes a configuration object, which takes:

1.  **domain**: from Auth0 dashboard > 'Domain'
2.  **clientID**: from Auth0 dashboard > 'Client ID'

Adding this to app.js:

```
    .config(function ($provide, authProvider, $urlRouterProvider, $stateProvider, $httpProvider, jwtInterceptorProvider) {

        authProvider.init({
            domain  : 'belcurv-auth.auth0.com',
            clientID: 'z21JLgCKTTXPTpjhUSREflDexnHrheuz'
        });

        jwtInterceptorProvider.tokenGetter = function (store) {
            return store.get('id_token');
        };
        
        ...
```

Then we need to add some login/logout functions to our toolbar directive's controller.  We first need to inject some dependencies:

1.  **auth**: service that comes from Auth0
2.  **store**: from angular-storage, let's us work with local storage
3.  **$location**: AngularJS server that lets us redirect user upon login

Add to **/public/components/toolbar/toolbar.dir.js**:

```
    function toolbarController (auth, store, $location) {
        
        var vm = this;       // capture variable
        vm.login = login;
        vm.logout = logout;
        vm.auth = auth;
        
        function login() {
            auth.signin({}, function (profile, token) {
                store.set('profile', profile);
                store.set('id_token', token);
                $location.path('/home');
            }, function (err) {
                console.log(err);
            });
        }
        
        function logout() {
            // remove token
            store.remove('profile');
            store.remove('id_token');
            
            // clear state from auth service
            auth.signout();
            
            // redirect home
            $location.path('/home');
        }
    }
```

Above, we:

1.  Attach the **auth** service to our capture variable (`vm.auth = auth`) so we can use it later in our template.  We'll use it to open the Lock widget and make the login request.  It also holds a few properties that are useful for our template.  For example, a property will tell us whether a user is logged in, which we can use to hide/show view elements.
2.  Create a **login** function.  It sends the user's credentials to Auth0 and if everything checks out, stores the token in local storage.  It uses the **auth** service's `.signin()` method, which takes 3 arguments:
    1.  a configuration object, which we leave blank in this example.
    2.  a callback, which
        *   takes two paramters:
            1.  **profile**: JSON object containing our user's profile; comes from Auth0
            2.  **token**: the JWT that gets returned when the user signs in
        *   defines what happens on a successful login:
            1.  store the **profile** into local storage, setting 'profile' to the profile returned by Auth0
            2.  store the **token** into local storage, setting 'id_token' to the token returned by Auth0
            3.  redirect the user to the /home route upon successful login
    3.  Function to handle error conditions.  We just log it.
3.  Create a **logout** function.  This basicaly amounts to removing the token from local storage.  Keep in mind that even if we remove it from the local client's storage, it will still be a valid token in the back-end until it expires and could be used by other clients if they were to get ahold of it.  So, it's crucial that we set our tokens to have a short-ish lifetime.  Something like an hour.  A banking app would have a really short-lived token.  Yes, this means that users will/would have to log back in.  We can get around this using **token refreshing**, which we'll get to a little later.  Anyway, we remove the user's token and then invoke the auth service's signout method:
    1.  remove 'profile'
    2.  remove 'id_token'
    3.  `auth.signout()` set property _if-user-is-authenticated_ back to false
    4.  redirect user to /home route again

Then back in the toolbar template, we add the above functions to the buttons.  Remember that our variables are aliased to 'toolbar', so the functions are prefaced with 'toolbar.':

```
    <md-button aria-label="Login" ng-click="toolbar.login()">
        Login
    </md-button>

    <md-button> Profile </md-button>

    <md-button aria-label="Logout" ng-click="toolbar.logout()">
        Logout
    </md-button>
```

Now we can try signing in our user.  But before we can, we have to tell Auth0 which domains are allowed to make requests to Auth0.  In Auth0 > Dashboard, We have to add http://localhost:3000 to the 'Allowed Origins (CORS)' field.  Save the changes, and we should be able to log in using the email & password for the user we created previously.

So log in!  Once you're authenticated, you can check your token:

Dev Tools > Resources > Local Storage > http:localhost:3000 > bam!

The logout button works too - it removes the profile and token from local storage.

#### Conditionally Show/Hide Toolbar Buttons

1.  If a user is not logged in, they should only see the 'Login' button
2.  If they are logged in, they should see 'Profile' and 'Logout' buttons

So we add some ng-if attributes:

```
    <md-button aria-label="Login"
               ng-click="toolbar.login()"
               ng-if="!toolbar.auth.isAuthenticated">
        Login
    </md-button>

    <md-button aria-label="Profile"
               ui-sref="profile"
               ng-if="toolbar.auth.isAuthenticated">
        Profile
    </md-button>

    <md-button aria-label="Logout"
               ng-click="toolbar.logout()"
               ng-if="toolbar.auth.isAuthenticated">
        Logout
    </md-button>
```

Above, the _.isAuthenticated_ property is on Auth0's **auth** service, and is true or false depending on whether or not the user has a valid JWT.

We also added the ui-route state routing handler to the 'Profile' button.  It will only show if a user is authenticated.

### Sending Authenticated HTTP Requests

Now we need Angular to send the authenticated token with HTTP requests.  Ryan tests requests using Postman.  He manually attaches an Authorization header to a GET request in Postman.  Create a header key "Authorization" and value "Bearer", and then literally copies the token from Chrome and pastes it into Postman.  Sort of like this:

Authorization | Bearer NTcwOWM0ODU0MjJiODYwNjQyODA0MjYyIiwiYXVkIjoiejIxSkx

Sending this request to a private endpoint succeeds.  

in order to get Angular to attach these Authorization headers for us when we make HTTP  requests, we have to make use of the **jwtInterceptorProvider** service we injected.

What does **jwtInterceptorProvider** do?  It uses Angular's HTTP interceptors, which transform requests and responses.  The transformation we want to make is to attach our JWT as an Authorization header before the request goes out.

Back in `/public/js/app.js`:

```javascript
    .config(function ($provide, authProvider, $urlRouterProvider, $stateProvider, $httpProvider, jwtInterceptorProvider) {
        
        authProvider.init({
            domain  : 'belcurv-auth.auth0.com',
            clientID: 'z21JLgCKTTXPTpjhUSREflDexnHrheuz'
        });

        jwtInterceptorProvider.tokenGetter = function (store) {
            return store.get('id_token');
        };
```

In the above, the .tokenGetter method goes to local storage to get to token and give it to the jwtInterceptorProvider, which attaches it to our HTTP request.

Then we have to push our interceptor on to the array of default interceptors that come with Angular.  Down at the end of our app.js:

```javascript
    $httpProvider.interceptors.push('jwtInterceptor');
```

Note that we're pushing on 'jwtInterceptor', which is the name of the interceptor as defined in angular-jwt, and not actually the provider.

### Build Out the Controller

Section 4, Lecture 10
