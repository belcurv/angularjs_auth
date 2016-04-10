/*
 * /public/js/app.js
*/

(function () {
    
    'use strict';
    
    angular
        .module('authApp', ['auth0', 'angular-storage', 'angular-jwt', 'ngMaterial', 'ui.router'])
    
        .config(function ($provide, authProvider, $urlRouterProvider, $stateProvider, $httpProvider, jwtInterceptorProvider) {
        
            authProvider.init({
                domain  : 'belcurv-auth.auth0.com',
                clientID: 'z21JLgCKTTXPTpjhUSREflDexnHrheuz'
            });
        
            jwtInterceptorProvider.tokenGetter = function (store) {
                return store.get('id_token');
            };

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
        
            $httpProvider.interceptors.push('jwtInterceptor');
        
        })
    
})();