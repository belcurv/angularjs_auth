#### Navigation

* [JSON Web Tokens](#json-web-tokens)
* [Using Auth0 Authentication Brokerage](#using-auth0-authentication-brokerage)
* [Creating the AngularJS Front-End App](#creating-the-angularjs-front-end-app)
* [Create a Simple NodeJS Back End with Express](#create-a-simple-nodejs-back-end-with-express)
* [Login and Logout](#login-and-logout)
* [Sending Authenticated HTTP Requests](#sending-authenticated-http-requests)
* [Preserving Authentication on the Front End](#preserving-authentication-on-the-front-end)
* [What Happens if a Token Expires While We're in the App?](#what-happens-if-a-token-expires-while-were-in-the-app)

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

In the above, the .tokenGetter method goes to local storage to get to token and gives it to the jwtInterceptorProvider, which attaches it to our HTTP request.

Then we have to push our interceptor on to the array of default http interceptors that come with Angular.  Down at the end of our app.js:

```javascript
    $httpProvider.interceptors.push('jwtInterceptor');
```

Note that we're pushing on 'jwtInterceptor', which is the name of the interceptor as defined in angular-jwt, and not actually the provider that we just configured.

#### Build Out the Profile Controller

Back in `public/components/profile/profile.ctr.js`, our profile controller currently looks like this:

```javascript
    (function () {    
        'use strict';

        angular
            .module('authApp')
            .controller('profileController', profileController);

        function profileController($http) {
            var vm = this;        
        }

    })();
```

We're going to need to attach some more properties and functions to `vm`.  As before, we attach them and then define them down below:

1.  We want a function to **get our public messages** from our public end-point
    ```
    vm.getMessage = getMessage;
    ```
    The function uses a $http get request to our public endpoint.  We config $http to NOT include our authorization header.  We don't need to send our JWT for these requests.  This we add `skipAuthorization: true` to the object that is the 2nd argument of the $http.get request.  $http.get returns a promise, so we chain some .thens.  We use the promise response to capture the returned data, and we set vm.message to that response.
    
2.  We want a function to **get our private messages** from our private end-point
    ```
    vm.getSecretMessage = getSecretMessage;
    ```
    This is mostly identical to the above, but this time we don't skip authentication (we omit `skipAuthorization`).
    
3.  We want a property to **hold our messages** (the data coming back from the end point)
    ```
    vm.message;
    ```
4.  We want a profile property for our user.  This will get the profile object from local storage. To use it, we also need to inject `store`.  The profile property gives us access to the user's email, their nickname & their profile photo so we can use them in our template:
    ```
    vm.profile = store.get('profile');
    ```

After adding the above mappings and setting up our functions.  Our Profile controller becomes:

```javascript
    (function () {    
        'use strict';

        angular
            .module('authApp')
            .controller('profileController', profileController);

        function profileController($http, store) {
            var vm = this;
            vm.getMessage = getMessage;
            vm.getSecretMessage = getSecretMessage;
            vm.message;
            
            vm.profile = store.get('profile');
            
            function getMessage () {
                $http.get('http://localhost:3000/api/public', {
                    skipAuthorization: true
                }).then(function(response) {
                    vm.message = response.data.message;
                });
            }
            
            function getSecretMessage () {
                $http.get('http://localhost:3000/api/private')
                    .then(function (response) {
                    vm.message = response.data.message
                    });
            }
        }

    })();
```

Now we can edit our `/public/components/profile/profile.tpl.html` template:

```
<md-content class="md-padding" layout="column">
    <md-card>
        <md-card-title>
            <md-card-title-media>
                <div class="md-media-lg card-media" layout-padding>
                    <img ng-source="{{ user.profile.picture }}" alt="profile-picture">
                </div>
                <md-card-actions layout="column" layout-align="end center">
                    <md-button ng-click="user.getMessage()">
                        Get Message
                    </md-button>
                    <md-button ng-click="user.getSecretMessage()">
                        Get Secret Message
                    </md-button>
                </md-card-actions>
            </md-card-title-media>
            <md-card-title-text>
                <span class="md-headline">{{ user.profile.nickname }}</span>
                <span class="subhead"> {{ user.profile.email }} </span>
                <h3>{{ user.message }}</h3>
            </md-card-title-text>
        </md-card-title>
    </md-card>
</md-content>
```

Remember, the controller for the profile view is aliased to 'user', so all the above functions and model bindings are prefixed with `user`.

*   What ever is **vm.message** in the controller, is templated as **user.message** in the view.
*   What ever is **vm.profile** in the controller, is templated as **user.profile** in the view.

### Preserving Authentication on the Front End

Ok, this all works: we can log in, we get a JWT from Auth0, it's stored in local storage, and authenticated users can view private messages.  But there's a problem.  If we refresh the page we kinda lose our state.  The 'isAuthenticated' boolean that's sitting on the auth service gets flipped to its default, which is 'false'.

Ideally in an AngularJS app there shouldn't be a lot of refreshing, but it could happen.  And if a user leaves the app (closes a tab) and later comes back to it, and their JWT is still valid, they'll be prompted to login again even though their token is still valid.  This isn't a good user experience.

Instead, we want to _persist our state_.  We'll do it by adding logic that watches for changes to our location, and when location changes the app will check to see if the user still has a valid JWT in local storage.  If they do, we'll remind the Angular app that the user is still authenticated.

In `/public/js/app.js` we tap into the `.run()` block.  We already have a `.config` block; we'll chain the `.run` block to/after it:

```javascript
    (function () {
        'use strict';

        angular
            .module('authApp', ['auth0', 'angular-storage', 'angular-jwt', 'ngMaterial', 'ui.router'])

            .config(function ($provide, authProvider, $urlRouterProvider, $stateProvider, $httpProvider, jwtInterceptorProvider) {
                // blah blah config code
            })  // <- GET RID OF THE SEMICOLON BEFORE CHAINING RUN BLOCK

            .run(function ($rootScope, auth, store, jwtHelper, $location) {

                $rootScope.$on('$locationChangeStart', function () {

                    var token = store.get('id_token');
                    if (token) {
                        if (!jwtHelper.isTokenExpired(token)) {
                            if (!auth.isAuthenticated) {
                                auth.authenticate(store.get('profile'), token);
                            }
                        }
                    } else {
                        $location.path('/home');
                    }
                });
            });

    })();
```

In a `.run()` block we define logic that we want to have happen after the application is already running.  `.run` takes a function where we inject any dependencies we need:

1.  **$rootScope**: the spot where we watch for changes.  
2.  **auth**: auth service
3.  **store**: local storage service
4.  **jwtHelper**: service coming from angular-jwt that gives us some tools for inspecting JWTs.
5.  **$location**: allows us to navigate to a different spot in our application. We use it to redirect to /home if no valid token.

We use the `$rootScopt.on()` method to watch for a location change event: 'locationChangeStart'. That will trigger any time we move to a new location/route in the app, or any time the page gets refreshed. 

The 2nd paramter is our callback.  We first try to get a token from local storage:

```javascript
    var token = store.get('id_token');
```

Then we use nested conditionals to:
1.  check whether 'id_token' exists:
    ```javascript
    var token = store.get('id_token');
    if (token) {
        // do work
    }
    ```
2.  if that's true, we check if the token is NOT expired:
    ```javascript
    var token = store.get('id_token');
    if (token) {
        if (!jwtHelper.isTokenExpired(token)) {
            // do work
        }
    }
    ```
3.  if those are both true, we check if the user is NOT authenticated:
    ```javascript
    var token = store.get('id_token');
     if (token) {
        if (!jwtHelper.isTokenExpired(token)) {
            if (!auth.isAuthenticated) {

                // then authenticate the user
                auth.authenticate(store.get('profile'), token);
            }
        }
    }
    ```

Describing the conditionals...  IF there is a token, and IF that token is not expired, and IF the user is not currently authenticated, THEN authenticate them.

If the above conditionals fail, our else {} block redirect the user to the `/home` route so they can log in again.

### What Happens if a Token Expires While We're in the App?

That signals that the user needs to log back in.  We do this by wiring up a **http interceptor** that looks for a status code (401, for example).  If that status code is received by the front-end, it will log the user out and redirect them to the `/home` route where they can log in again.

We set this up in the `.config()` block of our `/public/js/app.js` file.  We write a function (redirect) to do this.  The function takes some paramters/dependencies:

1.  **q**: the async service from AngularJS
2.  **$injector**: AngularJS service
3.  **auth**: our auth service
4.  **store**: local storage
5.  **$location**: for route changes

Abridged app.js:

```javascript
    .config(function ($provide, authProvider, $urlRouterProvider, $stateProvider, $httpProvider, jwtInterceptorProvider) {
        
            authProvider.init(...);
        
            jwtInterceptorProvider.tokenGetter = function (store) {...};

            $urlRouterProvider.otherwise('/home');
        
            $stateProvider
                .state('home', {...})
                .state('profile', {...});
        
            function redirect($q, $injector, auth, store, $location) {
                return {
                    responseError: function(rejection) {
                        if (rejection.status === 401) {
                            auth.signout();
                            store.remove('profile');
                            store.remove('id_token');
                            $location.path('/home');
                        }
                        
                        return $q.reject(rejection);
                    }
                }
            }
        
            $provide.factory('redirect', redirect);
            $httpProvider.interceptors.push('redirect');
            ...
```

The `redirect` function returns an object containing at least one property: `responseError`.  `responseError` equals a function that receives the rejection if there's one present.  If we get one, and its status is 401, then we:

1.  log the user out (`auth.signout()`),
2.  remove their profile and token from local storage
3.  send the user back to the '/home' route
4.  return a rejection from $q (`return $q.reject(rejection)`).

That's what we want to happen if a 401 rejection comes back, but we still need to let Angular know about this interceptor.  To do this, we make a **factory** out of it with the $provide service:

```javascript
    $provide.factory('redirect', redirect);
```

That creates a factory called 'redirect' that takes our redirect function.  Then we need to push our 'redirect' factory on to the array of default http interceptors:

```javascript
    $httpProvider.interceptors.push('redirect');
```

Ryan tests the above by logging in, displaying a private message, manually deleting a few characters of the local JWT using Chrome dev tools, and refreshing the page.  It works: he is redirected to the '/home' route.  And the 401 (Unauthorized) error is logged to dev tools console.

#### The remaining lectures discus social login & multi-factor.
