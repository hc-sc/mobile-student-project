'use strict'

#TODO: PG, Windows Run
#TODO: Add uglify
#TODO: Troubleshoot live reload - bs.stream breaks on more than just less
#TODO: Yargs for better run commands

#Includes
args = require 'yargs'
.argv
bs = require('browser-sync').create()
coffeelint = require 'gulp-coffeelint'
concat = require 'gulp-concat'
cordova = require('cordova-lib').cordova
del = require 'del'
file = require 'gulp-file'
fs = require 'fs'
gulp = require 'gulp'
jshint = require 'gulp-jshint'
jsonlint = require 'gulp-jsonlint'
less = require 'gulp-less'
lesshint = require 'gulp-lesshint'
lrp = require 'gulp-insert-lines'
merge = require 'merge-stream'
pgb = require 'gulp-phonegap-build'
process = require 'process'
release = require 'gulp-github-release'
replace = require 'gulp-replace-task'
rs = require 'run-sequence'
sftp = require 'gulp-sftp'
ssh = require 'gulp-ssh'
zip = require 'gulp-zip'

#Parameters
opts = {
  dev: if args.prod == true then false else true
  prod: if args.prod == true then true else false
  ci: if args.ci == true then true else false
  local: if args.ci == true then false else true
  token: args.PGB_TOKEN
  github: {
    user: args.GITHUB_USER
    password: args.GITHUB_PASSWD
  }
  server: {
    address: args.DEV_SERVER_ADDRESS
    user: args.DEV_SERVER_USER
    password: args.DEV_SERVER_PW
  }
}

#Tasks
gulp.task 'clean', ->
  return del ['www/']

gulp.task 'concat', ->
  pkg = JSON.parse fs.readFileSync './package.json'
  metArray = ['src/lib/met/js/met.base.js']
  for component of pkg.components
    metArray.push 'src/lib/met/js/met.' + component + '.js'
  if opts.dev
    metArray.push 'src/lib/met/js/met.dev.js'
  return gulp.src metArray
    .pipe concat 'met.js', { newLine: '\r\n' }
    .pipe gulp.dest 'www/lib/met/js/'

gulp.task 'config', ->
  pkg = JSON.parse fs.readFileSync './package.json'
  plugins = ""
  if pkg.plugins != ""
    for plugin in pkg.plugins
      plugins += "<plugin "
      for name, value of plugin
        plugins += name + "=\"" + value + "\" "
      plugins += "/>\r\n"
  return gulp.src ['www/**']
    .pipe replace(patterns: [ {
      json:
        'pkg':
          'description': pkg.description
          'ga':
            'id': if opts.dev then pkg.ga.dev.id else pkg.ga.prod.id
            'page': pkg.ga.page
          'id': pkg.id
          'name': pkg.name
          'title': pkg.title
          'version': pkg.version
          'plugins': plugins
    } ])
    .pipe gulp.dest 'www/'
 
#gulp.task 'copy:phonegap', ->
#  assets = gulp.src ['src/assets/**', '!src/assets/less', '!src/assets/less/**']
#    .pipe gulp.dest 'www/assets/'
#  bootstrap = gulp.src 'src/lib/bootstrap/**'
#    .pipe gulp.dest 'www/lib/bootstrap/'
#  jasny = gulp.src 'src/lib/jasny-bootstrap/**'
#    .pipe gulp.dest 'www/lib/jasny-bootstrap/'
#  jquery = gulp.src 'src/lib/jquery/**'
#    .pipe gulp.dest 'www/lib/jquery/'
#  steg = gulp.src 'src/lib/steg/**'
#    .pipe gulp.dest 'www/lib/steg/'
#  fonts = gulp.src 'src/lib/met/fonts/**'
#    .pipe gulp.dest 'www/lib/met/fonts/'
#  images = gulp.src 'src/lib/met/images/**'
#    .pipe gulp.dest 'www/lib/met/images'
#  res = gulp.src 'src/res/**'
#    .pipe gulp.dest 'www/res/'
#  misc = gulp.src ['src/config.xml', 'src/icon.png', 'src/index.html', 'src/splash.png']
#    .pipe gulp.dest 'www/'
#  return merge assets, bootstrap, jquery, steg, fonts, images, res, misc

gulp.task 'copy:web', ->
  assets = gulp.src ['src/assets/**', '!src/assets/less', '!src/assets/less/**']
    .pipe gulp.dest 'www/assets/'
#    .pipe bs.stream()
  bootstrap = gulp.src 'src/lib/bootstrap/**'
    .pipe gulp.dest 'www/lib/bootstrap/'
  jasny = gulp.src 'src/lib/jasny-bootstrap/**'
    .pipe gulp.dest 'www/lib/jasny-bootstrap/'
  bstoggle = gulp.src 'src/lib/bootstrap-toggle/**'
    .pipe gulp.dest 'www/lib/bootstrap-toggle/'
  bsdate= gulp.src 'src/lib/bootstrap-datepicker/**'
    .pipe gulp.dest 'www/lib/bootstrap-datepicker/'
  jquery = gulp.src 'src/lib/jquery/**'
    .pipe gulp.dest 'www/lib/jquery/'
  autogrow = gulp.src 'src/lib/jquery.ns-autogrow/**'
    .pipe gulp.dest 'www/lib/jquery.ns-autogrow/'
  purify = gulp.src 'src/lib/dompurify/**'
    .pipe gulp.dest 'www/lib/dompurify/'
  my = gulp.src 'src/lib/my/**'
    .pipe gulp.dest 'www/lib/my/'
  x2js = gulp.src 'src/lib/x2js/**'
    .pipe gulp.dest 'www/lib/x2js/'
  fonts = gulp.src 'src/lib/met/fonts/**'
    .pipe gulp.dest 'www/lib/met/fonts/'
  images = gulp.src 'src/lib/met/images/**'
    .pipe gulp.dest 'www/lib/met/images'
  index = gulp.src 'src/index.html'
    .pipe gulp.dest 'www/'
  hammer = gulp.src 'src/lib/hammer/**'
    .pipe gulp.dest 'www/lib/hammer'
#    .pipe bs.stream()
  return merge assets, bootstrap, jasny, bstoggle, bsdate, jquery, autogrow, purify, my, x2js, fonts, images, index, hammer

gulp.task 'default', (callback) ->
  rs ['serve'], callback

gulp.task 'dummyfiles:web', ->
  return file 'cordova.js', '', { src: true }
    .pipe gulp.dest 'www/'

#gulp.task 'dummyfiles:phonegap', ->
#  return file 'local.strings', '', { src: true }
#    .pipe gulp.dest 'www/locales/en/'
#    .pipe gulp.dest 'www/locales/fr'
#    .pipe gulp.dest 'www/locales/en-ca/'
#    .pipe gulp.dest 'www/locales/fr-ca/'

#gulp.task 'lint', ->
#  coffee = gulp.src ['*.coffee', 'src/**/*.coffee']
#    .pipe coffeelint {'max_line_length': {'level': 'ignore'}}
#    .pipe coffeelint.reporter()
#  js = gulp.src ['src/assets/js/*.js']
#    .pipe jshint()
#    .pipe jshint.reporter()
#  json = gulp.src ['*.json', 'src/**/*.json', 'src/assets/data/*.json', 'src/assets/data/**/*.json']
#    .pipe jsonlint()
#    .pipe jsonlint.reporter()
#  ls = gulp.src ['src/assets/less/*.less']
#    .pipe lesshint()
#    .pipe lesshint.reporter()
#  return merge coffee, json, js

gulp.task 'less', ->
  gulp.src 'src/lib/met/less/*.less'
    .pipe less()
    .pipe gulp.dest 'www/lib/met/css'
  gulp.src 'src/assets/less/index.less'
    .pipe less()
    .pipe gulp.dest 'www/assets/css/'
    .pipe bs.stream()

#gulp.task 'pgb', ->
#  if opts.local then consts = JSON.parse fs.readFileSync './consts.json', "utf8"
#  pkg = JSON.parse fs.readFileSync './package.json'
#  config = {
#    'appId': pkg.pg_app_id,
#    'user' : {
#      'token': if opts.local then consts.phonegap.token else opts.token
#    },
#    'timeout': 300000
#  }
#  if opts.local
#    config.user.email = consts.phonegap.email
#    config.user.password = consts.phonegap.password
#  gulp.src 'www/**', { dot: true }
#    .pipe pgb config
#  return

#gulp.task 'phonegap', (callback) ->
#  rs 'clean', ['copy:phonegap', 'concat', 'less', 'dummyfiles:phonegap'], 'config', 'pgb', callback
#  return
#
#gulp.task 'test', (callback) ->
#  return

gulp.task 'build', (callback) ->
  rs ['clean'], ['copy:web', 'concat', 'less', 'dummyfiles:web'], 'config', callback
  return callback

#Platform specific code injection tasks
gulp.task 'phone-setup', ['build'], (callback) ->
  gulp.src 'src/index.html'
    .pipe lrp {
      'after': /(?:\<head\>)/gi,
      'lineAfter': '<meta http-equiv="Content-Security-Policy" content="default-src \'self\' data: gap: https://ssl.gstatic.com \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\'; media-src *">'
    }
    .pipe gulp.dest './www'
  gulp.src 'src/assets/js/index.js'
    .pipe lrp {
      'after': /\/\/Wait\sfor\sDOM\/Device\sto\sbe\sready/
      'lineAfter': "    $(document).on('deviceready', app.onDeviceReady);"
    }
    .pipe gulp.dest './www/assets/js'
    
gulp.task 'web-setup', (callback) ->
  gulp.src 'src/assets/js/index.js'
    .pipe lrp {
      'after': /\/\/Wait\sfor\sDOM\/Device\sto\sbe\sready/
      'lineAfter': "    $(document).ready(app.onDeviceReady);"
    }
    .pipe gulp.dest './www/assets/js'

gulp.task 'browser-sync', (callback) ->
  bs.init {
    server: {
      baseDir: "./www"
    }
  }
  gulp.watch ['src/index.html', 'src/assets/js/*.js', 'src/assets/less/*.less'], ['reload']
  
gulp.task 'reload', [ 'copy:web', 'less', 'dummyfiles:web', 'web-setup'], ->
  console.log 'reload...'

#Platform build tasks
gulp.task 'build:android', ['phone-setup', 'build'], (callback) ->
  cordova.build {
    'platforms': [ 'android' ]
    'options': argv: [
      '--info'
      '--debug'
      '--stacktrace'
    ]
  }, callback

gulp.task 'run:android', ['build', 'phone-setup'], (callback) ->
  cordova.run {
    'platforms': [ 'android' ]
    'options': argv: [
      '--stacktrace'
    ]
  }, callback

gulp.task 'build:ios', ['build', 'phone-setup'], (callback) ->
  cordova.build {
    'platforms': [ 'ios' ]
    'options': argv: [ ]
  }, callback

gulp.task 'run:ios', ['build', 'phone-setup'], (callback) ->
  cordova.run {
    'platforms': [ 'ios' ]
    'options': argv: [ ]
  }, callback
  
gulp.task 'build:win', ['build', 'phone-setup'], (callback) ->
  cordova.build {
    'platforms': [ 'windows' ]
    'options': argv: [
      '--phone'
    ]
  }, callback
  
gulp.task 'run', ['build', 'phone-setup'], (callback) ->
  if args.p == 'android' || args.p == 'ios' || args.p == 'win' || args.p == 'windows'
    cordova.run {
      'platforms': [ args.p ]
      'options': argv: [
        '--phone'
      ]
    }, callback

gulp.task 'emu', ['build', 'phone-setup'], (callback) ->
  if args.p == 'android' || args.p == 'ios' || args.p == 'win' || args.p == 'windows'
    cordova.emulate {
      'platforms': [ args.p ]
      'options': argv: [
        '--phone'
      ]
    }, callback
    

#gulp.task 'run:win', ['build', 'phone-setup'], (callback) ->
#  cordova.run {
#    'platforms': [ 'windows' ]
#    'options': argv: [ ]
#  }, callback

gulp.task 'serve', ['build'], (callback) ->
  rs 'web-setup', 'browser-sync', -> cordova.run {
    'platforms': [ 'browser' ],
    'options': argv: [
      '--live-reload'
    ]
  }, callback

#gulp.task 'release', ->
#  if opts.local then consts = JSON.parse fs.readFileSync './consts.json', "utf8"
#  pkg = JSON.parse fs.readFileSync './package.json'
#  return gulp.src 'www/**'
#    .pipe release({
#      tag: pkg.name + "-pg v" + pkg.version,
#      notes: "Proof of Concept phonegap build",
#      prerelease: true,
#    })
#
#gulp.task 'release:pgb', ->
#  if opts.local then consts = JSON.parse fs.readFileSync './consts.json', "utf8"
#  pkg = JSON.parse fs.readFileSync './package.json'
#  return gulp.src 'www/**'
#    .pipe zip 'www.zip'
#    .pipe gulp.dest release({
#      token: if opts.local then consts.github.token else opts.github.password,
#      owner: 'hc-sc',
#      repo: 'met',
#      draft: false,
#      tag: "pg-build-" + pkg.version,
#      name: pkg.name + "-pg v" + pkg.version,
#      notes: "Proof of Concept web build",
#      prerelease: true,
#      manifest: require './package.json'
#    })
#
#gulp.task 'release:web', ->
#  if opts.local then consts = JSON.parse fs.readFileSync './consts.json', "utf8"
#  pkg = JSON.parse fs.readFileSync './package.json'
#  return gulp.src 'www/**'
#    .pipe zip 'www.zip'
#    .pipe gulp.dest release({
#      token: if opts.local then consts.github.token else opts.github.password,
#      owner: 'hc-sc',
#      repo: 'met',
#      draft: false,
#      tag: "web-build-" + pkg.version,
#      name: pkg.name + "-web v" + pkg.version,
#      notes: "Proof of Concept web build",
#      prerelease: true,
#      manifest: require './package.json'
#    })
#
#gulp.task 'web:delete', ->
#  pkg = JSON.parse fs.readFileSync './package.json'
#  if opts.local then consts = JSON.parse fs.readFileSync './consts.json', "utf8"
#  con = new ssh({
#    sshConfig: {
#      host: if opts.local then consts.server.address else opts.server.address,
#      username: if opts.local then consts.server.user else opts.server.user,
#      password: if opts.local then consts.server.password else opts.server.password
#    }
#  })
#  return con.exec 'rm -r /wwwroot/' + pkg.name + '/' + pkg.version, process.stdout
#  .on 'end', ->
#    con.exec 'mkdir /wwwroot/' + pkg.name + "/" + pkg.version, process.stdout
#    .on 'error', (error) ->
#      console.log error.message
#  .on 'error', (error) ->
#    console.log error.message
#    if error.message = ("rm: cannot remove '/wwwroot/" + pkg.name + "/" + pkg.version + "': No such file or directory\n")
#      con.exec 'mkdir /wwwroot/' + pkg.name, process.stdout
#      .on 'end', ->
#        con.exec 'mkdir /wwwroot/' + pkg.name + "/" + pkg.version, process.stdout
#        .on 'error', (error) ->
#          console.log error.message
#      .on 'error', (error) ->
#        console.log error.message
#        if error.message = ("mkdir: cannot create directory '/wwwroot/" + pkg.name + "': File exists\n")
#          con.exec 'mkdir /wwwroot/' + pkg.name + "/" + pkg.version, process.stdout
#          .on 'error', (error) ->
#            console.log error.message
#
#