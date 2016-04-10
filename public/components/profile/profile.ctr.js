/*
 * /public/components/profile/profile.ctr.js
*/

(function () {
    
    'use strict';
    
    angular
        .module('authApp')
        .controller('profileController', profileController);
    
    function profileController($http) {
        
        var vm = this;
        
        vm.message = "hello";
    }
    
})();