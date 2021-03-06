var _ = require("underscore"),
    child_process = require("child_process");

function init(path) {
  var obj = new R(path);
  return _.bindAll(obj, "data", "call", "callSync", "callDetached");
}

function R(path) {
  this.d = {};
  this.path = path;
  this.options = {
    env: _.extend({DIRNAME: __dirname}, process.env),
    encoding: "utf8"
  };
  this.idCounter = 0;
  this.args = ["--vanilla", __dirname + "/R/launch.R"];
}

R.prototype.data = function() {
  for (var i = 0; i < arguments.length; i++) {
    this.d[++this.idCounter] = arguments[i];
  }
  return this;
};

R.prototype.callDetached = function(_opts, _callback) {
  var callback = _callback || _opts;
  var opts = _.isFunction(_opts) ? {} : _opts;
  this.options.env.input = JSON.stringify([this.d, this.path, opts]);
  this.options.detached = true;
  this.options.stdio = 'ignore';

  var child = child_process.spawn("Rscript", this.args, this.options);
  pid = child.pid;
  child.unref();
  console.log("R Child-process pid: " + child.pid);
  var body  = { out: "", err: "", timeout: false};

  return pid;
};


R.prototype.call = function(_opts, _callback) {
  var callback = _callback || _opts;
  var opts = _.isFunction(_opts) ? {} : _opts;
  this.options.env.input = JSON.stringify([this.d, this.path, opts]);

  var child = child_process.spawn("Rscript", this.args, this.options);
  console.log("R Child-process pid: " + child.pid);
  var body  = { out: "", err: "", timeout: false};
  if (_opts.timeout) {
   setTimeout(function(){
     child.stdin.pause(); // Required to make sure KILL works
     child.kill();
     body.timeout = true;
   }, _opts.timeout);
  }
  child.stdout.on("data", function(d) {
    body.out += d;
  });
  child.stdout.on("end", function() {
    if (body.timeout) callback(new Error('Too long run... terminated'));
    if (!body.err) callback(null, JSON.parse(body.out));
  });
  return child.pid;
};

R.prototype.callDetached = function(_opts, _callback) {
  var callback = _callback || _opts;
  var opts = _.isFunction(_opts) ? {} : _opts;
  this.options.env.input = JSON.stringify([this.d, this.path, opts]);
  this.options.detached = true;
  this.options.stdio = 'ignore';

  var child = child_process.spawn("Rscript", this.args, this.options);
  pid = child.pid;
  child.unref();
  console.log("R Child-process pid: " + child.pid);
  var body  = { out: "", err: "", timeout: false};
  
  return pid;
};

R.prototype.callSync = function(_opts) {
  var opts = _opts || {};
  this.options.env.input = JSON.stringify([this.d, this.path, opts]);
  var child = child_process.spawnSync("Rscript", this.args, this.options);
  console.log("Sync R child-process pid: " + child.pid);

  return(JSON.parse(child.stdout));
};

module.exports = init;