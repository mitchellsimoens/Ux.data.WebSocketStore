#!/bin/bash

rm -rf all-classes.js
rm -rf app-all.js
rm -rf app.jsb3

sencha create jsb -a http://localhost:8080/ext4/ -p app.jsb3

sencha build -p app.jsb3 -d ./
