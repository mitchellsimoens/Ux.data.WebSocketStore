This uses socket.io both on frontend and in the node js server.

Required Node JS Modules
------------------------
* express
* connect-gzip
* socket.io

Build for Ext JS
================

You need to make sure index.html is using ext-debug.js and app.js. You also need to have the Node JS server running.

Mac
---
I have provided a build.sh file, just execute it and it should work.

Windows
-------
Execute:

```
sencha create jsb -a http://localhost:8080/ext4/ -p app.jsb3
sencha build -p app.jsb3 -d ./
```

Build for Sencha Touch 2
========================

Mac & Windows
-------------
```
sencha app build production
```