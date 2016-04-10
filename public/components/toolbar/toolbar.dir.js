/*
 * /public/components/toolbar/toolbar.dir.js
*/

(function () {
    
    'use strict';
    
    angular
        .module('authApp')
        .directive('toolbar', toolbar);
    
    function toolbar() {
        return {
            templateUrl : 'components/toolbar/toolbar.tpl.html',
            controller  : toolbarController,
            controllerAs: 'toolbar'
        };
    }
    
    function toolbarController (auth, store, $location) {
        
        var vm = this;
        
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
    
})();