// Bowlful, a pet tracking app
// Copyright 2016, Carter T. Konz

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('bowlful', ['ionic', 'LocalStorageModule', 'ngCordova']);

app.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
});

app.config(function (localStorageServiceProvider) {
  localStorageServiceProvider
    .setPrefix('bowlful');
});

app.controller('main', function ($scope, $ionicModal, localStorageService, $ionicPopup, $filter, $ionicSideMenuDelegate, $ionicActionSheet, $cordovaCamera) {
  //store the entities name in a variable var petData = 'pet';
  var petData = [];

  //initialize the pets scope with empty array
  $scope.pets = [];

  //initialize the pet scope with empty object
  $scope.resetPet = function (index) {
    $scope.pet = {
      feedLog: [],
      feedStatus: 0
    };
  };

  $scope.resetPet();

  $scope.newPetOptions = {
    kind: [
      {text: "Dog"},
      {text: "Cat"},
      {text: "Bird"}
    ]
  };

  $scope.toggleLeftSideMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

  $scope.photoActionSheet = function() {

    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
      buttons: [
        { text: 'Image from <b>Camera</b>' },
        { text: 'Image from <b>Library</b>' }
      ],
      cancelText: 'Cancel',
      cancel: function() {
           // add cancel code..
         },
      buttonClicked: function(index) {
        //camera
        if (index==0){
          $scope.getPhoto(true);
        }
        //library
        if (index==1){
          $scope.getPhoto(false);
        }
      }
    });

    // For example's sake, hide the sheet after two seconds
    $timeout(function() {
      hideSheet();
    }, 2000);

  };

  $scope.getPhoto = function(camera) {
    function onSuccess(imageData) {
      console.log('success - js call');
      //JS selector call is slightly faster...
      $scope.pet.img = imageData;
      $scope.photoActionSheet.hideSheet();
    }

    function onFail(message) {
      alert('Failed because: ' + message);
    }

    if (camera === true) {
      //Use from Camera
        navigator.camera.getPicture(onSuccess, onFail, {
          quality: 50,
          correctOrientation: true,
          sourceType: Camera.PictureSourceType.CAMERA,
          destinationType: Camera.DestinationType.FILE_URI
        });
    }
    else {
      navigator.camera.getPicture(onSuccess, onFail, {
        sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
        destinationType: Camera.DestinationType.FILE_URI
      });
    }
  };

  //configure the ionic modal before use
  $ionicModal.fromTemplateUrl('new-pet-modal.html', {
      scope: $scope,
      animation: 'slide-in-up'
  }).then(function (modal) {
      $scope.newPetModal = modal;
  });

  // $ionicModal.fromTemplateUrl('add-photo-action-sheet.html', {
  //     scope: $scope,
  //     animation: 'slide-in-up'
  // }).then(function (modal) {
  //     $scope.addPhotoActionSheet = modal;
  // });

  $scope.getPets = function () {
      //fetches pets from local storage
      if (localStorageService.get(petData)) {
        $scope.pets = localStorageService.get(petData);
      } else {
        $scope.pets = [];
      }
  };

  $scope.createPet = function () {
      //creates a new pet
      if (!$scope.pet.img) {
        $scope.pet.img = 'img/ionic.png';
      }
      // $scope.pets.img = $scope.pets.kind + '.png';
      // $scope.pet.img = 'img/ionic.png';
      $scope.pets.push($scope.pet);
      localStorageService.set(petData, $scope.pets);
      $scope.resetPet();
      // refresh pets list
      $scope.getPets();
      //close new pet modal
      $scope.newPetModal.hide();
  };

  $scope.removePet = function (index) {
      //removes a pet
      $scope.pets.splice(index, 1);
      console.log("Pet " + index + " removed.");
      localStorageService.set(petData, $scope.pets);
      $scope.getPets();
  };

  $scope.petDialog = function(index) {
    var lastFed;
    if ($scope.pets[index].feedLog[0]) {
      var current = $scope.pets[index].currentFeed;
      lastFed = 'Last fed: ' + $filter('date')($scope.pets[index].feedLog[current], 'MMM d, h:mm a');
    }
    else {
      lastFed = 'Never';
    }
    var petPopup = $ionicPopup.show({
      title: $scope.pets[index].name,
      subTitle: lastFed,
      buttons: [
        { text: 'Back' },
        {
          text: 'More',
          onTap: function(e) {
            $scope.petOptions(index);
          }
        },
        {
          text: '<b>Feed</b>',
          type: 'button-positive',
          onTap: function(e) {
            $scope.feedPet(index);
          }
        }
      ]
    });
  };

  $scope.petOptions = function(index) {
    var petOptionsPopup = $ionicPopup.show({
      title: $scope.pets[index].name + ' | More',
      buttons: [
        { text: 'Back' },
        {
          text: 'Undo',
          type: 'button-energized',
          onTap: function(e) {
            $scope.undoFeed(index);
          }
        },
        {
          text: 'Clear',
          type: 'button-assertive',
          onTap: function(e) {
            $scope.removePet(index);
          }
        }
      ]
    });
  };


  $scope.feedPet = function (index) {
      //updates a pet as fed
      if (index !== -1) {
        if (!$scope.pets[index].feedLog[0]) {
          $scope.pets[index].feedLog = [];
          $scope.pets[index].feedLog.push(new Date());
          $scope.pets[index].feedStatus = 0;
          $scope.pets[index].currentFeed = 0;
        }
        else {
          var current = $scope.pets[index].feedLog.length;
          $scope.pets[index].feedLog[current] = new Date();
          $scope.pets[index].feedStatus = 0;
          $scope.pets[index].currentFeed += 1;
          //0 is good, 1 is feed soon, 2 is feed asap
        }
      }
      localStorageService.set(petData, $scope.pets);
  };

  $scope.undoFeed = function (index) {
    if (index !== -1) {
      var latest = $scope.pets[index].feedLog.length;
      $scope.pets[index].feedLog.splice(latest - 1, 1);
      $scope.pets[index].currentFeed -= 1;
    }
  };

  $scope.openPetModal = function () {
      $scope.newPetModal.show();
  };

  $scope.closePetModal = function () {
      $scope.newPetModal.hide();
  };

  //manually clear LocalStorageModule. devtool.
  $scope.clearStorage = function () {
      var empty = [];
      localStorageService.set(petData, empty);
      $scope.getPets();
  };

});
