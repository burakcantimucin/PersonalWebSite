/**
 * Created by burakcan.timucin on 19.9.2017.
 */
"use strict";

//------------------
// Setup Firebase
//------------------
var firebaseConfig = {
    authDomain: "imageapp-26fb1.firebaseapp.com",
    databaseURL: "https://imageapp-26fb1.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);
var presenceRef = firebase.database().ref(".info/connected"),
    usersRef = firebase.database().ref('users'),
    imagesRef = firebase.database().ref('images');

//------------------
// Vue
//------------------
new Vue({
    el: '#vue',

    beforeMount: function beforeMount() {
        this.loginButtonText = this.loginButtonTextOptions.new;
        this.notification = this.notifications["landing"];
        this.logout();
    },
    mounted: function mounted() {
        var _this = this;

        //prevent initial flash
        document.getElementById("vue").classList.remove("hidden");

        //start masonry on data return
        imagesRef.on("value", function () {
            if (_this.loading == true) {
                _this.loading = false;
                Vue.nextTick(_this.startMasonry);
            }
        });
    },
    firebase: function firebase() {
        return {
            users: usersRef,
            images: imagesRef
        };
    },
    data: function data() {
        return {
            //login data
            newUser: {
                username: "",
                password: ""
            },
            myRef: "",
            myKey: "",
            myUsername: "",
            timer: null,
            loginAttempts: 0,
            notifications: {
                "landing": "Üyelik kaydınızı yapınız.",
                "missing1": "Lütfen bir kullanıcı adı ve şifre giriniz.",
                "missing2": "Lütfen bir şifre giriniz.",
                "missing3": "Lütfen bir kullanıcı adı giriniz.",
                "error": "Bir hatayla karşılaştık, lütfen sayfayı tekrar yükleyip deneyiniz.",
                "invalid": "Parolanız geçersiz. Yeni bir parola deneyiniz.",
                "loggedIn": "Bu kullanıcı halihazırda giriş yapmıştır.",
                "lockedOut": "Çok fazla deneme yaptınız. Biraz bekleyin."
            },
            loginButtonTextOptions: {
                "new": "Üyelik Oluştur",
                "existing": "Giriş Yap"
            },
            loginButtonText: "",
            showLogin: false,
            notification: "",
            notificationStatus: "good",
            loggedIn: false,
            //show/hide data
            loading: true,
            showImageModal: false,
            showAddModal: false,
            showDeleteModal: false,
            //masonry
            masonry: '',
            imagesLoaded: false,
            //local data
            imageModalData: {},
            imagesSearchString: '',
            loggedInLoginDescription: 'Giriş yaptınız.',
            modalData: {
                modalType: '',
                title: '',
                url: '',
                tags: [''],
                creator: ''
            }
        };
    },

    computed: {
        filteredImages: function filteredImages() {
            var _this2 = this;

            this.reloadMasonry();

            return this.images.filter(function (images) {
                var searchRegex = new RegExp(_this2.imagesSearchString.replace(/[^a-zA-Z0-9 ]/g, ''), 'i');

                return searchRegex.test(images.title) || searchRegex.test(images.url) || searchRegex.test(images.tags) || searchRegex.test(images.likes) || searchRegex.test(images.views) || searchRegex.test(images.downloads) || searchRegex.test(images.creator);
            });
        }
    },

    methods: {
        //presence methods

        toggleLogin: function toggleLogin() {
            this.showLogin = !this.showLogin;
        },
        isExistingUser: function isExistingUser() {
            for (var i = 0; i < this.users.length; i++) {
                if (this.newUser.username == this.users[i].username) {
                    this.loginButtonText = this.loginButtonTextOptions.existing;
                    return;
                }
            }

            this.loginButtonText = this.loginButtonTextOptions.new;
        },
        login: function login() {
            if (this.newUser.username == "" && this.newUser.password == "") {
                this.notificationStatus = "bad";
                this.notification = this.notifications.missing1;
                return;
            }

            else if (this.newUser.password == "") {
                this.notificationStatus = "bad";
                this.notification = this.notifications.missing2;
                return;
            }

            else if (this.newUser.username == "") {
                this.notificationStatus = "bad";
                this.notification = this.notifications.missing3;
                return;
            }

            if (this.loginAttempts < 5) {
                if (typeof this.users == "undefined" || this.users.length == 0) {
                    this.setPresence();
                    this.toggleLogin();
                }

                for (var i = 0; i < this.users.length; i++) {
                    if (this.newUser.username == this.users[i].username) {
                        if (this.newUser.password != this.users[i].password) {
                            this.loginAttempts++;
                            this.notificationStatus = "bad";
                            this.notification = this.notifications.invalid;
                            return;
                        }

                        if (!!this.users[i].online) {
                            this.loginAttempts++;
                            this.notificationStatus = "bad";
                            this.notification = this.notifications["loggedIn"];
                            return;
                        }

                        this.myKey = this.users[i][".key"];
                        this.myRef = firebase.database().ref('users/' + this.myKey);
                    }
                }

                if (this.newUser.username.trim() != "" && this.newUser.password.trim() != "") {
                    this.setPresence();
                    this.toggleLogin();
                }
            } else {
                this.notificationStatus = "bad";
                this.notification = notifications["lockedOut"];
                return;
            }
        },
        setPresence: function setPresence() {
            var _this3 = this;

            var self = this;

            if (this.myKey == "" && this.newUser.username != "" && this.newUser.password != "") {
                usersRef.push().set({
                    online: true,
                    username: self.newUser.username,
                    password: self.newUser.password

                }, function () {
                    self.myUsername = self.newUser.username;

                    var usersLength = self.users.length;
                    if (usersLength > 0) {
                        usersLength = usersLength - 1;
                    }

                    self.myKey = self.users[usersLength][".key"];
                    self.myRef = firebase.database().ref('users/' + self.myKey);
                    self.myRef.onDisconnect().update({ online: false });
                });
            } else if (typeof this.myKey != "undefined" && this.myKey != "") {
                this.myUsername = this.newUser.username;
                this.myRef.update({ online: true });
                this.myRef.onDisconnect().update({ online: false });
            }

            this.loggedIn = true;

            this.$nextTick(function () {
                if (_this3.myUsername == "" || _this3.myUsername == "undefined") {
                    _this3.myUsername = _this3.newUser.username;
                    _this3.firstLogOn = true;
                }

                var usersLength = _this3.users.length;
                if (usersLength > 0) {
                    usersLength = usersLength - 1;
                }

                if (_this3.myKey == "" || _this3.myKey == "undefined") {
                    _this3.myKey = _this3.users[usersLength][".key"];
                }
            });
        },
        logout: function logout() {
            if (this.myRef != "" && typeof this.myRef != "undefined") {
                this.myUsername = "";
                this.myRef.update({ online: false });
                this.myRef = "";
                this.myKey = "";
                this.newUser = {
                    username: "",
                    password: ""
                };

                this.isExistingUser();
                this.loggedIn = false;
                this.toggleLogin();
            }
        }
    }
});