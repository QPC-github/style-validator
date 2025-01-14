'use strict';

var STYLEV = STYLEV || {};

STYLEV.TOPPAGE = STYLEV.TOPPAGE || {};

STYLEV.TOPPAGE.FIRST_ANIMATION = {

	execute: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;
		that.setParameter();
		that.bindEvents();
		// that.startAnimation();
		that.animateSVG();
		that.getBookmarklet();
		document.removeEventListener('WebComponentsReady', STYLEV.TOPPAGE.FIRST_ANIMATION.execute);
		//document.querySelector('input[type="text"]').focus();
	},

	setParameter: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		that.html = document.documentElement;
		that.wrapper = document.querySelector('.wrapper');
		that.main = document.querySelector('.main');
		that.header = document.querySelector('.header');
		that.submitForm = document.querySelector('#validation-form');
		that.submitInput = document.querySelector('#validation-input');
		that.submitButton = document.querySelector('#validation-button');
	},

	bindEvents: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		// window.addEventListener('resize', that.adjustWrapperPosition);
		window.addEventListener('scroll', that.fixHeaderOnScroll);
		that.submitForm.addEventListener('submit', that.submitValidation);
	},

	submitValidation: function(event) {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;
		event.preventDefault();
		
		var data = {
			url: that.submitInput.value
		};

		that.submit(data);
	},
	
	submit: function(data) {
		var targetURL;
		if(data.url.indexOf('http') === 0) {
			targetURL = data.url;
		} else {
			targetURL = 'http://' + data.url;
		}

		var apiURI = '/page/result.html?url=' + targetURL;
		location.href = apiURI;
	},

	throwError: function(error) {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;
		throw new Error(error || 'Connection failed.');
	},
	
	startAnimation: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		//setTimeout(that.startFadeIn, 100);
		// setTimeout(that.adjustWrapperPosition, 0);
	},

	adjustWrapperPosition: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		if(that.adjustWrapperPositionTimer !== undefined) {
			clearTimeout(that.adjustWrapperPositionTimer);
		}
		that.adjustWrapperPositionTimer = setTimeout(function() {
			that.wrapper.style.setProperty('padding-top', that.header.offsetHeight + 'px', '');
		}, 0);
	},

	fixHeaderOnScroll: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;
		var isNotDefaultPosY = window.scrollY > 0;
		if(isNotDefaultPosY) {
			that.html.classList.add('is-fixed-header');
		} else {
			that.html.classList.remove('is-fixed-header');
		}
	},

	startFadeIn: function () {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;

		that.main.classList.add('fadeIn');
	},
	
	animateSVG: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;



		new Vivus('vivus-kv-logo', {
			duration: 200,
			file: '/img/style-validator.logo.nopadding.svg',
			type: 'async'
		});
	},

	getBookmarklet: function() {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;
		$.ajax({
			url: $('#bookmarklet').attr('href'),
			dataType: 'text',
			success: that.setBookmarklet
		});
	},

	setBookmarklet: function(data) {
		var that = STYLEV.TOPPAGE.FIRST_ANIMATION;
		$('#bookmarklet').attr('href', data);
	}

};

document.addEventListener('WebComponentsReady', STYLEV.TOPPAGE.FIRST_ANIMATION.execute);
