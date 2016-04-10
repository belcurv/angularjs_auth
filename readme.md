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

## JSON Web Tokens

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

## Using Auth0 Authentication 'Brokerage'

Auth0 offloads the tricky parts of authentication for us.  Basically Auth0 has our user database.  Our app's login feature sends credentials to Autho0, and if everything checks out they'll get a JWT back from Auth0.  After that we can use the JWT to secure our own server.

Auth0 can do social login, multi-factor, single sign-on, passwordless login.

